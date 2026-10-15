import { readFileSync } from 'fs';
import path from 'path';
import { expect, type Page } from '@playwright/test';

// Product data is read from the same JSON files the site builds from, so
// expectations follow the data instead of being hard-coded.
const readJson = (file: string) => JSON.parse(readFileSync(path.join(__dirname, '..', file), 'utf8'));

export type BuyOption = { name: string; link?: string; addToCart?: boolean };
export type Item = {
  id: string;
  slug: string;
  name: string;
  title: string;
  price: number | null;
  shippingCost: number;
  outOfStock?: boolean;
  alternateBuyOptions?: BuyOption[];
  signedCopyOptions?: { name: string; price: number; shippingCost: number }[];
  driveThruLink?: string;
  pdfOnly?: boolean;
};

export const games: Item[] = readJson('game_details.json').games;
export const books: Item[] = readJson('book_details.json').books;
export const modules: Item[] = readJson('module_details.json');

// The product pages show their own add-to-cart button when there are no
// alternate buy options, or when one of those options is flagged addToCart.
export const addToCartOption = (item: Item) => item.alternateBuyOptions?.find((o) => o.addToCart);
export const sellsDirect = (item: Item) =>
  item.price != null && (!item.alternateBuyOptions || !!addToCartOption(item));
export const addToCartLabel = (item: Item) =>
  item.outOfStock ? 'Out of Stock' : addToCartOption(item)?.name ?? 'Add to cart';

// Mirrors the CALCULATE_SHIPPING rule in utils/Store.js on purpose: if that
// code is refactored, this copy keeps the expected amounts fixed.
// Every unit is ranked by shipping cost, highest first; the first pays 100%,
// the second 50%, the third 25% and every later one 12.5%.
export function expectedShipping(lines: { shippingCost: number; quantity: number }[]) {
  const units = lines.flatMap((l) => Array(l.quantity).fill(l.shippingCost)).sort((a, b) => b - a);
  const rates = [1, 0.5, 0.25];
  return units.reduce((sum, cost, i) => sum + cost * (rates[i] ?? 0.125), 0);
}

type CartLine = { slug: string; quantity: number; price: number };
type Fiber = { return: Fiber | null; memoizedProps?: { value?: { state?: { shipping: number; cart?: { cartItems: CartLine[] } } } } };

// Cart state is in-memory React context with no UI for shipping, so read it
// from the Store provider through React's internal fiber tree.
export async function readCartState(page: Page) {
  return page.evaluate(() => {
    const root = document.getElementById('__next')!;
    const start = root.querySelector('*') ?? root;
    const key = Object.keys(start).find((k) => k.startsWith('__reactFiber$'))!;
    let fiber: Fiber | null = (start as unknown as Record<string, Fiber>)[key];
    while (fiber) {
      const state = fiber.memoizedProps?.value?.state;
      if (state?.cart) {
        return {
          shipping: state.shipping,
          items: state.cart.cartItems.map((i) => ({ slug: i.slug, quantity: i.quantity, price: i.price })),
        };
      }
      fiber = fiber.return;
    }
    throw new Error('Store provider not found');
  });
}

// Navigate inside the single-page app so the in-memory cart survives.
export async function clientNavigate(page: Page, url: string) {
  await page.evaluate((u) => (window as unknown as { next: { router: { push(u: string): void } } }).next.router.push(u), url);
  await page.waitForURL((u) => u.pathname === url);
}

// Fail the test on uncaught errors and console.error, except known noise.
// Each allow-list entry must say where the message comes from.
const allowedConsoleErrors: RegExp[] = [
  // Logged inside the YouTube embed iframe (react-youtube) on pages with a
  // video; YouTube's player probes a browser API the embed is not allowed to use.
  /Permissions policy violation: compute-pressure/,
  // Without a PayPal client id (e.g. in CI with no secret) the PayPal SDK
  // request on the cart page is rejected with a 400. Allowed only then.
  ...(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT
    ? []
    : [/Failed to load resource: the server responded with a status of 400/, /Failed to load the PayPal JS SDK script/]),
];

export function watchPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !allowedConsoleErrors.some((r) => r.test(m.text()))) {
      errors.push(`console.error: ${m.text()}`);
    }
  });
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

// Scroll through the page so lazy images load, then wait for every visible
// image. Lazy images inside hidden elements (e.g. the mobile-only separator
// on desktop) never load, so they are skipped.
export async function waitForImages(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => Array.from(document.images)
        .filter((img) => img.getClientRects().length > 0)
        .every((img) => img.complete && img.naturalWidth > 0), null, {
    timeout: 30_000,
  });
}
