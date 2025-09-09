import { supabase } from '../lib/supabase';
import { createRazorpayCheckout, razorpayConfig, validateRazorpayConfig } from '../lib/razorpay';
import type { RazorpayResponse } from '../lib/razorpay';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year' | null;
  features: string[];
  popular?: boolean;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    description: 'Perfect for getting started with your digital legacy',
    features: [
      'Basic text chatbot',
      'Essential life story questions',
      'Simple memorial page',
      'Basic privacy settings',
      'Community support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1299, // ₹1,299 per month
    interval: 'month',
    popular: true,
    description: 'Complete digital immortality experience',
    features: [
      'Everything in Free',
      'Voice cloning & playback',
      'Video & voice calls with AI',
      '3D holographic avatar',
      'Advanced AI personality',
      'Family guestbook',
      'Priority support',
      'Custom memorial themes',
      'Advanced privacy controls'
    ]
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 29999, // ₹29,999 one-time
    interval: null,
    description: 'Secure your digital legacy forever',
    features: [
      'Everything in Premium',
      'Unlimited video/voice calls',
      'Permanent hosting guarantee',
      'Advanced customization',
      'Multiple avatar styles',
      'API access for developers',
      'White-glove setup service',
      'Family account management',
      'Legacy transfer options'
    ]
  }
];

export interface PaymentOrder {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export class PaymentService {
  async createCheckoutSession(userId: string, planId: string): Promise<void> {
    if (!validateRazorpayConfig()) {
      throw new Error('Payment system is not properly configured. Please contact support.');
    }

    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid subscription plan selected');
      }

      if (plan.price === 0) {
        // Handle free plan upgrade
        await this.upgradeFreeUser(userId);
        return;
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Unable to retrieve user information');
      }

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          userId,
          planId,
          plan,
          userEmail: user.email,
          userName: user.name
        }
      });

      if (error) {
        console.error('Order creation error:', error);
        throw new Error('Failed to create payment order. Please try again.');
      }

      // Open Razorpay checkout
      const options = {
        key: razorpayConfig.keyId,
        amount: data.amount,
        currency: 'INR',
        name: 'Legacy.ai',
        description: `${plan.name} Plan - Digital Immortality Service`,
        order_id: data.order_id,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#8B5CF6'
        },
        handler: async (response: RazorpayResponse) => {
          await this.verifyPayment(response, userId, planId);
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled by user');
          }
        }
      };

      await createRazorpayCheckout(options);
    } catch (error) {
      console.error('Checkout session creation failed:', error);
      throw error;
    }
  }

  async verifyPayment(paymentResponse: RazorpayResponse, userId: string, planId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          userId,
          planId
        }
      });

      if (error) {
        console.error('Payment verification error:', error);
        throw new Error('Payment verification failed. Please contact support if amount was deducted.');
      }

      if (data.verified) {
        // Payment successful - show success message and reload
        alert('Payment successful! Your subscription has been activated.');
        window.location.reload();
      } else {
        throw new Error('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      alert('Payment verification failed. If amount was deducted, please contact support with your payment ID.');
      throw error;
    }
  }

  async upgradeFreeUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription: 'free',
          subscription_status: 'active'
        })
        .eq('id', userId);

      if (error) throw error;
      
      alert('Welcome to Legacy.ai! Your free account is ready.');
      window.location.reload();
    } catch (error) {
      console.error('Free upgrade failed:', error);
      throw new Error('Failed to activate free account');
    }
  }

  async getSubscriptionStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription, subscription_status')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      throw error;
    }
  }

  async getPaymentHistory(userId: string): Promise<PaymentOrder[]> {
    try {
      const { data, error } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw error;
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    try {
      // Update user subscription status
      const { error } = await supabase
        .from('users')
        .update({
          subscription: 'free',
          subscription_status: 'canceled'
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  }
}

export const paymentService = new PaymentService();