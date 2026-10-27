import { getAllProducts, getSellableItems, type Product, type SellableItem } from './catalog';
import { MAX_QUANTITY, buildOrder, type OrderLine } from './orders';
import type { Address, Money, Order, OrderRequest, Shipping } from './paypal';

// The Store Sync cart: what PayPal's shopping agents send, checked against
// the catalog, and the cart we send back. The cart's id is the PayPal order
// id, so no database is needed: the order holds the items and the address.
//
// Field names follow PayPal's Store Sync cart API as published when this was
// written (create, full-replace update, checkout; validation_issues;
// payment_method.token = PayPal order id). PayPal now shares the full schema
// during onboarding. TODO: check every field name and issue code against it.

export type ValidationIssue = {
  code: string;
  type: 'ITEM' | 'SHIPPING_ADDRESS' | 'CART';
  message: string;
  variant_id?: string;
};

type CartItemInput = { variant_id?: unknown; item_id?: unknown; quantity?: unknown };
type ShippingAddressInput = Partial<Address> & { full_name?: string; name?: string };
export type CartInput = { items?: unknown; shipping_address?: ShippingAddressInput };

export type CheckedCart = {
  lines: OrderLine[];
  issues: ValidationIssue[];
  shipping?: Shipping;
};

type Catalog = { products: Product[]; sellable: SellableItem[] };
const currentCatalog = (): Catalog => ({ products: getAllProducts(), sellable: getSellableItems() });

function itemIssue(id: string, quantity: number, catalog: Catalog): ValidationIssue | null {
  const item = catalog.sellable.find((i) => i.id === id);
  // A variant id of a module that went PDF-only names its product's id first.
  const product =
    catalog.products.find((p) => p.id === (item?.productId ?? id)) ??
    catalog.products.find((p) => p.format === 'digital' && id.startsWith(`${p.id}-`));
  const issue = (code: string, message: string): ValidationIssue => ({ code, type: 'ITEM', message, variant_id: id });
  if (!item) {
    // Store Sync covers physical goods only; digital modules are sold on DriveThruRPG.
    if (product?.format === 'digital') return issue('ITEM_NOT_AVAILABLE', 'This module is now sold only as a PDF on DriveThruRPG.');
    if (product && !product.sellDirect) return issue('ITEM_NOT_AVAILABLE', 'This item is not sold on this site.');
    return issue('ITEM_NOT_FOUND', 'There is no item with this id.');
  }
  if (!item.inStock) return issue('ITEM_OUT_OF_STOCK', 'This item is out of stock.');
  if (quantity > MAX_QUANTITY) return issue('QUANTITY_NOT_AVAILABLE', `You can order up to ${MAX_QUANTITY} of this item.`);
  return null;
}

// Checks an incoming cart. Items with problems are left out of the order and
// reported; the rest can still be bought. Returns null for a malformed request.
// Tests pass their own catalog (e.g. with a module switched to PDF-only).
export function checkCart(body: unknown, catalog: Catalog = currentCatalog()): CheckedCart | null {
  const input = body as CartInput | null;
  if (!input || !Array.isArray(input.items)) return null;

  const quantities = new Map<string, number>();
  for (const raw of input.items as CartItemInput[]) {
    const id = raw?.variant_id ?? raw?.item_id;
    const quantity = raw?.quantity;
    if (typeof id !== 'string' || !Number.isInteger(quantity) || (quantity as number) < 1) return null;
    quantities.set(id, (quantities.get(id) ?? 0) + (quantity as number));
  }

  const lines: OrderLine[] = [];
  const issues: ValidationIssue[] = [];
  for (const [id, quantity] of Array.from(quantities)) {
    const issue = itemIssue(id, quantity, catalog);
    if (issue) issues.push(issue);
    else lines.push({ id, quantity });
  }
  if (!lines.length && !issues.length) issues.push({ code: 'CART_EMPTY', type: 'CART', message: 'The cart has no items.' });

  const address = input.shipping_address;
  let shipping: Shipping | undefined;
  if (address) {
    if (address.country_code !== 'US') {
      issues.push({ code: 'SHIPPING_ADDRESS_NOT_SUPPORTED', type: 'SHIPPING_ADDRESS', message: 'We only ship within the United States.' });
    } else {
      const fullName = address.full_name ?? address.name;
      shipping = {
        ...(fullName ? { name: { full_name: String(fullName).slice(0, 300) } } : {}),
        address: {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          admin_area_2: address.admin_area_2,
          admin_area_1: address.admin_area_1,
          postal_code: address.postal_code,
          country_code: 'US',
        },
      };
    }
  }
  return { lines, issues, shipping };
}

// The PayPal order for the items that passed, or null if none did.
export function orderFor(cart: CheckedCart): OrderRequest | null {
  if (!cart.lines.length) return null;
  const built = buildOrder({ items: cart.lines }, cart.shipping);
  return 'order' in built ? built.order : null;
}

// The 422 body when nothing in the cart can be bought.
export const unprocessable = (issues: ValidationIssue[]) => ({
  name: 'UNPROCESSABLE_ENTITY',
  message: 'The cart cannot be created with these items.',
  details: issues.map((issue) => ({ issue: issue.code, description: issue.message, business_context: issue })),
});

// The cart PayPal gets back, built from the PayPal order.
export function cartResponse(orderId: string, order: Pick<OrderRequest, 'purchase_units'>, issues: ValidationIssue[]) {
  const unit = order.purchase_units[0];
  const money = (m: Money) => ({ currency_code: m.currency_code, value: m.value });
  const address = unit.shipping?.address;
  return {
    id: orderId,
    status: issues.length ? 'INCOMPLETE' : 'CREATED',
    validation_status: issues.length ? 'INVALID' : 'VALID',
    validation_issues: issues,
    items: unit.items.map((item) => ({
      variant_id: item.sku,
      name: item.name,
      quantity: Number(item.quantity),
      price: money(item.unit_amount),
    })),
    ...(address ? { shipping_address: { ...address, ...(unit.shipping?.name ? { full_name: unit.shipping.name.full_name } : {}) } } : {}),
    totals: {
      subtotal: money(unit.amount.breakdown.item_total),
      shipping: money(unit.amount.breakdown.shipping),
      total: money(unit.amount),
    },
    payment_method: { type: 'paypal', token: orderId },
  };
}

// Checkout needs a US address on the order, since the agent ships there.
export function checkoutIssues(order: Order): ValidationIssue[] {
  const country = order.purchase_units?.[0]?.shipping?.address?.country_code;
  if (country === 'US') return [];
  return [{
    code: country ? 'SHIPPING_ADDRESS_NOT_SUPPORTED' : 'SHIPPING_ADDRESS_REQUIRED',
    type: 'SHIPPING_ADDRESS',
    message: country ? 'We only ship within the United States.' : 'A US shipping address is needed before checkout.',
  }];
}
