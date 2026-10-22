import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { getAllProducts, getSellableItem, getSellableItems } from '../lib/catalog';
import { PAYPAL_MOCK, expectedShipping } from './helpers';

// Every PayPal call here goes to the local mock (e2e/paypal-mock.mjs).
// No test creates, approves or pays a real or sandbox PayPal order.

type MockOrder = {
  request: {
    purchase_units: {
      amount: { value: string; breakdown: { item_total: { value: string }; shipping: { value: string } } };
      items: { sku: string; quantity: string; unit_amount: { value: string } }[];
    }[];
    application_context: { shipping_preference: string };
  };
  status: string;
  captures: number;
  requestIds: string[];
};

const mockOrder = async (request: APIRequestContext, id: string) =>
  (await (await request.get(`${PAYPAL_MOCK}/__mock/orders/${id}`)).json()) as MockOrder;

const item = (id: string) => getSellableItem(id)!;
const inStock = getSellableItems().filter((i) => i.inStock);
const outOfStock = getSellableItems().find((i) => !i.inStock)!;
const amazonOnly = getAllProducts().find((p) => p.format === 'physical' && !p.sellDirect)!;
const digital = getAllProducts().find((p) => p.format === 'digital')!;

async function createOrder(request: APIRequestContext, items: object[]) {
  const response = await request.post('/api/orders', { data: { items } });
  return { status: response.status(), body: await response.json() };
}

// Expected order amounts, worked out from the catalog and the documented formula.
function expectedAmounts(lines: { id: string; quantity: number }[]) {
  const itemTotal = lines.reduce((sum, l) => sum + item(l.id).price * l.quantity, 0);
  const shipping = expectedShipping(lines.map((l) => ({ shippingCost: item(l.id).shippingCost, quantity: l.quantity })));
  return { item_total: itemTotal.toFixed(2), shipping: shipping.toFixed(2), total: (itemTotal + shipping).toFixed(2) };
}

