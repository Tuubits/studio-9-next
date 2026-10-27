import { randomUUID } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { cartResponse, checkCart, orderFor, unprocessable } from '../../../lib/merchantCart';
import { createOrder } from '../../../lib/paypal';
import { admitStoreSyncRequest } from '../../../lib/storeSync';

// Store Sync: POST creates a cart. Prices and shipping come from the catalog;
// the cart id and payment token are the PayPal order id.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await admitStoreSyncRequest(req, res, ['POST']))) return;

  const cart = checkCart(req.body);
  if (!cart) return res.status(400).json({ name: 'INVALID_REQUEST', message: 'Each item needs a variant_id and a whole-number quantity.' });
  const order = orderFor(cart);
  if (!order) return res.status(422).json(unprocessable(cart.issues));

  try {
    const created = await createOrder(order, randomUUID());
    return res.status(201).json(cartResponse(created.id, order, cart.issues));
  } catch (error) {
    console.error('Creating a Store Sync order failed:', error instanceof Error ? error.message : error);
    return res.status(502).json({ name: 'PAYPAL_ERROR', message: 'Could not create the PayPal order.' });
  }
}
