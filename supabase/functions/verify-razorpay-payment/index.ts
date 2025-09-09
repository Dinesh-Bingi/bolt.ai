import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId: string;
  planId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planId
    }: VerifyRequest = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !planId) {
      throw new Error('Missing required payment verification parameters');
    }

    // Verify signature
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      throw new Error('Razorpay configuration missing');
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const isValidSignature = expectedSignature === razorpay_signature;

    if (!isValidSignature) {
      // Log failed verification
      await supabase
        .from('payment_logs')
        .insert({
          user_id: userId,
          event_type: 'payment.verification_failed',
          razorpay_data: {
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            provided_signature: razorpay_signature,
            expected_signature: expectedSignature
          },
          processed: false,
          error_message: 'Invalid payment signature'
        });

      throw new Error('Payment verification failed - invalid signature');
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or unauthorized');
    }

    // Update payment order status
    const { error: updateOrderError } = await supabase
      .from('payment_orders')
      .update({
        payment_id: razorpay_payment_id,
        status: 'paid',
        verified_at: new Date().toISOString(),
      })
      .eq('order_id', razorpay_order_id);

    if (updateOrderError) {
      console.error('Failed to update order:', updateOrderError);
    }

    // Update user subscription
    const subscriptionUpdate = {
      subscription: planId,
      subscription_status: 'active',
    };

    const { error: userUpdateError } = await supabase
      .from('users')
      .update(subscriptionUpdate)
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Failed to update user subscription:', userUpdateError);
      throw new Error('Failed to activate subscription');
    }

    // Create subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        razorpay_order_id,
        razorpay_payment_id,
        amount: order.amount,
        status: 'active',
      });

    if (subscriptionError) {
      console.error('Failed to create subscription record:', subscriptionError);
    }

    // Log successful payment
    await supabase
      .from('payment_logs')
      .insert({
        user_id: userId,
        event_type: 'payment.verified',
        razorpay_data: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
          plan_id: planId,
          amount: order.amount
        },
        processed: true,
      });

    return new Response(
      JSON.stringify({ 
        verified: true,
        message: 'Payment verified and subscription activated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Payment verification failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Payment verification failed',
        verified: false,
        code: 'VERIFICATION_FAILED'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});