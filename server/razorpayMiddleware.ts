import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

import fs from 'fs';
import path from 'path';

/**
 * Razorpay Credentials from project .env or environment
 */
function getCredentials() {
  let envSecret = '';
  let envKeyId = '';

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const secretMatch = content.match(/^RAZORPAY_KEY_SECRET=["']?([^"'\r\n]+)["']?/m);
      if (secretMatch) envSecret = secretMatch[1].trim();
      const keyIdMatch = content.match(/^(?:VITE_)?RAZORPAY_KEY_ID=["']?([^"'\r\n]+)["']?/m);
      if (keyIdMatch) envKeyId = keyIdMatch[1].trim();
    }
  } catch {
    // ignore
  }

  const keyId = envKeyId || process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TdgxuEhylJmIL8';
  const keySecret = envSecret || process.env.RAZORPAY_KEY_SECRET || '5TZvpGruilSs614nQMCbzt2B';
  return { keyId, keySecret };
}

/**
 * Handles Razorpay Order Creation via official REST API
 */
export async function handleCreateOrder(body: {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}): Promise<{ status: number; data: any }> {
  const { keyId, keySecret } = getCredentials();

  if (!keyId || !keySecret) {
    return {
      status: 500,
      data: { success: false, error: 'Razorpay credentials not configured on server' },
    };
  }

  const amountPaise = Math.round(body.amount);
  if (isNaN(amountPaise) || amountPaise < 100) {
    return {
      status: 400,
      data: { success: false, error: 'Minimum order amount is 100 paise (₹1.00)' },
    };
  }

  const payload = {
    amount: amountPaise,
    currency: body.currency || 'INR',
    receipt: body.receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    notes: body.notes || {},
  };

  try {
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Razorpay Order Creation Failed]:', data);
      return {
        status: response.status,
        data: { success: false, error: data?.error?.description || 'Failed to create order with Razorpay' },
      };
    }

    return {
      status: 200,
      data: {
        success: true,
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
        receipt: data.receipt,
        key_id: keyId,
      },
    };
  } catch (err: any) {
    console.error('[Razorpay Order API Network Error]:', err);
    return {
      status: 500,
      data: { success: false, error: err.message || 'Internal server error' },
    };
  }
}

/**
 * Handles Razorpay Payment Signature Verification using HMAC SHA-256
 */
export async function handleVerifyPayment(body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ status: number; data: any }> {
  const { keySecret } = getCredentials();

  if (!keySecret) {
    return {
      status: 500,
      data: { success: false, error: 'Razorpay secret not configured on server' },
    };
  }

  const orderId = body.razorpay_order_id || (body as any).order_id || (body as any).orderId;
  const paymentId = body.razorpay_payment_id || (body as any).payment_id || (body as any).paymentId;
  const signature = body.razorpay_signature || (body as any).signature;

  if (!orderId || !paymentId || !signature) {
    return {
      status: 400,
      data: { success: false, error: 'Missing payment signature verification parameters' },
    };
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const genBuf = Buffer.from(generatedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');

    const isMatch = genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf);

    if (isMatch) {
      return {
        status: 200,
        data: {
          success: true,
          verified: true,
          payment_id: paymentId,
          order_id: orderId,
        },
      };
    } else {
      return {
        status: 400,
        data: { success: false, verified: false, error: 'Invalid payment signature' },
      };
    }
  } catch (err: any) {
    console.error('[Signature Verification Error]:', err);
    return {
      status: 400,
      data: { success: false, verified: false, error: 'Payment signature verification failed' },
    };
  }
}

/**
 * Vite Dev Server Middleware Plugin for Razorpay Endpoints
 */
export function razorpayApiPlugin() {
  return {
    name: 'razorpay-api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/create-order' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(bodyStr || '{}');
              const result = await handleCreateOrder(parsed);
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result.data));
            } catch (e: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
            }
          });
          return;
        }

        if (url === '/api/verify-payment' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(bodyStr || '{}');
              const result = await handleVerifyPayment(parsed);
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result.data));
            } catch (e: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
