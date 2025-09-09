import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Crown, Zap, Shield } from 'lucide-react';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';

interface PricingCardProps {
  title: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  description: string;
  onSelect: () => void;
  loading?: boolean;
}

export default function PricingCard({ 
  title, 
  price, 
  period, 
  features, 
  popular = false, 
  description,
  onSelect,
  loading = false
}: PricingCardProps) {
  const formatPrice = (amount: number) => {
    if (amount === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getIcon = () => {
    switch (title.toLowerCase()) {
      case 'premium':
        return Crown;
      case 'lifetime':
        return Zap;
      default:
        return Star;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative"
    >
      {popular && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg"
        >
          <Star className="w-4 h-4 mr-1" />
          Most Popular
        </motion.div>
      )}
      
      <GlassCard className={`text-center h-full relative overflow-hidden ${
        popular ? 'border-yellow-400/50 bg-gradient-to-br from-yellow-400/5 to-purple-400/5' : ''
      }`}>
        {/* Background gradient for popular plan */}
        {popular && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-purple-400/5 to-blue-400/5 pointer-events-none" />
        )}
        
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              popular ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-purple-400 to-blue-400'
            }`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm mb-6 min-h-[40px]">{description}</p>
          
          <div className="mb-6">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-1">
              {formatPrice(price)}
            </div>
            <div className="text-gray-400 text-sm">
              {period === 'month' ? 'per month' : period === 'year' ? 'per year' : period}
            </div>
            {price > 0 && (
              <div className="mt-2 flex items-center justify-center space-x-2">
                <span className="text-xs text-gray-500">Pay with</span>
                <div className="flex space-x-1">
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">UPI</span>
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">Cards</span>
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">Wallets</span>
                </div>
              </div>
            )}
          </div>

          <ul className="space-y-3 mb-8 text-left">
            {features.map((feature, index) => (
              <motion.li 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start text-gray-300"
              >
                <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <Button
            onClick={onSelect}
            disabled={loading}
            variant={popular ? 'primary' : 'secondary'}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              `Choose ${title}`
            )}
          </Button>

          {title === 'Free' && (
            <p className="text-xs text-gray-500 mt-3">
              No credit card required
            </p>
          )}
          
          {price > 0 && (
            <div className="mt-3 flex items-center justify-center space-x-2">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-xs text-gray-400">Secured by Razorpay</span>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}