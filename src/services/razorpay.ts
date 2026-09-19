import { supabase } from '../supabase';

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayCheckoutOptions {
  planId: 'free' | 'plus' | 'unlimited' | string;
  planName: string;
  amountInr: number;
  user?: {
    uid?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  onSuccess: (res: RazorpayPaymentSuccessResponse) => void;
  onFailure?: (error: any) => void;
}

export interface RazorpayDirectPaymentOptions {
  amountInr: number;
  title?: string;
  description: string;
  user?: {
    uid?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  notes?: Record<string, any>;
  onSuccess: (res: RazorpayPaymentSuccessResponse) => void;
  onFailure?: (error: any) => void;
}

/**
 * Dynamically ensures the Razorpay Checkout script is loaded
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Sanitizes prefill data to avoid Razorpay client-side validation errors
 */
function sanitizePrefill(user?: { name?: string; email?: string; phone?: string } | null): Record<string, string> {
  if (!user) return {};
  const prefill: Record<string, string> = {};

  if (user.name && typeof user.name === 'string') {
    const cleanName = user.name.replace(/•••+/g, '').trim();
    if (cleanName.length > 0) prefill.name = cleanName;
  }

  if (user.email && typeof user.email === 'string') {
    const cleanEmail = user.email.trim();
    if (cleanEmail.includes('@') && cleanEmail.includes('.')) prefill.email = cleanEmail;
  }

  if (user.phone && typeof user.phone === 'string') {
    const cleanPhone = user.phone.replace(/[^\d+]/g, '');
    if (cleanPhone.replace(/\D/g, '').length >= 10) prefill.contact = cleanPhone;
  }

  return prefill;
}

/**
 * Calls backend to create a Razorpay Order
 */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt?: string,
  notes?: Record<string, any>
): Promise<{ order_id: string; amount: number; currency: string; key_id?: string } | null> {
  try {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountPaise, receipt, notes }),
    });
    const data = await res.json();
    if (data && data.success && data.order_id) {
      return data;
    }
    console.warn('Order creation returned non-success:', data);
    return null;
  } catch (err) {
    console.warn('Network error creating Razorpay order:', err);
    return null;
  }
}

/**
 * Calls backend to verify Razorpay HMAC SHA-256 signature
 */
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<{ success: boolean; verified: boolean }> {
  try {
    const res = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    });
    const data = await res.json();
    return {
      success: Boolean(data?.success),
      verified: Boolean(data?.verified),
    };
  } catch (err) {
    console.error('Network error verifying payment signature:', err);
    return { success: false, verified: false };
  }
}

/**
 * Standard Razorpay Checkout for Fees & Vault Top-Ups with Server Signature Verification
 */
export async function openRazorpayPaymentModal({
  amountInr,
  title = 'CoPassage Platform Fee',
  description,
  user,
  notes = {},
  onSuccess,
  onFailure,
}: RazorpayDirectPaymentOptions) {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !(window as any).Razorpay) {
    alert('Razorpay Checkout failed to initialize. Please check your internet connection.');
    onFailure?.(new Error('Razorpay SDK failed to load'));
    return;
  }

  const amountPaise = Math.round(amountInr * 100);

  // 1. Create order on backend
  const order = await createRazorpayOrder(amountPaise, `fee_${Date.now()}`, {
    ...notes,
    user_uid: user?.uid || 'guest',
  });

  if (!order || !order.order_id) {
    alert('Unable to initialize payment with Razorpay. Please check connection and try again.');
    onFailure?.(new Error('Razorpay order creation failed'));
    return;
  }

  const effectiveKeyId = order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TdgxuEhylJmIL8';

  const options: any = {
    key: effectiveKeyId,
    amount: order.amount || amountPaise,
    currency: order.currency || 'INR',
    name: 'CoPassage',
    description,
    image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
    order_id: order.order_id,
    prefill: sanitizePrefill(user),
    notes: {
      ...notes,
      user_uid: user?.uid || 'guest',
      title,
    },
    theme: {
      color: '#0F2A4A',
    },
    modal: {
      ondismiss: () => {
        onFailure?.(new Error('Payment sheet dismissed by user'));
      },
    },
    handler: async (response: RazorpayPaymentSuccessResponse) => {
      // 2. Server-side signature verification if order_id is present
      if (response.razorpay_order_id && response.razorpay_signature) {
        const verification = await verifyRazorpayPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );

        if (!verification.verified) {
          console.error('Payment signature verification failed server-side!');
          alert('Payment verification failed. Please contact support.');
          onFailure?.(new Error('Payment signature verification failed'));
          return;
        }
      }

      onSuccess(response);
    },
  };

  const razorpayInstance = new (window as any).Razorpay(options);
  razorpayInstance.on('payment.failed', function (response: any) {
    console.error('Razorpay Payment failed:', response.error);
    onFailure?.(response.error);
  });
  razorpayInstance.open();
}

/**
 * Client checkout launcher for CoPassage subscriptions
 */
export const openRazorpayCheckout = async ({
  planId,
  planName,
  amountInr,
  user,
  onSuccess,
  onFailure,
}: RazorpayCheckoutOptions) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    alert('Razorpay Checkout failed to initialize. Please check your internet connection.');
    onFailure?.(new Error('Razorpay SDK failed to load'));
    return;
  }

  const amountPaise = Math.round(amountInr * 100);
  const order = await createRazorpayOrder(amountPaise, `sub_${planId}_${Date.now()}`, {
    plan_id: planId,
    user_uid: user?.uid || 'guest',
  });

  if (!order || !order.order_id) {
    alert('Unable to initialize subscription checkout. Please try again.');
    onFailure?.(new Error('Subscription order creation failed'));
    return;
  }

  const effectiveKeyId = order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TdgxuEhylJmIL8';

  const options = {
    key: effectiveKeyId,
    amount: order.amount || amountPaise,
    currency: order.currency || 'INR',
    name: 'CoPassage',
    description: `CoPassage ${planName} Plan Subscription`,
    image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
    order_id: order.order_id,
    prefill: sanitizePrefill(user),
    notes: {
      plan_id: planId,
      user_uid: user?.uid || 'guest',
      platform: 'CoPassage Web',
    },
    theme: {
      color: '#0F2A4A',
    },
    modal: {
      ondismiss: () => {
        onFailure?.(new Error('Payment cancelled by user'));
      },
    },
    handler: async (response: RazorpayPaymentSuccessResponse) => {
      if (response.razorpay_order_id && response.razorpay_signature) {
        const verification = await verifyRazorpayPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
        if (!verification.verified) {
          console.error('Subscription payment signature verification failed');
          onFailure?.(new Error('Signature verification failed'));
          return;
        }
      }

      if (user?.uid) {
        try {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: planId,
              last_payment_id: response.razorpay_payment_id,
              subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', user.uid);
        } catch (err) {
          console.warn('Notice updating profile subscription:', err);
        }
      }

      try {
        localStorage.setItem(
          'copassage_active_plan',
          JSON.stringify({
            planId,
            planName,
            paymentId: response.razorpay_payment_id,
            activatedAt: new Date().toISOString(),
            expiryAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
        );
      } catch (e) {
        // ignore
      }

      onSuccess(response);
    },
  };

  const razorpayInstance = new (window as any).Razorpay(options);
  razorpayInstance.on('payment.failed', function (response: any) {
    console.error('Razorpay Payment failed:', response.error);
    onFailure?.(response.error);
  });
  razorpayInstance.open();
};
