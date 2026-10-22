import type { NextApiRequest, NextApiResponse } from 'next';
import { matchesCatalog } from '../../../../lib/orders';
import { PayPalError, captureOrder, getOrder } from '../../../../lib/paypal';

// POST -> { id, status, payerName } once the buyer has approved the order.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const id = String(req.query.id);
  if (!/^[A-Z0-9-]{1,64}$/i.test(id)) return res.status(400).json({ error: 'Invalid order id' });

  try {
    if (!matchesCatalog(await getOrder(id))) {
      return res.status(422).json({ error: 'This order doesn’t match our current prices. Please start checkout again.' });
    }
    const order = await captureOrder(id);
    return res.status(200).json({ id: order.id, status: order.status, payerName: order.payer?.name?.given_name ?? null });
  } catch (error) {
    // A declined card: PayPal lets the buyer pick another way to pay.
    if (error instanceof PayPalError && error.details.some((d) => d.issue === 'INSTRUMENT_DECLINED')) {
      return res.status(422).json({ error: 'Your payment was declined.', restart: true });
    }
    console.error('Capturing a PayPal order failed:', error instanceof Error ? error.message : error);
    return res.status(502).json({ error: 'We couldn’t confirm your payment. Please check your PayPal account or email info@studio9inc.com before trying again.' });
  }
}
