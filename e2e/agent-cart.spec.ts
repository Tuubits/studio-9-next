import { test, expect, type Page } from '@playwright/test';
import { buildCatalog, getAllProducts, getSellableItem, getSellableItems, type Sources } from '../lib/catalog';
import { itemsFromAddParam, refreshCart } from '../lib/cartItems';
import { books, games, modules, readCartState, watchPageErrors } from './helpers';

// Phase 7: things that help agents (and people) who shop by driving a
// browser: a cart that survives reloads, /cart?add= links, and buy controls
// with clear names.

const STORAGE_KEY = 'studio9-cart';
const inStock = getSellableItems().filter((i) => i.inStock);
const outOfStock = getSellableItems().find((i) => !i.inStock)!;
const digital = getAllProducts().find((p) => p.format === 'digital')!;
const simpleProduct = getAllProducts().find((p) => p.sellDirect && p.availability === 'in_stock' && !p.variants.length && p.category === 'games')!;

const lines = async (page: Page) =>
  (await readCartState(page)).items.map((i) => [i.slug, i.quantity] as [string, number]);

async function saveCart(page: Page, saved: object[]) {
  await page.addInitScript(
    ([key, value]) => {
      // Only before the first load, so the page's own saves aren't overwritten on reload.
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, value);
        sessionStorage.setItem('seeded', '1');
      }
    },
    [STORAGE_KEY, JSON.stringify(saved)],
  );
}

test.describe('saved cart', () => {
  test('the cart survives a reload', async ({ page }) => {
    await page.goto(simpleProduct.path);
    await page.getByRole('button', { name: /^Add to cart$/i }).first().click();
    await expect(page).toHaveURL('/cart');
    await page.locator('select').first().selectOption('3');

    await page.reload();
    await expect(page.getByText(getSellableItem(simpleProduct.id)!.name).first()).toBeVisible();
    await expect(page.locator('select').first()).toHaveValue('3');
    await expect.poll(() => lines(page)).toEqual([[simpleProduct.id, 3]]);

    // ...and a fresh visit to another page still has it.
    await page.goto('/');
    await page.goto('/cart');
    await expect.poll(() => lines(page)).toEqual([[simpleProduct.id, 3]]);
  });

  test('saved prices are ignored: lines come back at catalog prices', async ({ page }) => {
    const item = inStock[0];
    await saveCart(page, [{ slug: item.id, quantity: 2, name: 'Old name', price: 0.01, shippingCost: 0 }]);
    await page.goto('/cart');
    await expect.poll(async () => (await readCartState(page)).items).toEqual([{ slug: item.id, quantity: 2, price: item.price }]);
  });

  test('a saved cart drops items that can no longer be bought here, and says so', async ({ page }) => {
    const checkErrors = watchPageErrors(page);
    const keep = inStock[0];
    await saveCart(page, [
      { slug: digital.id, quantity: 1, name: digital.name },
      { slug: keep.id, quantity: 2, name: keep.name },
      { slug: outOfStock.id, quantity: 1, name: 'Out of stock thing' },
      { slug: 'no-such-item', quantity: 1, name: 'Mystery item' },
      { slug: 42, quantity: 'lots' },
    ]);
    await page.goto('/cart');
    await expect.poll(() => lines(page)).toEqual([[keep.id, 2]]);
    const notice = page.getByRole('status').filter({ hasText: 'out of your saved cart' });
    await expect(notice).toContainText(`${digital.name} is now sold as a PDF on DriveThruRPG.`);
    await expect(notice).toContainText('Out of stock thing is out of stock.');
    await expect(notice).toContainText('Mystery item is no longer sold on this site.');

    // The saved cart now holds only what is left, and the note isn't shown again.
    await page.reload();
    await expect.poll(() => lines(page)).toEqual([[keep.id, 2]]);
    await expect(page.getByText('out of your saved cart')).toHaveCount(0);
    checkErrors();
  });

  test('a broken saved cart is treated as empty', async ({ page }) => {
    const checkErrors = watchPageErrors(page);
    await page.addInitScript((key) => localStorage.setItem(key, '{not json'), STORAGE_KEY);
    await page.goto('/cart');
    await expect(page.getByText('Cart is empty.')).toBeVisible();
    checkErrors();
  });
});

