// A stand-in for the PayPal REST API, so tests never reach PayPal.
// playwright.config.ts starts it and points the site's PAYPAL_API_BASE here.
// Tests inspect what the site sent through the /__mock routes.
import { createServer } from 'node:http';

const PORT = Number(process.env.PAYPAL_MOCK_PORT || 4010);
const orders = new Map(); // id -> { request, status, captures, requestIds, declineNext }
let nextId = 1;

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
  });

const orderView = (id, order) => ({
  id,
  status: order.status,
  intent: order.request.intent,
  purchase_units: order.request.purchase_units,
  ...(order.status === 'COMPLETED' ? { payer: { name: { given_name: 'Test' } } } : {}),
});

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const body = await readBody(req);
  const auth = req.headers.authorization ?? '';
  let match;

  if (url.pathname === '/__mock/health') return send(res, 200, { ok: true });
  if ((match = url.pathname.match(/^\/__mock\/orders\/([^/]+)$/)) && req.method === 'GET') {
    const order = orders.get(match[1]);
    return order ? send(res, 200, order) : send(res, 404, { error: 'unknown order' });
  }
  if ((match = url.pathname.match(/^\/__mock\/orders\/([^/]+)\/decline$/)) && req.method === 'POST') {
    orders.get(match[1]).declineNext = true;
    return send(res, 200, { ok: true });
  }

  if (url.pathname === '/v1/oauth2/token' && req.method === 'POST') {
    if (!auth.startsWith('Basic ') || body !== 'grant_type=client_credentials') return send(res, 401, { error: 'invalid_client' });
    return send(res, 200, { access_token: 'mock-access-token', token_type: 'Bearer', expires_in: 32400 });
  }
  if (!url.pathname.startsWith('/v2/')) return send(res, 404, { message: 'not found' });
  if (auth !== 'Bearer mock-access-token') return send(res, 401, { message: 'unauthorized' });

  if (url.pathname === '/v2/checkout/orders' && req.method === 'POST') {
    const id = `MOCK${String(nextId++).padStart(6, '0')}`;
    orders.set(id, { request: JSON.parse(body), status: 'CREATED', captures: 0, requestIds: [req.headers['paypal-request-id']] });
    return send(res, 201, { id, status: 'CREATED' });
  }
  if ((match = url.pathname.match(/^\/v2\/checkout\/orders\/([^/]+)(\/capture)?$/))) {
    const [, id, capture] = match;
    const order = orders.get(id);
    if (!order) return send(res, 404, { name: 'RESOURCE_NOT_FOUND', message: 'order not found' });
    if (!capture && req.method === 'GET') return send(res, 200, orderView(id, order));
    if (!capture && req.method === 'PATCH') {
      order.patches = [...(order.patches ?? []), JSON.parse(body)];
      return send(res, 204);
    }
    if (capture && req.method === 'POST') {
      order.requestIds.push(req.headers['paypal-request-id']);
      if (order.declineNext) {
        order.declineNext = false;
        return send(res, 422, { name: 'UNPROCESSABLE_ENTITY', message: 'declined', details: [{ issue: 'INSTRUMENT_DECLINED' }] });
      }
      order.captures += 1;
      order.status = 'COMPLETED';
      return send(res, 201, orderView(id, order));
    }
  }
  return send(res, 404, { message: 'not found' });
}).listen(PORT, () => console.log(`PayPal mock listening on ${PORT}`));
