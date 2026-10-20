import { test, expect } from '@playwright/test';
import { buildCatalog, getAllProducts, getSellableItems, type Sources } from '../lib/catalog';
import { games, books, modules } from './helpers';

const sources = () => JSON.parse(JSON.stringify({ games, books, modules })) as Sources;

test.describe('catalog', () => {
  test('has every product once', () => {
    const products = getAllProducts();
    expect(products).toHaveLength(games.length + books.length + modules.length);
    expect(products).toHaveLength(31);
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length);
  });

  test('every product page exists', async ({ request }) => {
    for (const p of getAllProducts()) {
      expect(p.url).toBe(`https://studio9inc.com${p.path}`);
      expect((await request.get(p.path)).status(), p.path).toBe(200);
    }
  });

  test('format and direct sale follow pdfOnly for modules', () => {
    for (const m of modules) {
      const p = getAllProducts().find((x) => x.id === m.id)!;
      expect(p.format, m.id).toBe(m.pdfOnly ? 'digital' : 'physical');
      if (m.pdfOnly) {
        expect(p.sellDirect).toBe(false);
        expect(p.price).toBeNull();
        expect(p.variants).toEqual([]);
      }
      expect(p.externalOffers.filter((o) => o.kind === 'pdf').map((o) => o.url)).toEqual([m.driveThruLink]);
    }
  });

  test('games and books are physical; external-only books are not sold here', () => {
    for (const p of getAllProducts().filter((x) => x.category !== 'golden-era-gaming')) {
      expect(p.format, p.id).toBe('physical');
    }
    for (const b of books.filter((x) => x.price == null)) {
      const p = getAllProducts().find((x) => x.id === b.id)!;
      expect(p.sellDirect).toBe(false);
      expect(p.availability).toBeNull();
      expect(p.externalOffers.map((o) => o.seller)).toContain('Amazon');
    }
  });

  test('ISBNs come from Amazon book links with a valid check digit', () => {
    const zanjan = getAllProducts().find((p) => p.id === 'zanjan')!;
    expect(zanjan.isbn).toBe('9781931847889'); // ISBN-10 1931847886
    expect(getAllProducts().filter((p) => p.category !== 'books').every((p) => p.isbn === null)).toBe(true);
  });

  test('cart ids are unique, have no spaces, and cover every sellable item', () => {
    const items = getSellableItems();
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const i of items) expect(i.id).toMatch(/^[a-z0-9-]+$/);
    // A product with variants is sold only through its variants.
    const withVariants = getAllProducts().filter((p) => p.variants.length);
    for (const p of withVariants) expect(items.some((i) => i.id === p.id)).toBe(false);
  });

  // Golden Era modules are moving to PDF-only. Setting pdfOnly (and price
  // null) on a module must be the only change needed.
  test('switching a physical module to PDF-only makes it digital everywhere', () => {
    const data = sources();
    const target = data.modules.find((m) => !m.pdfOnly && m.signedCopyOptions?.length)!;
    target.pdfOnly = true;
    target.price = null;

    const { products, sellable } = buildCatalog(data);
    const p = products.find((x) => x.id === target.id)!;
    expect(p.format).toBe('digital');
    expect(p.sellDirect).toBe(false);
    expect(p.availability).toBeNull();
    expect(p.variants).toEqual([]);
    expect(sellable.some((i) => i.productId === target.id)).toBe(false);
    expect(p.externalOffers.map((o) => o.kind)).toEqual(['pdf']);
  });

  test('rejects a module id that collides with the mystery page', () => {
    const data = sources();
    data.modules[0].id = 'mystery';
    expect(() => buildCatalog(data)).toThrow(/reserved/);
  });
});
