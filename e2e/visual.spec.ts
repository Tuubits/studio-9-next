import { test, expect, type Page } from '@playwright/test';
import { games, books, sellsDirect, addToCartLabel, waitForImages } from './helpers';

// Screenshots differ between operating systems; baselines are generated on
// macOS, so CI skips this file unless Linux baselines are added.
test.skip(!!process.env.CI, 'Visual baselines are macOS-only');

// Hide parts that change between runs: the rotating banner, YouTube and
// PayPal iframes, and the footer's current-year copyright line.
const unstable = (page: Page) => [
  page.locator('div.relative').filter({ has: page.getByLabel('Previous') }),
  page.locator('iframe'),
  page.getByText(/^Copyright ©/),
];

async function snapshot(page: Page, name: string) {
  await waitForImages(page);
  await expect(page).toHaveScreenshot(name, { fullPage: true, mask: unstable(page) });
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
  await snapshot(page, 'cart-filled.png');
});
