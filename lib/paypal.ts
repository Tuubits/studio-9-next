// Server-only PayPal Orders v2 client. Never import this from a page or
// component: it reads the PayPal secret.
//
// PAYPAL_API_BASE picks the environment: sandbox by default, and it must be
// https://api-m.paypal.com in production. The client id and secret must come
// from the same environment. Tests point it at a local mock.

const SANDBOX = 'https://api-m.sandbox.paypal.com';

export class PayPalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: { issue?: string }[] = [],
  ) {
    super(message);
  }
}

function config() {
  // Names as set in Netlify; the client id and secret come from the same PayPal app.
  const clientId = process.env.Paypal_Client_2026;
  const secret = process.env.Paypal_secret_2026;
  if (!clientId || !secret) throw new PayPalError('PayPal is not configured (Paypal_Client_2026 and Paypal_secret_2026)', 503);
  return { clientId, secret, base: (process.env.PAYPAL_API_BASE || SANDBOX).replace(/\/$/, '') };
}

let token: { value: string; expires: number; key: string } | null = null;

async function accessToken() {
  const { clientId, secret, base } = config();
  const key = `${base} ${clientId}`;
  if (token && token.key === key && token.expires > Date.now()) return token.value;
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new PayPalError(`PayPal authentication failed (${response.status})`, 502);
  const data = (await response.json()) as { access_token: string; expires_in: number };
  // Renew a minute early.
  token = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000, key };
  return token.value;
}

async function call<T>(method: string, path: string, body?: unknown, requestId?: string): Promise<T> {
  const { base } = config();
  const response = await fetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PayPalError(data.message || `PayPal ${method} ${path} failed`, response.status, data.details);
  }
  return data as T;
}

export type Money = { currency_code: 'USD'; value: string };

export type OrderRequest = {
  intent: 'CAPTURE';
  purchase_units: {
    amount: Money & { breakdown: { item_total: Money; shipping: Money } };
    items: { name: string; sku: string; quantity: string; unit_amount: Money; category: 'PHYSICAL_GOODS' }[];
  }[];
  application_context: { shipping_preference: 'GET_FROM_FILE' };
};

export type Order = OrderRequest & {
  id: string;
  status: string;
  payer?: { name?: { given_name?: string } };
};

export const createOrder = (order: OrderRequest, requestId: string) =>
  call<{ id: string; status: string }>('POST', '/v2/checkout/orders', order, requestId);

export const getOrder = (id: string) => call<Order>('GET', `/v2/checkout/orders/${encodeURIComponent(id)}`);

// JSON Patch operations, e.g. replacing the amount after a shipping change.
export const patchOrder = (id: string, operations: { op: 'replace' | 'add' | 'remove'; path: string; value?: unknown }[]) =>
  call<void>('PATCH', `/v2/checkout/orders/${encodeURIComponent(id)}`, operations);

export const captureOrder = (id: string) =>
  call<Order>('POST', `/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {}, `capture-${id}`);
