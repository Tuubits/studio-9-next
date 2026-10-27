import { test, expect, type APIRequestContext } from '@playwright/test';
import type { NextApiRequest, NextApiResponse } from 'next';
import { buildCatalog, getAllProducts, getSellableItems, type Sources } from '../lib/catalog';
import { checkCart } from '../lib/merchantCart';
import createCart from '../pages/api/merchant-cart/index';
import updateCart from '../pages/api/merchant-cart/[id]/index';
import checkoutCart from '../pages/api/merchant-cart/[id]/checkout';
import { PAYPAL_MOCK, books, expectedShipping, games, modules } from './helpers';

// The Store Sync cart API (pages/api/merchant-cart). The test server runs it
// switched on, with the PayPal mock's signing keys (playwright.config.ts).
// No test reaches PayPal.

const inStock = getSellableItems().filter((i) => i.inStock);
const outOfStock = getSellableItems().find((i) => !i.inStock)!;
const digital = getAllProducts().find((p) => p.format === 'digital')!;
const amazonOnly = getAllProducts().find((p) => p.format === 'physical' && !p.sellDirect)!;

const US_ADDRESS = {
  full_name: 'Test Buyer',
  address_line_1: '1 Main St',
  admin_area_2: 'San Jose',
  admin_area_1: 'CA',
  postal_code: '95131',
  country_code: 'US',
};

type MockOrder = {
  request: {
    purchase_units: {
      amount: { value: string };
      items: { sku: string; quantity: string }[];
      shipping?: { name?: { full_name: string }; address: { country_code: string; postal_code?: string } };
    }[];
    application_context: { shipping_preference: string };
  };
  status: string;
  captures: number;
};

const mockOrder = async (request: APIRequestContext, id: string) =>
  (await (await request.get(`${PAYPAL_MOCK}/__mock/orders/${id}`)).json()) as MockOrder;

const now = () => Math.floor(Date.now() / 1000);

async function token(request: APIRequestContext, claims: object = { exp: now() + 300 }, kid?: string) {
  const response = await request.post(`${PAYPAL_MOCK}/__mock/sign`, { data: { claims, kid } });
  return ((await response.json()) as { token: string }).token;
}

async function call(request: APIRequestContext, method: 'POST' | 'PUT', path: string, data: object, auth?: string) {
  const response = await request.fetch(path, {
    method,
    data,
    headers: auth === undefined ? {} : { Authorization: auth },
  });
  return { status: response.status(), body: await response.json() };
}

function amounts(lines: { id: string; quantity: number }[]) {
  const item = (id: string) => inStock.find((i) => i.id === id)!;
  const subtotal = lines.reduce((sum, l) => sum + item(l.id).price * l.quantity, 0);
  const shipping = expectedShipping(lines.map((l) => ({ shippingCost: item(l.id).shippingCost, quantity: l.quantity })));
  return { subtotal: subtotal.toFixed(2), shipping: shipping.toFixed(2), total: (subtotal + shipping).toFixed(2) };
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The API does not depend on the screen size');
});

test('every route is a 404 while STORE_SYNC_ENABLED is not "true"', async () => {
  // The handlers run in this process, where the switch is not set.
  const saved = process.env.STORE_SYNC_ENABLED;
  for (const value of [undefined, 'false', '1']) {
    if (value === undefined) delete process.env.STORE_SYNC_ENABLED;
    else process.env.STORE_SYNC_ENABLED = value;
    for (const handler of [createCart, updateCart, checkoutCart]) {
      let status = 0;
      const res = {
        status(code: number) { status = code; return this; },
        json() { return this; },
        setHeader() { return this; },
      };
      const req = { method: 'POST', query: { id: 'X' }, headers: {}, body: {} };
      await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
      expect(status, `${handler.name} with STORE_SYNC_ENABLED=${value}`).toBe(404);
    }
  }
  if (saved === undefined) delete process.env.STORE_SYNC_ENABLED;
  else process.env.STORE_SYNC_ENABLED = saved;
});

