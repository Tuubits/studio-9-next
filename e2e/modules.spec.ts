import { test, expect, type Page } from '@playwright/test';
import { modules, readCartState } from './helpers';

// Independent of lib/catalog.ts on purpose: the stable variant id format.
const variantId = (moduleId: string, name: string) => `${moduleId}-${name.toLowerCase().replace(/\s+/g, '-')}`;

const addButtons = (page: Page) => page.getByRole('button', { name: /^Add / });

for (const mod of modules) {
  test(`/golden-era-gaming/${mod.id} shows the module`, async ({ page }) => {
    await page.goto(`/golden-era-gaming/${mod.id}`);
    await expect(page.getByRole('heading', { level: 1, name: mod.title, exact: true })).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(mod.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(page.getByRole('link', { name: 'Purchase PDF Edition' })).toHaveAttribute('href', mod.driveThruLink!);
    await expect(page.getByRole('link', { name: /All Golden Era modules/ })).toHaveAttribute('href', '/golden-era-gaming');

    if (mod.pdfOnly) {
      await expect(addButtons(page)).toHaveCount(0);
      await expect(page.getByText('$')).toHaveCount(0);
    } else if (mod.signedCopyOptions?.length) {
      for (const v of mod.signedCopyOptions) {
        await expect(page.getByRole('button', { name: `Add ${v.name} - $${v.price.toFixed(2)}` })).toBeVisible();
      }
    } else if (!mod.outOfStock) {
      await expect(page.getByRole('button', { name: 'Add Signed Copy to Cart' })).toBeVisible();
    }
  });
}

const signed = modules.find((m) => !m.pdfOnly && !m.outOfStock && !m.signedCopyOptions && !m.alternateBuyOptions)!;

test(`module page add-to-cart uses the module id (${signed.id})`, async ({ page }) => {
  await page.goto(`/golden-era-gaming/${signed.id}`);
  await page.getByRole('button', { name: 'Add Signed Copy to Cart' }).click();
  await expect(page).toHaveURL('/cart');

  const { items } = await readCartState(page);
  expect(items).toEqual([{ slug: signed.id, quantity: 1, price: signed.price }]);
  // The cart links back to the module's own page.
  await expect(page.getByRole('row').getByRole('link', { name: signed.name })).toHaveAttribute('href', `/golden-era-gaming/${signed.id}`);
});

for (const mod of modules.filter((m) => !m.pdfOnly && m.signedCopyOptions?.length)) {
  for (const variant of mod.signedCopyOptions!) {
    test(`${mod.id}: ${variant.name} goes in the cart with a stable id`, async ({ page }) => {
      await page.goto(`/golden-era-gaming/${mod.id}`);
      await page.getByRole('button', { name: `Add ${variant.name} - $${variant.price.toFixed(2)}` }).click();
      await expect(page).toHaveURL('/cart');

      const { items } = await readCartState(page);
      expect(items).toEqual([{ slug: variantId(mod.id, variant.name), quantity: 1, price: variant.price }]);
      expect(items[0].slug).not.toMatch(/\s/);
      await expect(page.getByRole('row').getByRole('link', { name: `${mod.name} (${variant.name})` })).toHaveAttribute(
        'href',
        `/golden-era-gaming/${mod.id}`,
      );
    });
  }
}

// Side-by-side cards used to leave a white strip under the image when the
// description was taller than the image's fixed height.
test('side card images fill the card height on wide screens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Cards stack vertically on mobile');
  for (const mod of modules) {
    await page.goto(`/golden-era-gaming/${mod.id}`);
    const card = page.locator('.card').first();
    const cardBox = (await card.boundingBox())!;
    const figureBox = (await card.locator('figure').boundingBox())!;
    expect(Math.abs(cardBox.height - figureBox.height), mod.id).toBeLessThanOrEqual(1);
  }
});
