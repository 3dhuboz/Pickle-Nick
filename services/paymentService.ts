import { AppSettings } from '../types';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

declare global {
  interface Window {
    Square?: any;
  }
}

// Loads the Square Web Payments SDK script once
let squareScriptPromise: Promise<void> | null = null;
const loadSquareSDK = (sandbox: boolean): Promise<void> => {
  if (squareScriptPromise) return squareScriptPromise;
  squareScriptPromise = new Promise((resolve, reject) => {
    if (window.Square) { resolve(); return; }
    const src = sandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Square SDK'));
    document.head.appendChild(script);
  });
  return squareScriptPromise;
};

// Mounts a Square card element into the given container div.
// Returns a cleanup function and a tokenize function.
export const mountSquareCard = async (
  containerId: string,
  settings: AppSettings
): Promise<{ tokenize: () => Promise<string>; destroy: () => void }> => {
  const appId = settings.squareApplicationId;
  const locationId = settings.squareLocationId;
  const isSandbox = !appId || appId.startsWith('sandbox');

  if (!appId || !locationId) {
    throw new Error('Square is not configured. Please set Application ID and Location ID in Settings.');
  }

  await loadSquareSDK(isSandbox);

  const payments = window.Square.payments(appId, locationId);
  const card = await payments.card({
    style: {
      '.input-container': { borderRadius: '12px', borderColor: 'rgba(0,0,0,0.08)' },
      '.input-container.is-focus': { borderColor: '#6CBEBC' },
      input: { fontSize: '16px', color: '#1a1a1a' },
    },
  });
  await card.attach(`#${containerId}`);

  return {
    tokenize: async () => {
      const result = await card.tokenize();
      if (result.status === 'OK') return result.token;
      const msg = result.errors?.[0]?.message || 'Card tokenization failed';
      throw new Error(msg);
    },
    destroy: () => { try { card.destroy(); } catch { /* ignore */ } },
  };
};

// Sends the Square source token to the Worker to charge the card
export const processPayment = async (
  sourceId: string,
  amount: number,
  currency = 'AUD'
): Promise<PaymentResult> => {
  const idempotencyKey = `pn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, amount, currency, idempotencyKey }),
  });

  const data = await res.json() as any;

  if (!res.ok) {
    return { success: false, error: data.error || 'Payment failed' };
  }

  return { success: true, transactionId: data.transactionId };
};
