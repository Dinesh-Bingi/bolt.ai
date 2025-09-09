import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      throw new Error('Missing razorpay signature header');
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }
    
    // Verify webhook signature
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const event = JSON.parse(body);
    console.log('Webhook event received:', event.event);

    // Log all webhook events
    await supabase
      .from('payment_logs')
      .insert({
        event_type: event.event,
        razorpay_data: event,
        processed: false,
      });

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        // Get order details from database
        const { data: order } = await supabase
          .from('payment_orders')
          .select('user_id, plan_id, amount')
          .eq('order_id', orderId)
          .single();

        if (order) {
          // Update user subscription
          await supabase
            .from('users')
            .update({
              subscription: order.plan_id,
              subscription_status: 'active',
            })
            .eq('id', order.user_id);

          // Update payment order
          await supabase
            .from('payment_orders')
            .update({
              payment_id: payment.id,
              status: 'paid',
              verified_at: new Date().toISOString(),
            })
            .eq('order_id', orderId);

          // Create/update subscription record
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: order.user_id,
              plan_id: order.plan_id,
              razorpay_order_id: orderId,
              razorpay_payment_id: payment.id,
              amount: order.amount,
              status: 'active',
            });

          console.log(`Payment captured for user ${order.user_id}, plan ${order.plan_id}`);
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        await supabase
          .from('payment_orders')
          .update({
            payment_id: payment.id,
            status: 'failed',
          })
          .eq('order_id', orderId);

        console.log(`Payment failed for order ${orderId}`);
        break;
      }

      case 'order.paid': {
        const order = event.payload.order.entity;
        
        await supabase
          .from('payment_orders')
          .update({
            status: 'paid',
          })
          .eq('order_id', order.id);

        console.log(`Order paid: ${order.id}`);
        break;
      }

      case 'subscription.cancelled': {
        const subscription = event.payload.subscription.entity;
        const notes = subscription.notes;
        
        if (notes && notes.user_id) {
          await supabase
            .from('users')
            .update({
              subscription: 'free',
              subscription_status: 'canceled',
            })
            .eq('id', notes.user_id);

          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
            })
            .eq('razorpay_subscription_id', subscription.id);

          console.log(`Subscription cancelled for user ${notes.user_id}`);
        }
        break;
      }

      case 'subscription.charged': {
        const subscription = event.payload.subscription.entity;
        const notes = subscription.notes;
        
        if (notes && notes.user_id) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'active',
            })
            .eq('id', notes.user_id);

          console.log(`Subscription charged for user ${notes.user_id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    // Mark webhook as processed
    await supabase
      .from('payment_logs')
      .update({ processed: true })
      .eq('event_type', event.event)
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ received: true, event: event.event }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Webhook processing failed',
        received: false 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});