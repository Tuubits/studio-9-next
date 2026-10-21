import type { Product, SellableItem } from './catalog';

// Product feeds (PayPal Store Sync, Google Merchant Center), the sitemap and
// robots.txt, built from the catalog by scripts/build-feeds.mjs at build time.
// Only type imports here, so Node can run this file directly.

export type Catalog = { products: Product[]; sellable: SellableItem[] };

export type FeedRow = {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_link: string[];
  price: string;
  availability: 'in_stock' | 'out_of_stock';
  brand: string;
  gtin: string;
  mpn: string;
  condition: 'new';
  item_group_id: string;
  shipping: string;
  google_product_category: string;
  is_eligible_search: boolean;
  is_eligible_checkout: boolean;
};

const PAYPAL_COLUMNS: (keyof FeedRow)[] = [
  'id', 'title', 'description', 'link', 'image_link', 'additional_image_link', 'price', 'availability',
  'brand', 'gtin', 'mpn', 'condition', 'item_group_id', 'shipping', 'google_product_category',
  'is_eligible_search', 'is_eligible_checkout',
];

// Google product taxonomy ids: Toys & Games > Games, and Media > Books > Print Books.
const GOOGLE_CATEGORY = { games: '1239', books: '543543', 'golden-era-gaming': '543543' };

// Search crawlers and AI assistants that robots.txt welcomes by name.
export const CRAWLERS = [
  'Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User',
];

const money = (amount: number) => `${amount.toFixed(2)} USD`;
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

// One row per physical item we sell here (each variant gets its own row).
// Left out: PDF-only modules (sold on DriveThruRPG) and items we don't sell
// here (Amazon-only books), which have no price of ours to list.
export function feedRows({ products, sellable }: Catalog) {
  const rows: FeedRow[] = [];
  for (const item of sellable) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.format !== 'physical') continue;
    rows.push({
      id: item.id,
      title: item.name,
      description: oneLine(product.description),
      link: product.url,
      image_link: product.image,
      additional_image_link: product.additionalImages.slice(0, 10),
      price: money(item.price),
      availability: item.inStock ? 'in_stock' : 'out_of_stock',
      brand: product.brand,
      gtin: product.gtin ?? product.isbn ?? '',
      mpn: product.mpn ?? '',
      condition: 'new',
      item_group_id: product.variants.length ? product.id : '',
      shipping: `US:::${money(item.shippingCost)}`,
      google_product_category: GOOGLE_CATEGORY[product.category],
      is_eligible_search: true,
      is_eligible_checkout: item.inStock,
    });
  }
  const excluded = {
    digital: products.filter((p) => p.format === 'digital').map((p) => p.id),
    notSoldHere: products.filter((p) => p.format === 'physical' && !p.sellDirect).map((p) => p.id),
  };
  return { rows, excluded };
}

// Problems that would get a row rejected; an empty gtin is allowed.
export function validateRows(rows: FeedRow[]) {
  const errors: string[] = [];
  const required: (keyof FeedRow)[] = ['id', 'title', 'link', 'image_link', 'price', 'availability', 'brand', 'shipping', 'google_product_category'];
  for (const row of rows) {
    for (const field of required) if (!row[field]) errors.push(`${row.id || '(no id)'}: missing ${field}`);
    if (row.description.length < 25) errors.push(`${row.id}: description shorter than 25 characters`);
  }
  const ids = rows.map((r) => r.id);
  for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) errors.push(`${id}: duplicate id`);
  return { errors, missingGtin: rows.filter((r) => !r.gtin).map((r) => r.id) };
}

const tsvCell = (value: FeedRow[keyof FeedRow]) =>
  Array.isArray(value) ? value.join(',') : oneLine(String(value)).replace(/\t/g, ' ');

export function paypalFeed(rows: FeedRow[]) {
  const lines = [PAYPAL_COLUMNS.join('\t'), ...rows.map((row) => PAYPAL_COLUMNS.map((c) => tsvCell(row[c])).join('\t'))];
  return lines.join('\n') + '\n';
}

const xml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function googleFeed(rows: FeedRow[], siteUrl: string) {
  const items = rows.map((row) => {
    const tags = [
      `<g:id>${xml(row.id)}</g:id>`,
      `<title>${xml(row.title)}</title>`,
      `<description>${xml(row.description)}</description>`,
      `<link>${xml(row.link)}</link>`,
      `<g:image_link>${xml(row.image_link)}</g:image_link>`,
      ...row.additional_image_link.map((src) => `<g:additional_image_link>${xml(src)}</g:additional_image_link>`),
      `<g:price>${row.price}</g:price>`,
      `<g:availability>${row.availability}</g:availability>`,
      `<g:brand>${xml(row.brand)}</g:brand>`,
      row.gtin ? `<g:gtin>${row.gtin}</g:gtin>` : '',
      row.mpn ? `<g:mpn>${xml(row.mpn)}</g:mpn>` : '',
      `<g:condition>${row.condition}</g:condition>`,
      row.item_group_id ? `<g:item_group_id>${xml(row.item_group_id)}</g:item_group_id>` : '',
      `<g:shipping><g:country>US</g:country><g:price>${row.shipping.split(':::')[1]}</g:price></g:shipping>`,
      `<g:google_product_category>${row.google_product_category}</g:google_product_category>`,
    ].filter(Boolean);
    return `    <item>\n${tags.map((t) => `      ${t}`).join('\n')}\n    </item>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    '    <title>Studio 9 Inc</title>',
    `    <link>${siteUrl}</link>`,
    '    <description>Games, books and Golden Era Gaming modules sold by Studio 9 Inc</description>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

// Every public page: the cart is left out (it is noindex).
export function sitemapPaths({ products }: Catalog) {
  return ['/', '/games', '/golden-era-gaming', '/golden-era-gaming/mystery', '/shipping-returns', ...products.map((p) => p.path)];
}

export function sitemap(catalog: Catalog, siteUrl: string) {
  const urls = sitemapPaths(catalog).map((path) => `  <url><loc>${xml(siteUrl + path)}</loc></url>`);
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n');
}

export function robots(siteUrl: string) {
  return [
    '# Search engines and AI assistants are welcome.',
    'User-agent: *',
    'Allow: /',
    '',
    ...CRAWLERS.map((name) => `User-agent: ${name}`),
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}
