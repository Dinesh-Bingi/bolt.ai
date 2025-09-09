declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayConfig {
  keyId: string;
}

export const razorpayConfig: RazorpayConfig = {
  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || ''
};

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Load Razorpay script
export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create Razorpay checkout
export const createRazorpayCheckout = async (options: RazorpayOptions): Promise<void> => {
  const isLoaded = await loadRazorpay();
  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  if (!razorpayConfig.keyId) {
    throw new Error('Razorpay configuration is missing. Please contact support.');
  }

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};

// Validate Razorpay configuration
export const validateRazorpayConfig = (): boolean => {
  return !!(razorpayConfig.keyId && razorpayConfig.keyId !== '');
};

// Test Razorpay connection
export const testRazorpayConnection = async (): Promise<boolean> => {
  try {
    const isLoaded = await loadRazorpay();
    return isLoaded && validateRazorpayConfig();
  } catch (error) {
    console.error('Razorpay connection test failed:', error);
    return false;
  }
};