test('requests without a valid PayPal token get a 401', async ({ request }) => {
  const body = { items: [{ variant_id: inStock[0].id, quantity: 1 }], shipping_address: US_ADDRESS };
  const good = await token(request);
  const [header, payload, signature] = good.split('.');
  const forged = `${header}.${Buffer.from(JSON.stringify({ exp: now() + 9999, admin: true })).toString('base64url')}.${signature}`;
  const cases: [string, string | undefined][] = [
    ['no header', undefined],
    ['not a bearer token', `Basic ${Buffer.from('a:b').toString('base64')}`],
    ['malformed', 'Bearer not-a-jwt'],
    ['changed claims', `Bearer ${forged}`],
    ['bad signature', `Bearer ${header}.${payload}.${signature.slice(0, -4)}AAAA`],
    ['expired', `Bearer ${await token(request, { exp: now() - 3600 })}`],
    ['no expiry', `Bearer ${await token(request, {})}`],
    ['not yet valid', `Bearer ${await token(request, { exp: now() + 7200, nbf: now() + 3600 })}`],
    ['unknown key', `Bearer ${await token(request, { exp: now() + 300 }, 'some-other-key')}`],
  ];
  for (const [name, auth] of cases) {
    for (const [method, path] of [['POST', '/api/merchant-cart'], ['PUT', '/api/merchant-cart/MOCK1'], ['POST', '/api/merchant-cart/MOCK1/checkout']] as const) {
      const { status } = await call(request, method, path, body, auth);
      expect(status, `${name}: ${method} ${path}`).toBe(401);
    }
  }
});

test('create, replace and check out a cart', async ({ request }) => {
  const auth = `Bearer ${await token(request)}`;
  const [a, b, c] = inStock;

  // Create: prices and shipping come from the catalog, never from the request.
  const first = [{ id: a.id, quantity: 2 }, { id: b.id, quantity: 1 }];
  const created = await call(request, 'POST', '/api/merchant-cart', {
    items: first.map((l) => ({ variant_id: l.id, quantity: l.quantity, price: { currency_code: 'USD', value: '0.01' } })),
    shipping_address: US_ADDRESS,
    payment_method: { type: 'paypal' },
  }, auth);
  expect(created.status).toBe(201);
  const cart = created.body;
  expect(cart.status).toBe('CREATED');
  expect(cart.validation_status).toBe('VALID');
  expect(cart.validation_issues).toEqual([]);
  expect(cart.payment_method).toEqual({ type: 'paypal', token: cart.id });
  expect(cart.items.map((i: { variant_id: string; quantity: number }) => [i.variant_id, i.quantity])).toEqual(first.map((l) => [l.id, l.quantity]));
  const expected = amounts(first);
  expect([cart.totals.subtotal.value, cart.totals.shipping.value, cart.totals.total.value]).toEqual([expected.subtotal, expected.shipping, expected.total]);
  expect(cart.shipping_address).toMatchObject({ country_code: 'US', postal_code: '95131', full_name: 'Test Buyer' });

  let order = await mockOrder(request, cart.id);
  expect(order.request.application_context.shipping_preference).toBe('SET_PROVIDED_ADDRESS');
  expect(order.request.purchase_units[0].shipping).toMatchObject({ name: { full_name: 'Test Buyer' }, address: { country_code: 'US' } });
  expect(order.request.purchase_units[0].amount.value).toBe(expected.total);

  // Replace: the PUT body is the whole cart; items not in it are gone.
  const second = [{ id: c.id, quantity: 3 }];
  const updated = await call(request, 'PUT', `/api/merchant-cart/${cart.id}`, {
    items: second.map((l) => ({ variant_id: l.id, quantity: l.quantity })),
    shipping_address: US_ADDRESS,
  }, auth);
  expect(updated.status).toBe(200);
  expect(updated.body.id).toBe(cart.id);
  expect(updated.body.items.map((i: { variant_id: string }) => i.variant_id)).toEqual([c.id]);
  expect(updated.body.totals.total.value).toBe(amounts(second).total);
  order = await mockOrder(request, cart.id);
  expect(order.request.purchase_units[0].items.map((i) => [i.sku, i.quantity])).toEqual([[c.id, '3']]);
  expect(order.request.purchase_units[0].amount.value).toBe(amounts(second).total);

  // Checkout captures the PayPal order once.
  const done = await call(request, 'POST', `/api/merchant-cart/${cart.id}/checkout`, { payment_method: { type: 'paypal', token: cart.id } }, auth);
  expect(done.status).toBe(200);
  expect(done.body.status).toBe('COMPLETED');
  expect(done.body.payment_confirmation).toMatchObject({ order_number: cart.id, paypal_order_id: cart.id, capture_id: `CAPTURE-${cart.id}` });
  order = await mockOrder(request, cart.id);
  expect(order.status).toBe('COMPLETED');
  expect(order.captures).toBe(1);
});

