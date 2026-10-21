import { test, expect, type APIRequestContext } from '@playwright/test';
import { SITE_URL, buildCatalog, getAllProducts, getSellableItems, type Sources } from '../lib/catalog';
import { CRAWLERS, feedRows, validateRows } from '../lib/feeds';
import { games, books, modules } from './helpers';

// The files are the same on every screen size; check them once.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Feeds do not depend on the screen size');
});

const REQUIRED = ['id', 'title', 'description', 'link', 'image_link', 'price', 'availability', 'brand', 'condition', 'shipping', 'google_product_category', 'is_eligible_search', 'is_eligible_checkout'];

const digital = getAllProducts().filter((p) => p.format === 'digital');
const notSoldHere = getAllProducts().filter((p) => p.format === 'physical' && !p.sellDirect);

async function text(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  expect(response.status(), path).toBe(200);
  return response.text();
}

async function paypalRows(request: APIRequestContext) {
  const [header, ...lines] = (await text(request, '/feeds/paypal-store-sync.tsv')).trimEnd().split('\n');
  const columns = header.split('\t');
  return lines.map((line) => {
    const cells = line.split('\t');
    expect(cells, line.slice(0, 40)).toHaveLength(columns.length);
    return Object.fromEntries(columns.map((c, i) => [c, cells[i]]));
  });
}

const sitePath = (url: string) => {
  expect(url.startsWith(SITE_URL)).toBe(true);
  return url.slice(SITE_URL.length) || '/';
};

test('the PayPal feed lists every physical item we sell, with required fields and working links', async ({ request }) => {
  const rows = await paypalRows(request);
  // Ids match the cart's ids exactly (one row per variant).
  expect(rows.map((r) => r.id).sort()).toEqual(getSellableItems().map((i) => i.id).sort());
  for (const row of rows) {
    for (const field of REQUIRED) expect(row[field], `${row.id} ${field}`).toBeTruthy();
    expect(row.description.length, row.id).toBeGreaterThanOrEqual(25);
    expect(row.price, row.id).toMatch(/^\d+\.\d{2} USD$/);
    expect(row.shipping, row.id).toMatch(/^US:::\d+\.\d{2} USD$/);
    expect(row.condition).toBe('new');
  }
  for (const link of new Set(rows.map((r) => r.link))) {
    expect((await request.get(sitePath(link))).status(), link).toBe(200);
  }
});

test('prices, stock and checkout eligibility in the feed match the cart', async ({ request }) => {
  const rows = await paypalRows(request);
  for (const item of getSellableItems()) {
    const row = rows.find((r) => r.id === item.id)!;
    expect(row.price, item.id).toBe(`${item.price.toFixed(2)} USD`);
    expect(row.availability, item.id).toBe(item.inStock ? 'in_stock' : 'out_of_stock');
    expect(row.is_eligible_checkout, item.id).toBe(String(item.inStock));
    expect(row.is_eligible_search).toBe('true');
  }
  expect(rows.find((r) => r.id === 'global-crisis')!.is_eligible_checkout).toBe('false');
  // Variants of one product share an item group.
  expect(rows.filter((r) => r.item_group_id === 'riders-on-the-midnight-storm').map((r) => r.id)).toHaveLength(2);
});

test('PDF-only modules and Amazon-only books stay out of both feeds', async ({ request }) => {
  const tsv = await text(request, '/feeds/paypal-store-sync.tsv');
  const xml = await text(request, '/feeds/google.xml');
  expect(digital.length).toBeGreaterThan(0);
  expect(notSoldHere.length).toBeGreaterThan(0);
  for (const product of [...digital, ...notSoldHere]) {
    expect(tsv, product.id).not.toContain(product.url + '\t');
    expect(xml, product.id).not.toContain(`<link>${product.url}</link>`);
  }
});

test('the Google feed has the same items as the PayPal feed', async ({ request }) => {
  const xml = await text(request, '/feeds/google.xml');
  expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
  const ids = [...xml.matchAll(/<g:id>([^<]+)<\/g:id>/g)].map((m) => m[1]);
  expect(ids.sort()).toEqual((await paypalRows(request)).map((r) => r.id).sort());
  for (const item of xml.split('<item>').slice(1)) {
    for (const tag of ['title', 'description', 'link', 'g:image_link', 'g:price', 'g:availability', 'g:brand', 'g:condition', 'g:shipping']) {
      expect(item, tag).toContain(`<${tag}>`);
    }
  }
});

test('the sitemap lists every product page, including PDF-only modules, and every URL loads', async ({ request }) => {
  const xml = await text(request, '/sitemap.xml');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const product of getAllProducts()) expect(urls, product.id).toContain(product.url);
  for (const product of digital) expect(urls).toContain(product.url);
  expect(urls).toContain(`${SITE_URL}/shipping-returns`);
  expect(urls).not.toContain(`${SITE_URL}/cart`);
  for (const url of urls) expect((await request.get(sitePath(url))).status(), url).toBe(200);
});

test('robots.txt welcomes AI crawlers and points to the sitemap', async ({ request }) => {
  const robots = await text(request, '/robots.txt');
  for (const name of ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User', 'Bingbot', 'Googlebot']) {
    expect(CRAWLERS).toContain(name);
    expect(robots).toContain(`User-agent: ${name}`);
  }
  expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
  expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
});

test('switching a module to PDF-only drops it from the feeds', () => {
  const data = JSON.parse(JSON.stringify({ games, books, modules })) as Sources;
  const target = data.modules.find((m) => !m.pdfOnly && m.signedCopyOptions?.length)!;
  const before = feedRows(buildCatalog(data)).rows.filter((r) => r.link.endsWith(`/${target.id}`));
  expect(before.length).toBeGreaterThan(0);
  target.pdfOnly = true;
  target.price = null;
  const { rows, excluded } = feedRows(buildCatalog(data));
  expect(rows.filter((r) => r.link.endsWith(`/${target.id}`))).toEqual([]);
  expect(excluded.digital).toContain(target.id);
});

test('a feed row missing a required field is reported, but a missing GTIN is not', () => {
  const [row] = feedRows({ products: getAllProducts(), sellable: getSellableItems() }).rows;
  expect(validateRows([row]).errors).toEqual([]);
  expect(validateRows([{ ...row, brand: '', description: 'Too short' }]).errors).toEqual([
    `${row.id}: missing brand`,
    `${row.id}: description shorter than 25 characters`,
  ]);
  expect(validateRows([{ ...row, gtin: '' }])).toEqual({ errors: [], missingGtin: [row.id] });
});
