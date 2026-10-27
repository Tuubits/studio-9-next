import { test, expect, type Page } from '@playwright/test';
import { modules, clientNavigate, readCartState } from './helpers';

const selectModule = (page: Page, title: string) =>
  page.getByLabel('Select a module').selectOption({ label: title });

// The selected module is shown as the one card whose heading is its title;
// the grid below lists every other module.
const moduleCard = (page: Page, title: string) =>
  page.locator('.card').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

for (const mod of modules) {
  test(`selecting ${mod.title} shows its card`, async ({ page }) => {
    await page.goto('/golden-era-gaming');
    await selectModule(page, mod.title);
    const card = moduleCard(page, mod.title);
    await expect(card).toHaveCount(1);
    await expect(card.getByRole('link', { name: 'Purchase PDF Edition on DriveThruRPG', exact: true })).toHaveAttribute('href', mod.driveThruLink!);

    const addButtons = card.getByRole('button', { name: /^Add /i });
    if (mod.pdfOnly) {
      await expect(addButtons).toHaveCount(0);
      await expect(card.getByText('$')).toHaveCount(0);
    } else if (!mod.outOfStock && !mod.alternateBuyOptions) {
      await expect(addButtons).toHaveCount(mod.signedCopyOptions?.length ?? 1);
    }
  });
}

for (const mod of modules) {
  test(`${mod.title} title links to its module page`, async ({ page }) => {
    await page.goto('/golden-era-gaming');
    const heading = page.getByRole('heading', { name: mod.title, exact: true });
    await expect(heading.getByRole('link')).toHaveAttribute('href', `/golden-era-gaming/${mod.id}`);
  });
}

test('Add Signed Copy to Cart adds the module at its price', async ({ page }) => {
  const mod = modules.find((m) => !m.pdfOnly && !m.outOfStock && !m.signedCopyOptions && !m.alternateBuyOptions)!;
  await page.goto('/golden-era-gaming');
  await selectModule(page, mod.title);
  await moduleCard(page, mod.title).getByRole('button', { name: 'Add Signed Copy to Cart' }).click();

  await expect(page).toHaveURL('/cart');
  const row = page.getByRole('row').filter({ hasText: mod.name });
  await expect(row).toContainText(`$${mod.price}`);
  await expect(row.getByRole('combobox')).toHaveValue('1');
});

test('signed hardcover and softcover variants add separately', async ({ page }) => {
  const mod = modules.find((m) => m.signedCopyOptions?.length)!;
  await page.goto('/golden-era-gaming');

  for (const [index, variant] of mod.signedCopyOptions!.entries()) {
    if (index > 0) await clientNavigate(page, '/golden-era-gaming');
    await selectModule(page, mod.title);
    await moduleCard(page, mod.title)
      .getByRole('button', { name: `Add ${variant.name} - $${variant.price.toFixed(2)}` })
      .click();
    await expect(page).toHaveURL('/cart');
  }

  for (const variant of mod.signedCopyOptions!) {
    const row = page.getByRole('row').filter({ hasText: `${mod.name} (${variant.name})` });
    await expect(row).toContainText(`$${variant.price}`);
    await expect(row.getByRole('combobox')).toHaveValue('1');
  }
});

// Variant cart ids used to be built from the variant name with a space,
// e.g. "riders-on-the-midnight-storm-signed hardcover".
test('variant cart ids contain no spaces', async ({ page }) => {
  const mod = modules.find((m) => m.signedCopyOptions?.length)!;
  const variant = mod.signedCopyOptions![0];
  await page.goto('/golden-era-gaming');
  await selectModule(page, mod.title);
  await moduleCard(page, mod.title)
    .getByRole('button', { name: `Add ${variant.name} - $${variant.price.toFixed(2)}` })
    .click();
  await expect(page).toHaveURL('/cart');
  const { items } = await readCartState(page);
  for (const item of items) expect(item.slug).not.toMatch(/\s/);
});
