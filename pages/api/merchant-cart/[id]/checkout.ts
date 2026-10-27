import type { NextApiRequest, NextApiResponse } from 'next';
import { checkoutIssues, unprocessable } from '../../../../lib/merchantCart';
import { matchesCatalog } from '../../../../lib/orders';
import { PayPalError, captureOrder, getOrder } from '../../../../lib/paypal';
import { admitStoreSyncRequest } from '../../../../lib/storeSync';

// Store Sync: POST captures the cart's PayPal order. The order, with the
// buyer's items and shipping address, then shows in the PayPal account like
// any other sale.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await admitStoreSyncRequest(req, res, ['POST']))) return;
  const id = String(req.query.id);
  if (!/^[A-Z0-9-]{1,64}$/i.test(id)) return res.status(400).json({ name: 'INVALID_REQUEST', message: 'Invalid cart id' });

  try {
    const order = await getOrder(id);
    // Anyone can create a PayPal order with our public client id; only
    // capture orders that match today's catalog.
    if (!matchesCatalog(order)) {
      return res.status(422).json(unprocessable([{ code: 'CART_PRICES_CHANGED', type: 'CART', message: 'This cart does not match current prices. Update the cart and try again.' }]));
    }
    const issues = checkoutIssues(order);
    if (issues.length) return res.status(422).json(unprocessable(issues));

    const captured = await captureOrder(id);
    const capture = (captured as { purchase_units?: { payments?: { captures?: { id: string }[] } }[] }).purchase_units?.[0]?.payments?.captures?.[0];
    return res.status(200).json({
      id,
      status: 'COMPLETED',
      payment_confirmation: { order_number: id, paypal_order_id: id, ...(capture ? { capture_id: capture.id } : {}), status: captured.status },
    });
  } catch (error) {
    if (error instanceof PayPalError && error.status === 404) return res.status(404).json({ name: 'NOT_FOUND', message: 'No cart with this id' });
    if (error instanceof PayPalError && error.details.some((d) => d.issue === 'INSTRUMENT_DECLINED')) {
      return res.status(422).json(unprocessable([{ code: 'PAYMENT_DECLINED', type: 'CART', message: 'The payment was declined.' }]));
    }
    console.error('Capturing a Store Sync order failed:', error instanceof Error ? error.message : error);
    return res.status(502).json({ name: 'PAYPAL_ERROR', message: 'Could not capture the PayPal order.' });
  }
}