test.describe('order API', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'The API does not depend on the screen size');
  });

  test('prices come from the catalog, not the request', async ({ request }) => {
    const [a, b] = inStock;
    const { status, body } = await createOrder(request, [
      { id: a.id, quantity: 2, price: 0.01, unit_amount: { value: '0.01' } },
      { id: b.id, quantity: 1, price: 0, shippingCost: 0 },
    ]);
    expect(status).toBe(201);
    const unit = (await mockOrder(request, body.id)).request.purchase_units[0];
    const expected = expectedAmounts([{ id: a.id, quantity: 2 }, { id: b.id, quantity: 1 }]);
    expect(unit.amount.value).toBe(expected.total);
    expect(unit.amount.breakdown.item_total.value).toBe(expected.item_total);
    expect(unit.amount.breakdown.shipping.value).toBe(expected.shipping);
    expect(unit.items.map((i) => [i.sku, i.quantity, i.unit_amount.value])).toEqual([
      [a.id, '2', a.price.toFixed(2)],
      [b.id, '1', b.price.toFixed(2)],
    ]);
  });

  test('variants are ordered at their own price', async ({ request }) => {
    const variants = getSellableItems().filter((i) => i.id !== i.productId);
    expect(variants.length).toBeGreaterThan(0);
    const { body } = await createOrder(request, variants.map((v) => ({ id: v.id, quantity: 1 })));
    const unit = (await mockOrder(request, body.id)).request.purchase_units[0];
    expect(unit.items.map((i) => [i.sku, i.unit_amount.value])).toEqual(variants.map((v) => [v.id, v.price.toFixed(2)]));
  });

  for (const count of [1, 2, 3, 5]) {
    test(`shipping for ${count} mixed units matches the formula`, async ({ request }) => {
      // Mix shipping costs so the ranking matters.
      const byCost = [...inStock].sort((x, y) => y.shippingCost - x.shippingCost);
      const picks = [byCost[0], byCost.at(-1)!, byCost[1], byCost.at(-2)!, byCost[2]].slice(0, count);
      const lines = picks.map((p) => ({ id: p.id, quantity: 1 }));
      const { body } = await createOrder(request, lines);
      const unit = (await mockOrder(request, body.id)).request.purchase_units[0];
      expect(unit.amount.breakdown.shipping.value).toBe(expectedAmounts(lines).shipping);
      expect(unit.amount.value).toBe(expectedAmounts(lines).total);
    });
  }

  test('the same item twice is merged, and the buyer’s address on file is used', async ({ request }) => {
    const [a] = inStock;
    const { body } = await createOrder(request, [{ id: a.id, quantity: 1 }, { id: a.id, quantity: 2 }]);
    const order = await mockOrder(request, body.id);
    expect(order.request.purchase_units[0].items.map((i) => [i.sku, i.quantity])).toEqual([[a.id, '3']]);
    expect(order.request.application_context.shipping_preference).toBe('GET_FROM_FILE');
    expect(order.requestIds[0]).toBeTruthy();
  });

  const cases = [
    { name: 'unknown', id: 'no-such-item', reason: /no longer available/ },
    { name: 'out-of-stock', id: outOfStock.id, reason: /out of stock/ },
    { name: 'Amazon-only', id: amazonOnly.id, reason: /not sold on this site/ },
    { name: 'PDF-only module', id: digital.id, reason: /PDF on DriveThruRPG/ },
  ];
  for (const c of cases) {
    test(`rejects a ${c.name} item and says why`, async ({ request }) => {
      const { status, body } = await createOrder(request, [{ id: inStock[0].id, quantity: 1 }, { id: c.id, quantity: 1 }]);
      expect(status).toBe(422);
      expect(body.id).toBeUndefined();
      expect(body.rejected).toEqual([{ id: c.id, reason: expect.stringMatching(c.reason) }]);
    });
  }

  test('rejects malformed requests', async ({ request }) => {
    const id = inStock[0].id;
    for (const items of [undefined, [], [{ id }], [{ id, quantity: 0 }], [{ id, quantity: 1.5 }], [{ quantity: 1 }]]) {
      expect((await createOrder(request, items as object[])).status, JSON.stringify(items)).toBe(422);
    }
    const tooMany = await createOrder(request, [{ id, quantity: 11 }]);
    expect(tooMany.body.rejected).toEqual([{ id, reason: expect.stringMatching(/up to 10/) }]);
    expect((await request.get('/api/orders')).status()).toBe(405);
  });

  test('capture completes the order through PayPal', async ({ request }) => {
    const { body } = await createOrder(request, [{ id: inStock[0].id, quantity: 1 }]);
    const response = await request.post(`/api/orders/${body.id}/capture`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ id: body.id, status: 'COMPLETED', payerName: 'Test' });
    const order = await mockOrder(request, body.id);
    expect(order.captures).toBe(1);
    expect(order.requestIds).toContain(`capture-${body.id}`);
  });

  test('capture refuses an order this site did not price', async ({ request }) => {
    // Someone creates an order with our public client id at their own price.
    const [a] = inStock;
    const forged = await request.post(`${PAYPAL_MOCK}/v2/checkout/orders`, {
      headers: { Authorization: 'Bearer mock-access-token' },
      data: {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: '1.00', breakdown: { item_total: { currency_code: 'USD', value: '1.00' }, shipping: { currency_code: 'USD', value: '0.00' } } },
          items: [{ name: a.name, sku: a.id, quantity: '1', unit_amount: { currency_code: 'USD', value: '1.00' } }],
        }],
      },
    });
    const { id } = await forged.json();
    const response = await request.post(`/api/orders/${id}/capture`);
    expect(response.status()).toBe(422);
    expect((await mockOrder(request, id)).captures).toBe(0);
  });

  test('a declined payment asks PayPal to let the buyer try another way', async ({ request }) => {
    const { body } = await createOrder(request, [{ id: inStock[0].id, quantity: 1 }]);
    await request.post(`${PAYPAL_MOCK}/__mock/orders/${body.id}/decline`);
    const response = await request.post(`/api/orders/${body.id}/capture`);
    expect(response.status()).toBe(422);
    expect((await response.json()).restart).toBe(true);
    expect((await mockOrder(request, body.id)).captures).toBe(0);
  });

  test('capture rejects a malformed order id', async ({ request }) => {
    expect((await request.post('/api/orders/not%20an%20id/capture')).status()).toBe(400);
  });
});

