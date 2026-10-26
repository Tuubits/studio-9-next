import { test, expect } from '@playwright/test';

// Netlify registers forms from public/__forms.html at deploy time; the pages
// POST there. These tests never reach Netlify: submissions are intercepted.

test('the static forms file registers every Netlify form', async ({ page }) => {
  const response = await page.goto('/__forms.html');
  expect(response?.status()).toBe(200);
  // Cart notes go to PayPal with the order, not to Netlify.
  await expect(page.locator('form[name="contact"]')).toHaveCount(0);
  const mystery = page.locator('form[name="mystery-room-challenge"][data-netlify="true"]');
  for (const field of ['answer', 'email']) await expect(mystery.locator(`[name="${field}"]`)).toHaveCount(1);
});

test('the mystery room form posts to the static forms file', async ({ page }) => {
  let body = '';
  await page.route('**/__forms.html', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    body = route.request().postData() ?? '';
    await route.fulfill({ status: 200, body: '' });
  });
  await page.goto('/golden-era-gaming/mystery');
  await page.locator('input[name="answer"]').fill('test answer');
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByText('Thank you for your submission!')).toBeVisible();

  const fields = new URLSearchParams(body);
  expect(fields.get('form-name')).toBe('mystery-room-challenge');
  expect(fields.get('answer')).toBe('test answer');
  expect(fields.get('email')).toBe('test@example.com');
});
