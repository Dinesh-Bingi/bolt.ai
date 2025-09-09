export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const handlePaymentError = (error: any): string => {
  console.error('Payment error:', error);

  if (error instanceof PaymentError) {
    switch (error.code) {
      case 'INVALID_PLAN':
        return 'The selected plan is not available. Please choose a different plan.';
      case 'USER_NOT_FOUND':
        return 'User account not found. Please sign in again.';
      case 'ORDER_CREATION_FAILED':
        return 'Unable to create payment order. Please try again.';
      case 'VERIFICATION_FAILED':
        return 'Payment verification failed. If amount was deducted, please contact support.';
      default:
        return error.message;
    }
  }

  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};

export const logError = async (error: any, context: string, userId?: string) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    userId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('Error logged:', errorData);
  
  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or a custom logging endpoint
};