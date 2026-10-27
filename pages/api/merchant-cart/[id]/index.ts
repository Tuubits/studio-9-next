import { randomUUID } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { cartResponse, checkCart, orderFor, unprocessable } from '../../../../lib/merchantCart';
import { PayPalError, createOrder, getOrder, patchOrder } from '../../../../lib/paypal';
import { admitStoreSyncRequest } from '../../../../lib/storeSync';

// PayPal orders can be changed until they are captured.
const UPDATABLE = ['CREATED', 'APPROVED', 'PAYER_ACTION_REQUIRED'];
const UNIT = "/purchase_units/@reference_id=='default'";

// Store Sync: PUT replaces the whole cart. The PayPal order is updated to
// match; if it has expired or can no longer change, a new order (and so a new
// cart id) is returned.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await admitStoreSyncRequest(req, res, ['PUT']))) return;
  const id = String(req.query.id);
  if (!/^[A-Z0-9-]{1,64}$/i.test(id)) return res.status(400).json({ name: 'INVALID_REQUEST', message: 'Invalid cart id' });

  const cart = checkCart(req.body);
  if (!cart) return res.status(400).json({ name: 'INVALID_REQUEST', message: 'Each item needs a variant_id and a whole-number quantity.' });
  const order = orderFor(cart);
  if (!order) return res.status(422).json(unprocessable(cart.issues));

  try {
    let existing = null;
    try {
      existing = await getOrder(id);
    } catch (error) {
      if (!(error instanceof PayPalError && error.status === 404)) throw error;
    }
    if (existing && UPDATABLE.includes(existing.status)) {
      const unit = order.purchase_units[0];
      await patchOrder(id, [
        { op: 'replace', path: `${UNIT}/items`, value: unit.items },
        { op: 'replace', path: `${UNIT}/amount`, value: unit.amount },
        ...(unit.shipping
          ? [{ op: existing.purchase_units?.[0]?.shipping ? ('replace' as const) : ('add' as const), path: `${UNIT}/shipping`, value: unit.shipping }]
          : []),
      ]);
      return res.status(200).json(cartResponse(id, order, cart.issues));
    }
    const created = await createOrder(order, randomUUID());
    return res.status(200).json(cartResponse(created.id, order, cart.issues));
  } catch (error) {
    console.error('Updating a Store Sync order failed:', error instanceof Error ? error.message : error);
    return res.status(502).json({ name: 'PAYPAL_ERROR', message: 'Could not update the PayPal order.' });
  }
}
