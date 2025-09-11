import React, { useState } from 'react';
import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Heart, Infinity, Star, CreditCard } from 'lucide-react';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import PricingCard from '../components/PricingCard';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../hooks/useAuth';
import { usePayments } from '../hooks/usePayments';
import PaymentModal from '../components/PaymentModal';

// Lazy load heavy components
const ParticleBackground = lazy(() => import('../components/ParticleBackground'));

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  
  const { user, isAuthenticated } = useAuth();
  const { createCheckoutSession, plans } = usePayments();

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      setAuthMode('signup');
      setAuthModalOpen(true);
      return;
    }

    if (planId === 'free') {
      onGetStarted();
      return;
    }

    try {
      await createCheckoutSession(user!.id, planId);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      onGetStarted();
    } else {
      setAuthMode('signup');
      setAuthModalOpen(true);
    }
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white overflow-hidden">
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-6"
      >
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold">⚰️</span>
            </div>
            <span className="text-xl font-bold">Legacy.ai</span>
          </div>
          <div className="space-x-4">
            {isAuthenticated ? (
              <Button onClick={onGetStarted}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={handleSignIn}>Sign In</Button>
                <Button onClick={handleGetStarted}>Get Started</Button>
              </>
            )}
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 text-center py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              Immortality
            </span>
            <br />
            <span className="text-white">as a Service</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Preserve your memories, voice, and essence forever. Create a personalized AI that family can interact with for generations to come.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              icon={ArrowRight}
              className="text-lg px-8 py-4"
            >
              Start Your Legacy
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              className="text-lg px-8 py-4"
            >
              See How It Works
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How Legacy.ai Works</h2>
            <p className="text-xl text-gray-300">Three simple steps to digital immortality</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Share Your Story",
                description: "Answer thoughtful questions about your life, upload photos, and record your voice to capture your unique essence."
              },
              {
                icon: Star,
                title: "AI Creates Your Digital Self",
                description: "Advanced AI learns your personality, speech patterns, and memories to create an authentic digital representation."
              },
              {
                icon: Infinity,
                title: "Connect Forever",
                description: "Family can chat with your AI, hear your voice, and see your 3D avatar, keeping your memory alive for generations."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <GlassCard hover className="text-center">
                  <feature.icon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Choose Your Legacy Plan</h2>
            <p className="text-xl text-gray-300 mb-6">Select the perfect plan for your digital immortality journey</p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-300 font-bold text-xs">UPI</span>
                </div>
                <span>Instant UPI Payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-yellow-300" />
                </div>
                <span>All Cards Accepted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-yellow-300" />
                </div>
                <span>100% Secure</span>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                title={plan.name}
                price={plan.price}
                period={plan.interval || (plan.price === 0 ? 'forever' : 'once')}
                popular={plan.id === 'premium'}
                description={plan.description}
                features={plan.features}
                onSelect={() => handleSubscribe(plan.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <GlassCard className="text-center">
            <Shield className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Your Privacy is Sacred</h2>
            <p className="text-gray-300 text-lg mb-8">
              Your memories and data are encrypted and secured with enterprise-grade protection. 
              Only you control who can access your digital legacy.
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="text-lg px-8 py-4"
            >
              Begin Your Immortal Journey
            </Button>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Legacy.ai. Preserving memories for eternity</p>
          <p>All rights reserved to Unickx</p>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        planId={selectedPlan}
        planName={plans.find(p => p.id === selectedPlan)?.name || ''}
        planPrice={plans.find(p => p.id === selectedPlan)?.price === 0 ? '$0' : `$${plans.find(p => p.id === selectedPlan)?.price}`}
      />
    </div>
  );
}