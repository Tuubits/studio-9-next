import { test, expect, type Page } from '@playwright/test';
import { games, books, sellsDirect, addToCartLabel, clientNavigate, readCartState, expectedShipping, type Item } from './helpers';

const sellable = [...games.map((g) => ({ ...g, url: `/games/${g.id}` })), ...books.map((b) => ({ ...b, url: `/books/${b.id}` }))]
  .filter((i) => sellsDirect(i) && !i.outOfStock);

// Pick items with different shipping costs so the ranking matters.
const byShipping = [...sellable].sort((a, b) => b.shippingCost - a.shippingCost);
const pick = (shippingCost: number, skip = 0) => byShipping.filter((i) => i.shippingCost === shippingCost)[skip];
const costs = [...new Set(byShipping.map((i) => i.shippingCost))];
const [high, mid, low] = [pick(costs[0]), pick(costs[1] ?? costs[0], costs[1] ? 0 : 1), pick(costs.at(-1)!, 1)];

async function addItems(page: Page, items: (Item & { url: string })[]) {
  for (const [index, item] of items.entries()) {
    if (index === 0) await page.goto(item.url);
    else await clientNavigate(page, item.url);
    await page.getByRole('button', { name: addToCartLabel(item), exact: true }).click();
    await expect(page).toHaveURL('/cart');
  }
}

// Match the exact name: some names are prefixes of others
// ("Villagers and Villains" / "Villagers and Villains: Expanded Realms 1").
const rowFor = (page: Page, item: Item) =>
  page.getByRole('row').filter({ has: page.getByText(item.name, { exact: true }) });

async function expectTotals(page: Page, lines: { item: Item; quantity: number }[]) {
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + l.item.price! * l.quantity, 0);
  await expect(page.getByText(`Total (${count}) : $${total.toFixed(2)}`)).toBeVisible();
  const shipping = expectedShipping(lines.map((l) => ({ shippingCost: l.item.shippingCost, quantity: l.quantity })));
  await expect.poll(async () => (await readCartState(page)).shipping).toBeCloseTo(shipping, 5);
}

test('the shipping rule matches the documented formula', () => {
  expect(expectedShipping([{ shippingCost: 8, quantity: 1 }])).toBe(8);
  expect(expectedShipping([{ shippingCost: 8, quantity: 1 }, { shippingCost: 16, quantity: 1 }])).toBe(20);
  expect(expectedShipping([{ shippingCost: 12, quantity: 2 }, { shippingCost: 16, quantity: 1 }])).toBe(16 + 6 + 3);
  expect(expectedShipping([{ shippingCost: 8, quantity: 5 }])).toBe(8 + 4 + 2 + 1 + 1);
});

test('1 item: total and shipping', async ({ page }) => {
  await addItems(page, [high]);
  await expectTotals(page, [{ item: high, quantity: 1 }]);
});

test('2 items: total and shipping', async ({ page }) => {
  await addItems(page, [low, high]);
  await expectTotals(page, [{ item: low, quantity: 1 }, { item: high, quantity: 1 }]);
});

test('3 items: total and shipping', async ({ page }) => {
  await addItems(page, [low, mid, high]);
  await expectTotals(page, [low, mid, high].map((item) => ({ item, quantity: 1 })));
});

test('5 mixed items with quantity changes: total and shipping', async ({ page }) => {
  await addItems(page, [low, mid, high]);
  await rowFor(page, low).getByRole('combobox').selectOption('2');
  await rowFor(page, mid).getByRole('combobox').selectOption('2');
  await expectTotals(page, [
    { item: low, quantity: 2 },
    { item: mid, quantity: 2 },
    { item: high, quantity: 1 },
  ]);
});

test('remove takes an item out of the cart', async ({ page }) => {
  await addItems(page, [low, high]);
  await rowFor(page, low).getByRole('button').click();
  await expect(rowFor(page, low)).toHaveCount(0);
  await expectTotals(page, [{ item: high, quantity: 1 }]);
  await rowFor(page, high).getByRole('button').click();
  await expect(page.getByText('Cart is empty.')).toBeVisible();
});

test('the US-only notice is visible', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: /unable to fulfill orders outside of the United States/ })).toBeVisible();
});

// Only checks that the buttons render. Never click through to a payment.
test('the PayPal buttons render', async ({ page }) => {
  test.skip(!process.env.PAYPAL_CLIENT, 'PAYPAL_CLIENT is not set, so the PayPal SDK cannot load');
  await addItems(page, [low]);
  await expect(page.locator('iframe[title="PayPal"]').first()).toBeVisible({ timeout: 30_000 });
});
