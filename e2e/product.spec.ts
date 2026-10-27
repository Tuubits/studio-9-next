import { test, expect } from '@playwright/test';
import { games, books, sellsDirect, addToCartLabel, type Item } from './helpers';

const products: [string, Item][] = [
  ...games.map((g): [string, Item] => [`/games/${g.id}`, g]),
  ...books.map((b): [string, Item] => [`/books/${b.id}`, b]),
];

for (const [url, item] of products.filter(([, i]) => sellsDirect(i) && !i.outOfStock)) {
  test(`${url} shows its price and adds to cart`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByText(`$${item.price!.toFixed(2)}`, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: addToCartLabel(item), exact: true }).click();
    await expect(page).toHaveURL('/cart');
    const row = page.getByRole('row').filter({ has: page.getByText(item.name, { exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('combobox')).toHaveValue('1');
  });
}

for (const [url] of products.filter(([, i]) => i.outOfStock)) {
  test(`${url} shows an Out of Stock control`, async ({ page }) => {
    await page.goto(url);
    const button = page.getByRole('button', { name: 'Out of Stock', exact: true });
    await expect(button).toBeVisible();
    // daisyUI's btn-disabled sets pointer-events: none, so it can't be clicked.
    await expect(button).toHaveClass(/btn-disabled/);
    await expect(button).toHaveCSS('pointer-events', 'none');
  });

  // Known bug: the control is only styled as disabled (btn-disabled class)
  // and has no `disabled` attribute, so assistive tech and agents see an
  // enabled button. Clicking it does nothing.
  test.fixme(`${url} Out of Stock control is actually disabled`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('button', { name: 'Out of Stock', exact: true })).toBeDisabled();
  });
}

// Outbound buy links are named with the store they open (Phase 7), e.g.
// "Purchase here on Amazon".
const STORES: [RegExp, string][] = [[/(^|\.)amazon\./, 'Amazon'], [/(^|\.)drivethrurpg\.com$/, 'DriveThruRPG']];
const linkName = (option: { name: string; link?: string }) => {
  const host = new URL(option.link!).hostname;
  const store = STORES.find(([pattern]) => pattern.test(host))![1];
  return `${option.name} on ${store}`;
};

// Books sold only through an external store (Amazon) have no price.
for (const book of books.filter((b) => b.price == null)) {
  test(`/books/${book.id} links out and has no add-to-cart`, async ({ page }) => {
    await page.goto(`/books/${book.id}`);
    for (const option of book.alternateBuyOptions!) {
      await expect(page.getByRole('link', { name: linkName(option), exact: true })).toHaveAttribute('href', option.link!);
    }
    await expect(page.getByRole('button', { name: /add to cart/i })).toHaveCount(0);
  });
}

test('Midnight Legion external links point to their URLs', async ({ page }) => {
  const game = games.find((g) => g.id === 'midnight-legion')!;
  await page.goto('/games/midnight-legion');
  for (const option of game.alternateBuyOptions!.filter((o) => o.link)) {
    const link = page.getByRole('link', { name: linkName(option), exact: true });
    await expect(link).toHaveAttribute('href', option.link!);
    await expect(link).toHaveAttribute('target', '_blank');
  }
});

test('clicking a side image opens it in the lightbox', async ({ page }) => {
  const game = games.find((g) => g.id === 'treasures-and-traps')! as Item & { sideImages: { alt: string }[] };
  await page.goto(`/games/${game.id}`);
  await page.getByRole('button', { name: `Enlarge ${game.sideImages[0].alt}` }).click();
  const lightbox = page.locator('.yarl__root');
  await expect(lightbox).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(lightbox).toBeHidden();
});
