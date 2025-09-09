import { useState, useEffect } from 'react';
import { paymentService, SUBSCRIPTION_PLANS } from '../api/payments';
import { testRazorpayConnection } from '../lib/razorpay';
import type { PaymentOrder } from '../api/payments';

export function usePayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentOrder[]>([]);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    // Test Razorpay connection on mount
    testRazorpayConnection().then(setRazorpayReady);
  }, []);

  const createCheckoutSession = async (userId: string, planId: string) => {
    if (!razorpayReady) {
      throw new Error('Payment system is not ready. Please refresh the page and try again.');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.createCheckoutSession(userId, planId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = async (userId: string) => {
    try {
      return await paymentService.getSubscriptionStatus(userId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getPaymentHistory = async (userId: string) => {
    try {
      const history = await paymentService.getPaymentHistory(userId);
      setPaymentHistory(history);
      return history;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const cancelSubscription = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await paymentService.cancelSubscription(userId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return paymentService.formatPrice(price);
  };

  return {
    loading,
    error,
    razorpayReady,
    plans: SUBSCRIPTION_PLANS,
    paymentHistory,
    createCheckoutSession,
    getSubscriptionStatus,
    getPaymentHistory,
    cancelSubscription,
    formatPrice,
  };
}