test('problem items and addresses come back as validation issues', async ({ request }) => {
  const auth = `Bearer ${await token(request)}`;
  const good = inStock[0];
  const { status, body } = await call(request, 'POST', '/api/merchant-cart', {
    items: [
      { variant_id: good.id, quantity: 1 },
      { variant_id: outOfStock.id, quantity: 1 },
      { variant_id: digital.id, quantity: 1 },
      { variant_id: amazonOnly.id, quantity: 1 },
      { variant_id: 'no-such-item', quantity: 1 },
      { variant_id: inStock[1].id, quantity: 11 },
    ],
    shipping_address: { ...US_ADDRESS, country_code: 'CA' },
  }, auth);
  expect(status).toBe(201);
  expect(body.status).toBe('INCOMPLETE');
  expect(body.validation_status).toBe('INVALID');
  const issues = Object.fromEntries(
    body.validation_issues.map((i: { variant_id?: string; type: string; code: string }) => [i.variant_id ?? i.type, i.code]),
  );
  expect(issues).toEqual({
    [outOfStock.id]: 'ITEM_OUT_OF_STOCK',
    [digital.id]: 'ITEM_NOT_AVAILABLE',
    [amazonOnly.id]: 'ITEM_NOT_AVAILABLE',
    'no-such-item': 'ITEM_NOT_FOUND',
    [inStock[1].id]: 'QUANTITY_NOT_AVAILABLE',
    SHIPPING_ADDRESS: 'SHIPPING_ADDRESS_NOT_SUPPORTED',
  });
  expect(body.validation_issues.find((i: { variant_id?: string }) => i.variant_id === digital.id).message).toMatch(/PDF on DriveThruRPG/);

  // Only the good item is in the PayPal order, with no address.
  const order = await mockOrder(request, body.id);
  expect(order.request.purchase_units[0].items.map((i) => i.sku)).toEqual([good.id]);
  expect(order.request.purchase_units[0].shipping).toBeUndefined();

  // Checkout refuses to capture without a US address.
  const checkout = await call(request, 'POST', `/api/merchant-cart/${body.id}/checkout`, {}, auth);
  expect(checkout.status).toBe(422);
  expect(checkout.body.details[0].issue).toBe('SHIPPING_ADDRESS_REQUIRED');
  expect((await mockOrder(request, body.id)).captures).toBe(0);
});

test('a cart with nothing that can be bought is a 422', async ({ request }) => {
  const auth = `Bearer ${await token(request)}`;
  const { status, body } = await call(request, 'POST', '/api/merchant-cart', {
    items: [{ variant_id: digital.id, quantity: 1 }, { variant_id: outOfStock.id, quantity: 1 }],
  }, auth);
  expect(status).toBe(422);
  expect(body.name).toBe('UNPROCESSABLE_ENTITY');
  expect(body.details.map((d: { issue: string; business_context: { variant_id: string } }) => [d.business_context.variant_id, d.issue])).toEqual([
    [digital.id, 'ITEM_NOT_AVAILABLE'],
    [outOfStock.id, 'ITEM_OUT_OF_STOCK'],
  ]);
});

