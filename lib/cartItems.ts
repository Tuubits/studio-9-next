import { getAllProducts, getSellableItems, getSourceRecord, type Product, type SellableItem } from './catalog';
import { MAX_QUANTITY } from './orders';

// Cart lines rebuilt from the catalog, for the cart saved in the browser and
// for /cart?add= links. The browser loads this module only when it needs it
// (utils/Store.js, pages/cart.js), so pages don't carry the catalog.

type Catalog = { products: Product[]; sellable: SellableItem[] };
const currentCatalog = (): Catalog => ({ products: getAllProducts(), sellable: getSellableItems() });

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  shippingCost: number;
  mainImage: string;
  category: string;
  path: string;
  countInStock: number;
  quantity: number;
};

export type Dropped = { name: string; reason: string };

const clampQuantity = (quantity: number) => Math.min(Math.max(1, Math.floor(quantity)), MAX_QUANTITY);

// The cart line for an id, as the product pages add it; null if it can't be
// bought here (unknown, not sold on this site, now PDF-only, or out of stock).
export function cartItemFor(id: string, quantity: number, catalog: Catalog = currentCatalog()): CartItem | null {
  const item = catalog.sellable.find((i) => i.id === id);
  if (!item || !item.inStock) return null;
  const product = catalog.products.find((p) => p.id === item.productId)!;
  const variant = product.variants.find((v) => v.id === id);
  const isModule = product.category === 'golden-era-gaming';
  const record = isModule ? null : getSourceRecord(product.category, product.id);
  return {
    slug: id,
    // Same names and images the product pages put in the cart.
    name: variant ? `${product.name} (${variant.name})` : isModule ? product.name : item.name,
    price: item.price,
    shippingCost: item.shippingCost,
    mainImage: (record as { mainImage?: string } | null)?.mainImage ?? product.image,
    category: product.category,
    path: product.path,
    countInStock: MAX_QUANTITY,
    quantity: clampQuantity(quantity),
  };
}

function dropReason(id: string, catalog: Catalog) {
  const item = catalog.sellable.find((i) => i.id === id);
  if (item && !item.inStock) return 'is out of stock';
  const product =
    catalog.products.find((p) => p.id === (item?.productId ?? id)) ??
    catalog.products.find((p) => p.format === 'digital' && id.startsWith(`${p.id}-`));
  if (product?.format === 'digital') return 'is now sold as a PDF on DriveThruRPG';
  return 'is no longer sold on this site';
}

// The saved cart with today's names and prices. Anything that can no longer
// be bought here is left out and listed, so the shopper can be told.
export function refreshCart(saved: unknown, catalog: Catalog = currentCatalog()) {
  const cartItems: CartItem[] = [];
  const dropped: Dropped[] = [];
  for (const entry of Array.isArray(saved) ? saved : []) {
    const { slug, quantity, name } = (entry ?? {}) as { slug?: unknown; quantity?: unknown; name?: unknown };
    if (typeof slug !== 'string' || typeof quantity !== 'number' || !(quantity >= 1)) continue;
    const item = cartItemFor(slug, quantity, catalog);
    if (item) cartItems.push(item);
    else dropped.push({ name: typeof name === 'string' && name ? name : slug, reason: dropReason(slug, catalog) });
  }
  return { cartItems, dropped };
}

// `/cart?add=<id>:<qty>[,<id>:<qty>]` (quantity defaults to 1). Ids that
// can't be bought here are skipped.
export function itemsFromAddParam(param: string, catalog: Catalog = currentCatalog()) {
  const items: CartItem[] = [];
  for (const part of param.split(',')) {
    const [id, qty] = part.trim().split(':');
    const quantity = qty === undefined ? 1 : Number(qty);
    if (!id || !Number.isInteger(quantity) || quantity < 1) continue;
    const item = cartItemFor(id, quantity, catalog);
    if (item) items.push(item);
  }
  return items;
}
