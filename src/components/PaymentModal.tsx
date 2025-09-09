import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield, IndianRupee, CheckCircle, AlertCircle, Smartphone, Wallet } from 'lucide-react';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';
import { usePayments } from '../hooks/usePayments';
import { useAuth } from '../hooks/useAuth';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  planPrice: number;
}

export default function PaymentModal({ isOpen, onClose, planId, planName, planPrice }: PaymentModalProps) {
  const { createCheckoutSession, loading, formatPrice } = usePayments();
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePayment = async () => {
    if (!user) {
      setErrorMessage('Please sign in to continue');
      return;
    }
    
    setPaymentStatus('processing');
    setErrorMessage('');
    
    try {
      await createCheckoutSession(user.id, planId);
      setPaymentStatus('success');
    } catch (error: any) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Payment failed. Please try again.');
    }
  };

  const handleClose = () => {
    setPaymentStatus('idle');
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <GlassCard>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Upgrade to {planName}</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {paymentStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-6"
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Payment Successful!</h3>
                <p className="text-gray-300">Your subscription has been activated.</p>
              </motion.div>
            )}

            {paymentStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <h3 className="font-semibold text-red-400">Payment Failed</h3>
                </div>
                <p className="text-red-200 text-sm">{errorMessage}</p>
              </motion.div>
            )}

            {paymentStatus !== 'success' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                    {formatPrice(planPrice)}
                  </div>
                  <p className="text-gray-300">
                    {planId === 'lifetime' ? 'One-time payment' : 'Per month'}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-gray-300">
                    <Smartphone className="w-5 h-5 text-blue-400 mr-3" />
                    <span>UPI - Pay instantly with any UPI app</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CreditCard className="w-5 h-5 text-green-400 mr-3" />
                    <span>Credit/Debit Cards - Visa, Mastercard, RuPay</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Wallet className="w-5 h-5 text-purple-400 mr-3" />
                    <span>Wallets - Paytm, PhonePe, Google Pay</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Shield className="w-5 h-5 text-yellow-400 mr-3" />
                    <span>256-bit SSL encryption</span>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={loading || paymentStatus === 'processing'}
                  className="w-full"
                  size="lg"
                  icon={CreditCard}
                >
                  {paymentStatus === 'processing' ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Opening Razorpay...
                    </div>
                  ) : (
                    `Pay ${formatPrice(planPrice)}`
                  )}
                </Button>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-6" />
                    <span className="text-xs text-gray-400">Powered by Razorpay</span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    By subscribing, you agree to our Terms of Service and Privacy Policy.
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    Secure payments processed by Razorpay. Your data is protected.
                  </p>
                  <p className="text-xs text-gray-400 text-center">
                    Cancel anytime from your dashboard.
                  </p>
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}