import { existsSync } from 'fs';
import path from 'path';
import { test, expect, type Page } from '@playwright/test';
import { games, books, sellsDirect, addToCartLabel, waitForImages } from './helpers';

// Screenshots differ between machines, so baselines are kept local and not
// committed (see .gitignore). Create them on a known-good build with
// `npm run test:e2e:update -- e2e/visual.spec.ts`, then compare later runs.
test.skip(!!process.env.CI, 'Visual baselines are local only');
test.beforeEach(({}, testInfo) => {
  const updating = !['none', 'missing'].includes(testInfo.config.updateSnapshots);
  test.skip(
    !updating && !existsSync(path.join(__dirname, 'visual.spec.ts-snapshots')),
    'No local visual baselines yet: run `npm run test:e2e:update -- e2e/visual.spec.ts` on a known-good build',
  );
});

// Mask parts that change between runs: YouTube and PayPal iframes, and the
// footer's current-year copyright line.
const unstable = (page: Page) => [page.locator('iframe'), page.getByText(/^Copyright ©/)];

// The rotating banner's messages wrap to different heights on mobile, which
// changes the page height, so it is removed from screenshots entirely.
const hideBanner = 'div.relative:has([aria-label="Previous"]) { display: none !important; }';

async function snapshot(page: Page, name: string) {
  await waitForImages(page);
  await expect(page).toHaveScreenshot(name, { fullPage: true, mask: unstable(page), style: hideBanner });
}

const game = games.find((g) => g.id === 'treasures-and-traps')!;
const book = books.find((b) => sellsDirect(b))!;

test('home', async ({ page }) => {
  await page.goto('/');
  await snapshot(page, 'home.png');
});

test('game page', async ({ page }) => {
  await page.goto(`/games/${game.id}`);
  await snapshot(page, 'game.png');
});

test('book page', async ({ page }) => {
  await page.goto(`/books/${book.id}`);
  await snapshot(page, 'book.png');
});

test('golden era gaming', async ({ page }) => {
  await page.goto('/golden-era-gaming');
  await snapshot(page, 'golden-era-gaming.png');
});

test('empty cart', async ({ page }) => {
  await page.goto('/cart');
  await snapshot(page, 'cart-empty.png');
});

test('filled cart', async ({ page }) => {
  await page.goto(`/games/${game.id}`);
  await page.getByRole('button', { name: addToCartLabel(game), exact: true }).click();
  await expect(page).toHaveURL('/cart');
  // The PayPal buttons set the height of the order summary; wait for them.
  if (process.env.Paypal_Client_2026) await expect(page.locator('iframe[title="PayPal"]').first()).toBeVisible({ timeout: 30_000 });
  await snapshot(page, 'cart-filled.png');
});
