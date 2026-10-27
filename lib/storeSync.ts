import { createPublicKey, verify, type JsonWebKey } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

// Shared plumbing for the Store Sync cart API (pages/api/merchant-cart):
// the on/off switch and the check that a request really comes from PayPal.
//
// PayPal calls these routes with `Authorization: Bearer <JWT>`, signed with
// keys it publishes as a JWKS. PAYPAL_JWKS_URL says where; PayPal gives the
// URL (and the expected issuer and audience) during Store Sync onboarding.
// TODO: confirm the JWKS URL, issuer and audience from PayPal's onboarding docs.

export const storeSyncEnabled = () => process.env.STORE_SYNC_ENABLED === 'true';

const CLOCK_SKEW_SECONDS = 30;
const JWKS_TTL_MS = 10 * 60 * 1000;

type Jwk = JsonWebKey & { kid?: string; alg?: string; use?: string };
let jwks: { url: string; keys: Jwk[]; fetched: number } | null = null;

async function signingKeys(url: string, refresh = false) {
  if (!refresh && jwks && jwks.url === url && Date.now() - jwks.fetched < JWKS_TTL_MS) return jwks.keys;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetching the PayPal JWKS failed (${response.status})`);
  const { keys } = (await response.json()) as { keys?: Jwk[] };
  jwks = { url, keys: keys ?? [], fetched: Date.now() };
  return jwks.keys;
}

const decodePart = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

// Returns null when the token is good, otherwise why it was refused.
export async function tokenProblem(authorization: string | undefined): Promise<string | null> {
  const url = process.env.PAYPAL_JWKS_URL;
  if (!url) return 'Store Sync is not configured (PAYPAL_JWKS_URL)';
  const token = authorization?.match(/^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/)?.[1];
  if (!token) return 'Missing bearer token';

  const [headerPart, payloadPart, signaturePart] = token.split('.');
  let header: { alg?: string; kid?: string };
  let claims: { exp?: number; nbf?: number; iss?: string; aud?: string | string[] };
  try {
    header = decodePart(headerPart);
    claims = decodePart(payloadPart);
  } catch {
    return 'Malformed token';
  }
  if (header.alg !== 'RS256' && header.alg !== 'ES256') return 'Unsupported token algorithm';

  let keys = await signingKeys(url);
  let jwk = keys.find((k) => k.kid === header.kid);
  // PayPal may have rotated its keys since we cached them.
  if (!jwk) {
    keys = await signingKeys(url, true);
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) return 'Unknown signing key';

  let valid = false;
  try {
    const key = createPublicKey({ key: jwk, format: 'jwk' });
    valid = verify(
      'sha256',
      Buffer.from(`${headerPart}.${payloadPart}`),
      header.alg === 'ES256' ? { key, dsaEncoding: 'ieee-p1363' } : key,
      Buffer.from(signaturePart, 'base64url'),
    );
  } catch {
    valid = false;
  }
  if (!valid) return 'Bad token signature';

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_SECONDS < now) return 'Token expired';
  if (typeof claims.nbf === 'number' && claims.nbf - CLOCK_SKEW_SECONDS > now) return 'Token not yet valid';
  const issuer = process.env.PAYPAL_JWT_ISSUER;
  if (issuer && claims.iss !== issuer) return 'Wrong token issuer';
  const audience = process.env.PAYPAL_JWT_AUDIENCE;
  if (audience && !(Array.isArray(claims.aud) ? claims.aud : [claims.aud]).includes(audience)) return 'Wrong token audience';
  return null;
}

// Runs the switch and the token check. Returns true when the handler may go on;
// otherwise the response has been sent (404 while switched off, 401 for a bad token).
export async function admitStoreSyncRequest(req: NextApiRequest, res: NextApiResponse, methods: string[]) {
  if (!storeSyncEnabled()) {
    res.status(404).json({ name: 'NOT_FOUND', message: 'Not found' });
    return false;
  }
  if (!methods.includes(req.method ?? '')) {
    res.setHeader('Allow', methods.join(', '));
    res.status(405).json({ name: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
    return false;
  }
  let problem: string | null;
  try {
    problem = await tokenProblem(req.headers.authorization);
  } catch (error) {
    console.error('Checking a Store Sync token failed:', error instanceof Error ? error.message : error);
    res.status(503).json({ name: 'SERVICE_UNAVAILABLE', message: 'Could not check the request token' });
    return false;
  }
  if (problem) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    res.status(401).json({ name: 'UNAUTHORIZED', message: problem });
    return false;
  }
  return true;
}