// Stands in for the PayPal JavaScript SDK: one button that runs the cart's
// createOrder and onApprove, as PayPal would after the buyer approves.
const FAKE_SDK = `
window.paypal = {
  version: 'mock',
  Buttons(props) {
    return {
      isEligible: () => true,
      close: () => Promise.resolve(),
      render(container) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        const button = document.createElement('button');
        button.textContent = 'Pay with mock PayPal';
        button.onclick = async () => {
          try {
            const orderID = await props.createOrder({}, {});
            await props.onApprove({ orderID }, { restart: () => { window.__paypalRestarted = true; } });
          } catch (err) {
            props.onError && props.onError(err);
          }
        };
        el.appendChild(button);
        return Promise.resolve();
      },
    };
  },
};`;

async function useFakePayPal(page: Page) {
  await page.route('https://www.paypal.com/sdk/js**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: FAKE_SDK }),
  );
  const notes: string[] = [];
  await page.route('**/__forms.html', (route) => {
    notes.push(route.request().postData() ?? '');
    return route.fulfill({ status: 200, body: '' });
  });
  return notes;
}

async function addToCart(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: /Add .*to Cart|^Add / }).first().click();
  await expect(page).toHaveURL('/cart');
}

test.describe('cart checkout', () => {
  test('sends only ids and quantities, then captures and thanks the buyer', async ({ page, request }) => {
    const notes = await useFakePayPal(page);
    const product = getAllProducts().find((p) => p.sellDirect && p.availability === 'in_stock' && !p.variants.length)!;
    await addToCart(page, product.path);
    await page.getByLabel(/details you would like us to know/).fill('Please gift wrap');

    const orderRequest = page.waitForRequest((r) => r.url().endsWith('/api/orders') && r.method() === 'POST');
    await page.getByRole('button', { name: 'Pay with mock PayPal' }).click();
    expect((await orderRequest).postDataJSON()).toEqual({ items: [{ id: product.id, quantity: 1 }] });

    await expect(page).toHaveURL(/\/\?message=Test$/);
    await expect(page.getByText(/Thank you Test, for ordering/)).toBeVisible();

    const sent = new URLSearchParams(notes[0]);
    expect(sent.get('form-name')).toBe('contact');
    expect(sent.get('message')).toBe('Please gift wrap');
    const order = await mockOrder(request, sent.get('orderId')!);
    expect(order.status).toBe('COMPLETED');
    expect(order.request.purchase_units[0].items.map((i) => i.sku)).toEqual([product.id]);
  });

  test('an item that can no longer be ordered is explained and removed from the cart', async ({ page }) => {
    await useFakePayPal(page);
    const product = getAllProducts().find((p) => p.sellDirect && p.availability === 'in_stock' && !p.variants.length)!;
    await addToCart(page, product.path);
    // As if the module had been switched to PDF-only while it sat in the cart.
    await page.route('**/api/orders', (route) =>
      route.fulfill({
        status: 422,
        json: { error: 'Some items in your cart can’t be ordered.', rejected: [{ id: product.id, reason: 'This module is now sold as a PDF on DriveThruRPG.' }] },
      }),
    );
    await page.getByRole('button', { name: 'Pay with mock PayPal' }).click();
    // (Next's route announcer is also an alert.)
    const alert = page.getByRole('alert').filter({ hasText: 'can’t be ordered' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(`${product.name}: This module is now sold as a PDF on DriveThruRPG.`);
    await expect(page.getByText('Cart is empty.')).toBeVisible();
    await expect(page).toHaveURL('/cart');
  });
});
