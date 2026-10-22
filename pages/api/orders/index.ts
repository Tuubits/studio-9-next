import { randomUUID } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { buildOrder } from '../../../lib/orders';
import { PayPalError, createOrder } from '../../../lib/paypal';

// POST { items: [{ id, quantity }] } -> { id } (the PayPal order id).
// Prices and shipping come from the catalog, never from the request.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const built = buildOrder(req.body);
  if ('error' in built) return res.status(422).json(built);
  try {
    const order = await createOrder(built.order, randomUUID());
    return res.status(201).json({ id: order.id });
  } catch (error) {
    console.error('Creating a PayPal order failed:', error instanceof Error ? error.message : error);
    const status = error instanceof PayPalError && error.status === 503 ? 503 : 502;
    return res.status(status).json({ error: 'We couldn’t start the PayPal checkout. Please try again.' });
  }
}