test.describe('/cart?add= links', () => {
  test('add the listed items, then remove the query', async ({ page }) => {
    // The example from the plan; both are in-stock games.
    for (const id of ['treasures-and-traps', 'borderlands']) expect(getSellableItem(id)?.inStock, id).toBe(true);
    await page.goto('/cart?add=treasures-and-traps:2,borderlands:1');
    await expect(page).toHaveURL('/cart');
    await expect.poll(() => lines(page)).toEqual([['treasures-and-traps', 2], ['borderlands', 1]]);
    await expect(page.getByText('Treasures and Traps').first()).toBeVisible();

    // A reload doesn't add them again.
    await page.reload();
    await expect.poll(() => lines(page)).toEqual([['treasures-and-traps', 2], ['borderlands', 1]]);
  });

  test('add to what is already in the cart, up to 10 each', async ({ page }) => {
    await page.goto('/cart?add=treasures-and-traps:4');
    await expect(page).toHaveURL('/cart');
    await page.goto('/cart?add=treasures-and-traps:9,borderlands');
    await expect(page).toHaveURL('/cart');
    await expect.poll(() => lines(page)).toEqual([['treasures-and-traps', 10], ['borderlands', 1]]);
  });

  test('unknown, PDF-only, out-of-stock and malformed entries are ignored without errors', async ({ page }) => {
    const checkErrors = watchPageErrors(page);
    const good = inStock[0];
    await page.goto(`/cart?add=nope:1,${digital.id}:1,${outOfStock.id}:1,${good.id}:abc,${good.id}:0,,:,${good.id}:2`);
    await expect(page).toHaveURL('/cart');
    await expect.poll(() => lines(page)).toEqual([[good.id, 2]]);
    checkErrors();
  });

  test('a variant can be added by its id', async ({ page }) => {
    const variant = getSellableItems().find((i) => i.inStock && i.id !== i.productId)!;
    await page.goto(`/cart?add=${variant.id}:1`);
    await expect(page).toHaveURL('/cart');
    await expect.poll(() => lines(page)).toEqual([[variant.id, 1]]);
  });
});

test.describe('buy controls have clear names', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Names do not depend on the screen size');
  });

  test('every link and button on product pages has an accessible name', async ({ page }) => {
    for (const p of getAllProducts()) {
      await page.goto(p.path);
      const controls = page.locator('a[href]:visible, button:visible');
      const count = await controls.count();
      for (let i = 0; i < count; i++) {
        await expect(controls.nth(i), `${p.path} control ${i}`).toHaveAccessibleName(/\S/);
      }
    }
  });

  test('no button sits inside a link, and no link inside a button', async ({ page }) => {
    for (const path of ['/', '/golden-era-gaming', ...getAllProducts().map((p) => p.path)]) {
      await page.goto(path);
      await expect(page.locator('a button, button a, a a, button button'), path).toHaveCount(0);
    }
  });

  test('PDF links say they go to DriveThruRPG', async ({ page }) => {
    for (const m of modules.filter((x) => x.driveThruLink)) {
      await page.goto(`/golden-era-gaming/${m.id}`);
      await expect(page.getByRole('link', { name: 'Purchase PDF Edition on DriveThruRPG', exact: true })).toHaveAttribute('href', m.driveThruLink!);
    }
  });

  test('add-to-cart buttons are named for what they do', async ({ page }) => {
    for (const p of getAllProducts().filter((x) => x.sellDirect && x.availability === 'in_stock')) {
      await page.goto(p.path);
      await expect(page.getByRole('button', { name: /^Add\b/ }).first(), p.path).toBeEnabled();
    }
  });

  test('out-of-stock buttons are disabled, not just grey', async ({ page }) => {
    for (const item of [...games, ...books].filter((x) => x.outOfStock && x.price != null)) {
      await page.goto(`/${games.includes(item) ? 'games' : 'books'}/${item.id}`);
      await expect(page.getByRole('button', { name: 'Out of Stock' })).toBeDisabled();
    }
  });
});

test('switching a module to PDF-only drops it from saved carts and add links', () => {
  const data = JSON.parse(JSON.stringify({ games, books, modules })) as Sources;
  const target = data.modules.find((m) => !m.pdfOnly && m.signedCopyOptions?.length)!;
  const ids = getSellableItems().filter((i) => i.productId === target.id).map((i) => i.id);
  const saved = ids.map((slug) => ({ slug, quantity: 1, name: slug }));
  expect(refreshCart(saved, buildCatalog(data)).cartItems.map((i) => i.slug)).toEqual(ids);

  target.pdfOnly = true;
  target.price = null;
  const catalog = buildCatalog(data);
  const { cartItems, dropped } = refreshCart(saved, catalog);
  expect(cartItems).toEqual([]);
  expect(dropped).toEqual(ids.map((name) => ({ name, reason: 'is now sold as a PDF on DriveThruRPG' })));
  expect(itemsFromAddParam(ids.map((id) => `${id}:1`).join(','), catalog)).toEqual([]);
});
