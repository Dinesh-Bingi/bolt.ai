import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './ui/Button';
import GlassCard from './ui/GlassCard';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup' | 'forgot-password';
  onModeChange: (mode: 'signin' | 'signup' | 'forgot-password') => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, resetPassword, loading, error: authError } = useAuth();

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (mode !== 'forgot-password') {
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (mode === 'signup') {
        if (!name.trim()) {
          errors.name = 'Name is required';
        }
        if (password !== confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearMessages = () => {
    setLocalError('');
    setSuccess('');
    setValidationErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'forgot-password') {
        const result = await resetPassword(email);
        if (result.error) {
          setLocalError(result.error);
        } else {
          setSuccess('Password reset email sent! Check your inbox.');
        }
      } else if (mode === 'signup') {
        const result = await signUp(email, password, name);
        if (result.error) {
          setLocalError(result.error);
          return;
        }
        setSuccess('Account created successfully! Please check your email to verify your account.');
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setLocalError(result.error);
          return;
        }
        onClose();
        resetForm();
      }
    } catch (err: any) {
      setLocalError(err.message || 'An unexpected error occurred');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    clearMessages();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Your Legacy';
      case 'forgot-password': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  const getSubmitText = () => {
    if (loading) return 'Processing...';
    switch (mode) {
      case 'signup': return 'Create Legacy';
      case 'forgot-password': return 'Send Reset Email';
      default: return 'Sign In';
    }
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
              <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4"
              >
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
              </motion.div>
            )}

            {/* Error Messages */}
            {(localError || authError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-red-200 text-sm">{localError || authError}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field - Only for signup */}
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full bg-white/5 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                      validationErrors.name ? 'border-red-500/50' : 'border-white/20 focus:border-purple-400'
                    }`}
                  />
                  {validationErrors.name && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-white/5 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                    validationErrors.email ? 'border-red-500/50' : 'border-white/20 focus:border-purple-400'
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
                )}
              </div>

              {/* Password Field - Not for forgot password */}
              {mode !== 'forgot-password' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
              )}
                      validationErrors.password ? 'border-red-500/50' : 'border-white/20 focus:border-purple-400'
              {/* Confirm Password Field - Only for signup */}
              {mode === 'signup' && (
                  <button
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    onClick={() => setShowPassword(!showPassword)}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-white/5 border rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                      validationErrors.confirmPassword ? 'border-red-500/50' : 'border-white/20 focus:border-purple-400'
                    }`}
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {validationErrors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {getSubmitText()}
              </Button>
            </form>

            {/* Forgot Password Link */}
            {mode === 'signin' && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => onModeChange('forgot-password')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Mode Switch */}
            <div className="mt-6 text-center">
              {mode === 'forgot-password' ? (
                <p className="text-gray-400">
                  Remember your password?
                  <button
                    onClick={() => onModeChange('signin')}
                    className="text-purple-400 hover:text-purple-300 ml-1 font-medium"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p className="text-gray-400">
                  {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    onClick={() => onModeChange(mode === 'signup' ? 'signin' : 'signup')}
                    className="text-purple-400 hover:text-purple-300 ml-1 font-medium"
                  >
                    {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}