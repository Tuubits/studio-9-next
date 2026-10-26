import { getProduct, getSellableItem } from './catalog';
import { shippingFor } from './shipping';
import type { Money, Order, OrderRequest } from './paypal';

// Builds PayPal orders from the catalog. The browser sends only item ids and
// quantities; every price and the shipping come from here.

export const MAX_QUANTITY = 10;

export type OrderLine = { id: string; quantity: number };
export type Rejection = { id: string; reason: string };

const usd = (cents: number): Money => ({ currency_code: 'USD', value: (cents / 100).toFixed(2) });
const cents = (dollars: number) => Math.round(dollars * 100);

function rejectionReason(id: string) {
  const product = getProduct(id);
  if (product?.format === 'digital') return 'This module is now sold as a PDF on DriveThruRPG.';
  if (product && !product.sellDirect) return 'This item is not sold on this site.';
  return 'This item is no longer available.';
}

// Accepts a request body and returns either the order or what was wrong.
export function buildOrder(body: unknown): { order: OrderRequest } | { error: string; rejected: Rejection[] } {
  const input = (body as { items?: unknown })?.items;
  if (!Array.isArray(input) || input.length === 0) return { error: 'The cart is empty.', rejected: [] };

  const quantities = new Map<string, number>();
  for (const line of input as Partial<OrderLine>[]) {
    const { id, quantity } = line ?? {};
    if (typeof id !== 'string' || !Number.isInteger(quantity) || quantity! < 1) {
      return { error: 'Each item needs an id and a whole-number quantity.', rejected: [] };
    }
    quantities.set(id, (quantities.get(id) ?? 0) + quantity!);
  }

  const rejected: Rejection[] = [];
  const lines = [];
  for (const [id, quantity] of Array.from(quantities)) {
    const item = getSellableItem(id);
    if (!item) rejected.push({ id, reason: rejectionReason(id) });
    else if (!item.inStock) rejected.push({ id, reason: 'This item is out of stock.' });
    else if (quantity > MAX_QUANTITY) rejected.push({ id, reason: `You can order up to ${MAX_QUANTITY} of each item.` });
    else lines.push({ item, quantity });
  }
  if (rejected.length) return { error: 'Some items in your cart can’t be ordered.', rejected };

  const itemTotal = lines.reduce((sum, { item, quantity }) => sum + cents(item.price) * quantity, 0);
  const shipping = cents(shippingFor(lines.map(({ item, quantity }) => ({ shippingCost: item.shippingCost, quantity }))));
  return {
    order: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { ...usd(itemTotal + shipping), breakdown: { item_total: usd(itemTotal), shipping: usd(shipping) } },
          items: lines.map(({ item, quantity }) => ({
            name: item.name.slice(0, 127),
            sku: item.id,
            quantity: String(quantity),
            unit_amount: usd(cents(item.price)),
            category: 'PHYSICAL_GOODS',
          })),
        },
      ],
      application_context: { shipping_preference: 'GET_FROM_FILE' },
    },
  };
}

// Before capturing, check the order is one this site built: the same items
// at today's catalog prices and shipping. Anyone can create a PayPal order
// with our public client id, so an order id alone proves nothing.
export function matchesCatalog(order: Order) {
  const unit = order.purchase_units?.[0];
  if (!unit || order.purchase_units.length !== 1 || !unit.items?.length) return false;
  const rebuilt = buildOrder({ items: unit.items.map((i) => ({ id: i.sku, quantity: Number(i.quantity) })) });
  if (!('order' in rebuilt)) return false;
  const expected = rebuilt.order.purchase_units[0];
  return (
    unit.amount.currency_code === 'USD' &&
    unit.amount.value === expected.amount.value &&
    unit.amount.breakdown?.shipping?.value === expected.amount.breakdown.shipping.value &&
    unit.items.every((i) => expected.items.find((e) => e.sku === i.sku)?.unit_amount.value === i.unit_amount.value)
  );
}
