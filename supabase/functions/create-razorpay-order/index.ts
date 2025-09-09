import { createClient } from 'npm:@supabase/supabase-js@2';
import Razorpay from 'npm:razorpay@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OrderRequest {
  userId: string;
  planId: string;
  plan: {
    id: string;
    name: string;
    price: number;
    interval: string | null;
  };
  userEmail: string;
  userName: string;
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

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay configuration missing');
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const { userId, planId, plan, userEmail, userName }: OrderRequest = await req.json();

    if (!userId || !planId || !plan) {
      throw new Error('Missing required parameters');
    }

    // Validate plan
    const validPlans = ['free', 'premium', 'lifetime'];
    if (!validPlans.includes(planId)) {
      throw new Error('Invalid plan selected');
    }

    // Create Razorpay order
    const orderOptions = {
      amount: plan.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `legacy_${userId}_${Date.now()}`,
      notes: {
        user_id: userId,
        plan_id: planId,
        plan_name: plan.name,
        user_email: userEmail,
        user_name: userName,
        service: 'legacy_ai'
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    if (!order || !order.id) {
      throw new Error('Failed to create Razorpay order');
    }

    // Store order in database for verification
    const { error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        order_id: order.id,
        user_id: userId,
        plan_id: planId,
        amount: plan.price,
        currency: 'INR',
        status: 'created',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store order information');
    }

    // Log the order creation
    await supabase
      .from('payment_logs')
      .insert({
        user_id: userId,
        event_type: 'order.created',
        razorpay_data: order,
        processed: true,
      });

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpayKeyId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Order creation failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment order',
        code: 'ORDER_CREATION_FAILED'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});