test('malformed carts are a 400', async ({ request }) => {
  const auth = `Bearer ${await token(request)}`;
  for (const data of [{}, { items: 'x' }, { items: [{ variant_id: inStock[0].id }] }, { items: [{ variant_id: inStock[0].id, quantity: 0 }] }, { items: [{ quantity: 1 }] }]) {
    expect((await call(request, 'POST', '/api/merchant-cart', data, auth)).status, JSON.stringify(data)).toBe(400);
  }
});

test('updating an expired cart starts a new PayPal order', async ({ request }) => {
  const auth = `Bearer ${await token(request)}`;
  const items = [{ variant_id: inStock[0].id, quantity: 1 }];
  const { body: cart } = await call(request, 'POST', '/api/merchant-cart', { items, shipping_address: US_ADDRESS }, auth);
  await request.post(`${PAYPAL_MOCK}/__mock/orders/${cart.id}/expire`);
  const { status, body } = await call(request, 'PUT', `/api/merchant-cart/${cart.id}`, { items, shipping_address: US_ADDRESS }, auth);
  expect(status).toBe(200);
  expect(body.id).not.toBe(cart.id);
  expect(body.payment_method.token).toBe(body.id);
  expect((await mockOrder(request, body.id)).request.purchase_units[0].items.map((i) => i.sku)).toEqual([inStock[0].id]);
});

test('checkout refuses an order that does not match the catalog', async ({ request }) => {
  const auth = `Bearer ${await token(request)}`;
  // An order made directly with PayPal (our client id is public) at a made-up price.
  const item = inStock[0];
  const forged = await request.post(`${PAYPAL_MOCK}/v2/checkout/orders`, {
    headers: { Authorization: 'Bearer mock-access-token' },
    data: {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: '1.00', breakdown: { item_total: { currency_code: 'USD', value: '1.00' }, shipping: { currency_code: 'USD', value: '0.00' } } },
        items: [{ name: item.name, sku: item.id, quantity: '1', unit_amount: { currency_code: 'USD', value: '1.00' }, category: 'PHYSICAL_GOODS' }],
        shipping: { address: { country_code: 'US' } },
      }],
    },
  });
  const { id } = await forged.json();
  const { status, body } = await call(request, 'POST', `/api/merchant-cart/${id}/checkout`, {}, auth);
  expect(status).toBe(422);
  expect(body.details[0].issue).toBe('CART_PRICES_CHANGED');
  expect((await mockOrder(request, id)).captures).toBe(0);
});

test('checking out an unknown cart is a 404', async ({ request }) => {
  const auth = `Bearer ${await token(request)}`;
  expect((await call(request, 'POST', '/api/merchant-cart/NOSUCHORDER/checkout', {}, auth)).status).toBe(404);
});

test('switching a module to PDF-only makes Store Sync turn it away', () => {
  const data = JSON.parse(JSON.stringify({ games, books, modules })) as Sources;
  const target = data.modules.find((m) => !m.pdfOnly && m.signedCopyOptions?.length)!;
  const variantIds = getSellableItems().filter((i) => i.productId === target.id).map((i) => i.id);
  const items = variantIds.map((id) => ({ variant_id: id, quantity: 1 }));
  expect(checkCart({ items }, buildCatalog(data))!.issues).toEqual([]);

  target.pdfOnly = true;
  target.price = null;
  const { lines, issues } = checkCart({ items }, buildCatalog(data))!;
  expect(lines).toEqual([]);
  expect(issues.map((i) => [i.variant_id, i.code, i.message])).toEqual(
    variantIds.map((id) => [id, 'ITEM_NOT_AVAILABLE', 'This module is now sold only as a PDF on DriveThruRPG.']),
  );
});
