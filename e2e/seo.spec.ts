import { test, expect, type Page } from '@playwright/test';
import { buildCatalog, getAllProducts, type Sources } from '../lib/catalog';
import { productJsonLd } from '../lib/structuredData';
import { games, books, modules } from './helpers';

type Offer = {
  '@type': string;
  name?: string;
  sku?: string;
  url: string;
  price?: string;
  priceCurrency?: string;
  availability?: string;
  seller: { name: string };
  shippingDetails?: { shippingRate: { value: string }; shippingDestination: { addressCountry: string } };
  hasMerchantReturnPolicy?: { url: string; returnPolicyCategory: string; merchantReturnDays: number };
};
type JsonLdProduct = { '@type': string | string[]; name: string; url: string; image: string[]; isbn?: string; offers: Offer[] };

async function jsonLd(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((b) => JSON.parse(b));
}

const ownOffers = (offers: Offer[]) => offers.filter((o) => o.seller.name === 'Studio 9 Inc');
const sources = { games, books, modules };

for (const product of getAllProducts()) {
  test(`${product.path} has product structured data and SEO tags`, async ({ page }) => {
    await page.goto(product.path);
    const data = await jsonLd(page);
    expect(data).toHaveLength(1);
    const ld = data[0] as JsonLdProduct;

    expect(ld['@type']).toEqual(product.category === 'books' ? ['Product', 'Book'] : 'Product');
    expect(ld.name).toBe(product.name);
    expect(ld.url).toBe(product.url);
    expect(ld.image[0]).toBe(product.image);
    expect(JSON.stringify(ld)).not.toMatch(/AggregateRating|"Review"/);

    const own = ownOffers(ld.offers);
    if (product.sellDirect) {
      const expected = product.variants.length
        ? product.variants.map((v) => ({ sku: v.id, price: v.price, shipping: v.shippingCost }))
        : [{ sku: product.id, price: product.price!, shipping: product.shippingCost! }];
      expect(own.map((o) => ({ sku: o.sku, price: Number(o.price), shipping: Number(o.shippingDetails!.shippingRate.value) }))).toEqual(expected);
      for (const o of own) {
        expect(o.priceCurrency).toBe('USD');
        expect(o.availability).toBe(product.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock');
        expect(o.shippingDetails!.shippingDestination.addressCountry).toBe('US');
        expect(o.hasMerchantReturnPolicy).toMatchObject({
          url: 'https://studio9inc.com/shipping-returns',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 14,
        });
      }
    } else {
      // Not sold here (Amazon-only books, PDF-only modules): no offer of ours.
      expect(own).toEqual([]);
    }
    // Prices are only ever ours; other stores set and change their own.
    for (const o of ld.offers.filter((x) => x.seller.name !== 'Studio 9 Inc')) {
      expect(o.price).toBeUndefined();
      expect(o.shippingDetails).toBeUndefined();
    }

    // SEO tags
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', product.url);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', product.url);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', product.image);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description!.length).toBeGreaterThan(25);
    expect(description!.length).toBeLessThanOrEqual(156);
  });
}

test('every module offers its DriveThruRPG PDF edition', async ({ page }) => {
  for (const mod of modules) {
    await page.goto(`/golden-era-gaming/${mod.id}`);
    const ld = (await jsonLd(page))[0] as JsonLdProduct;
    const pdf = ld.offers.filter((o) => o.seller.name === 'DriveThruRPG');
    expect(pdf.map((o) => o.url), mod.id).toEqual([mod.driveThruLink]);
    if (mod.pdfOnly) expect(ld.offers, mod.id).toHaveLength(1);
  }
});

test('Amazon-only books point to Amazon without a price', async ({ page }) => {
  for (const book of books.filter((b) => b.price == null)) {
    await page.goto(`/books/${book.id}`);
    const ld = (await jsonLd(page))[0] as JsonLdProduct;
    expect(ld.offers.map((o) => [o.seller.name, o.url, o.price])).toEqual(
      book.alternateBuyOptions!.map((o) => ['Amazon', o.link, undefined]),
    );
  }
});

test('a game sold here does not list links to other products as offers', async ({ page }) => {
  // Midnight Legion links to Books 2 and 3, which are different products.
  await page.goto('/games/midnight-legion');
  const ld = (await jsonLd(page))[0] as JsonLdProduct;
  expect(ld.offers.map((o) => o.seller.name)).toEqual(['Studio 9 Inc']);
});

test('switching a module to PDF-only leaves only its DriveThruRPG offer', () => {
  const data = JSON.parse(JSON.stringify(sources)) as Sources;
  const target = data.modules.find((m) => !m.pdfOnly && m.signedCopyOptions?.length)!;
  target.pdfOnly = true;
  target.price = null;
  const product = buildCatalog(data).products.find((p) => p.id === target.id)!;
  const ld = productJsonLd(product) as unknown as JsonLdProduct;
  expect(ld.offers).toEqual([
    { '@type': 'Offer', name: 'PDF edition', url: target.driveThruLink, seller: { '@type': 'Organization', name: 'DriveThruRPG' } },
  ]);
});

test('the home page has Organization structured data', async ({ page }) => {
  await page.goto('/');
  const data = await jsonLd(page);
  const org = data.find((d) => d['@type'] === 'Organization');
  expect(org).toMatchObject({ name: 'Studio 9 Inc', url: 'https://studio9inc.com', email: 'info@studio9inc.com' });
  expect(org.sameAs).toContain('https://www.facebook.com/Studio9Inc');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://studio9inc.com/');
});

test('the cart is kept out of search results', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('the shipping and returns page loads and is linked from the footer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Shipping & Returns' }).click();
  await expect(page).toHaveURL('/shipping-returns');
  await expect(page.getByRole('heading', { level: 1, name: 'Shipping & Returns' })).toBeVisible();
  await expect(page.getByText(/within the United States only/)).toBeVisible();
  await expect(page.getByText(/sold and delivered by DriveThruRPG/)).toBeVisible();
  await expect(page.getByText(/within 14 days of receipt, if the product is found defective/)).toBeVisible();
  await expect(page.getByText(/to be confirmed/i)).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://studio9inc.com/shipping-returns');
});
