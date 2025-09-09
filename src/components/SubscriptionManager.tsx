import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Calendar, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../hooks/useAuth';
import type { PaymentOrder } from '../api/payments';

export default function SubscriptionManager() {
  const { user } = useAuth();
  const { 
    getSubscriptionStatus, 
    getPaymentHistory, 
    cancelSubscription, 
    formatPrice,
    loading 
  } = usePayments();
  
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentOrder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;
    
    try {
      const [status, history] = await Promise.all([
        getSubscriptionStatus(user.id),
        getPaymentHistory(user.id)
      ]);
      
      setSubscriptionStatus(status);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !confirm('Are you sure you want to cancel your subscription?')) return;
    
    try {
      await cancelSubscription(user.id);
      await loadSubscriptionData();
      alert('Subscription cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please contact support.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'canceled': return 'text-red-400';
      case 'past_due': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'canceled': return AlertTriangle;
      case 'past_due': return AlertTriangle;
      default: return Crown;
    }
  };

  if (loadingData) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading subscription details...</p>
        </div>
      </GlassCard>
    );
  }

  const StatusIcon = getStatusIcon(subscriptionStatus?.subscription_status || 'active');

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Current Subscription</h3>
          <div className={`flex items-center space-x-2 ${getStatusColor(subscriptionStatus?.subscription_status || 'active')}`}>
            <StatusIcon className="w-5 h-5" />
            <span className="capitalize">{subscriptionStatus?.subscription_status || 'Active'}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Crown className="w-8 h-8 text-purple-400" />
              <div>
                <h4 className="text-lg font-semibold text-white capitalize">
                  {subscriptionStatus?.subscription || 'Free'} Plan
                </h4>
                <p className="text-gray-400 text-sm">
                  {subscriptionStatus?.subscription === 'lifetime' 
                    ? 'Lifetime access' 
                    : subscriptionStatus?.subscription === 'premium'
                    ? 'Monthly subscription'
                    : 'Free tier'
                  }
                </p>
              </div>
            </div>

            {subscriptionStatus?.subscription !== 'free' && subscriptionStatus?.subscription_status === 'active' && (
              <Button
                onClick={handleCancelSubscription}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="text-red-400 hover:text-red-300"
              >
                Cancel Subscription
              </Button>
            )}
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              {subscriptionStatus?.subscription === 'free' 
                ? 'Free' 
                : subscriptionStatus?.subscription === 'premium'
                ? '₹1,299/month'
                : '₹29,999 (Lifetime)'
              }
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {subscriptionStatus?.subscription === 'lifetime' 
                ? 'Paid once, yours forever' 
                : 'Billed monthly'
              }
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <GlassCard>
          <h3 className="text-xl font-semibold text-white mb-6">Payment History</h3>
          
          <div className="space-y-3">
            {paymentHistory.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium capitalize">{payment.plan_id} Plan</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(payment.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-white font-semibold">
                    {formatPrice(payment.amount)}
                  </p>
                  <p className={`text-sm capitalize ${
                    payment.status === 'paid' ? 'text-green-400' : 
                    payment.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {payment.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Payment Security Info */}
      <GlassCard>
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Payment Security</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-medium text-white mb-1">🔒 Bank-level Security</p>
            <p>All payments are processed through Razorpay's secure infrastructure</p>
          </div>
          <div>
            <p className="font-medium text-white mb-1">🛡️ Data Protection</p>
            <p>Your payment information is never stored on our servers</p>
          </div>
          <div>
            <p className="font-medium text-white mb-1">💳 Multiple Options</p>
            <p>UPI, Credit/Debit Cards, Net Banking, Wallets</p>
          </div>
          <div>
            <p className="font-medium text-white mb-1">📱 Mobile Optimized</p>
            <p>Seamless payment experience on all devices</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}