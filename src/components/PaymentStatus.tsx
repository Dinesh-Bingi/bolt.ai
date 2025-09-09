import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';

interface PaymentStatusProps {
  orderId?: string;
  paymentId?: string;
  onClose: () => void;
}

export default function PaymentStatus({ orderId, paymentId, onClose }: PaymentStatusProps) {
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (orderId || paymentId) {
      checkPaymentStatus();
    }
  }, [orderId, paymentId]);

  const checkPaymentStatus = async () => {
    try {
      // Simulate payment status check
      setTimeout(() => {
        if (paymentId) {
          setStatus('success');
          setMessage('Payment completed successfully! Your subscription is now active.');
        } else {
          setStatus('failed');
          setMessage('Payment was not completed. Please try again.');
        }
      }, 2000);
    } catch (error) {
      setStatus('failed');
      setMessage('Unable to verify payment status. Please contact support.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-400" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-400" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-16 h-16 text-blue-400 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <GlassCard>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-6"
            >
              {getStatusIcon()}
            </motion.div>

            <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
              {status === 'checking' && 'Verifying Payment...'}
              {status === 'success' && 'Payment Successful!'}
              {status === 'failed' && 'Payment Failed'}
              {status === 'pending' && 'Payment Pending'}
            </h2>

            <p className="text-gray-300 mb-6">{message}</p>

            {status === 'checking' && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
              </div>
            )}

            {status !== 'checking' && (
              <div className="space-y-3">
                <Button onClick={onClose} className="w-full">
                  {status === 'success' ? 'Continue to Dashboard' : 'Close'}
                </Button>
                
                {status === 'failed' && (
                  <Button variant="secondary" className="w-full">
                    Try Again
                  </Button>
                )}
              </div>
            )}

            {(orderId || paymentId) && (
              <div className="mt-6 p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Reference Details:</p>
                {orderId && <p className="text-xs text-gray-300">Order: {orderId}</p>}
                {paymentId && <p className="text-xs text-gray-300">Payment: {paymentId}</p>}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}