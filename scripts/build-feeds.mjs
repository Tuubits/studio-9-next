// Writes the product feeds, sitemap.xml and robots.txt into public/ from the
// catalog. Runs before `next build` and `next dev` (see package.json).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL, getAllProducts, getSellableItems } from '../lib/catalog.ts';
import { feedRows, googleFeed, paypalFeed, robots, sitemap, validateRows } from '../lib/feeds.ts';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const catalog = { products: getAllProducts(), sellable: getSellableItems() };
const { rows, excluded } = feedRows(catalog);

const { errors, missingGtin } = validateRows(rows);
if (errors.length) {
  console.error(`Product feed has problems:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

const files = {
  'feeds/paypal-store-sync.tsv': paypalFeed(rows),
  'feeds/google.xml': googleFeed(rows, SITE_URL),
  'sitemap.xml': sitemap(catalog, SITE_URL),
  'robots.txt': robots(SITE_URL),
};
for (const [path, content] of Object.entries(files)) {
  mkdirSync(dirname(join(publicDir, path)), { recursive: true });
  writeFileSync(join(publicDir, path), content);
}

console.log(
  `Feeds: ${rows.length} physical rows; left out ${excluded.digital.length} PDF-only modules and ${excluded.notSoldHere.length} items not sold here.`,
);
if (missingGtin.length) console.warn(`Feeds: ${missingGtin.length} rows have no GTIN (optional; see AGENT_COMMERCE_TODO.md).`);
