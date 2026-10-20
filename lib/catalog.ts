import gameData from '../game_details.json';
import bookData from '../book_details.json';
import moduleData from '../module_details.json';

// One normalized view of every product, built from the three JSON files.
// Pages, feeds and the order APIs read products through here so they agree
// on ids, prices and what can be bought on this site.

export const SITE_URL = 'https://studio9inc.com';

export type Category = 'games' | 'books' | 'golden-era-gaming';

export type ExternalOffer = {
  label: string;
  url: string;
  seller: string;
  // 'pdf' is a module's DriveThruRPG PDF edition; 'store' is any other store link.
  kind: 'pdf' | 'store';
};

export type Variant = {
  id: string;
  name: string;
  price: number;
  shippingCost: number;
  itemGroupId: string;
};

// Something that can go in our own cart: a product without variants, or one variant.
export type SellableItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  shippingCost: number;
  inStock: boolean;
};

export type Product = {
  id: string;
  category: Category;
  name: string;
  description: string;
  path: string;
  url: string;
  image: string;
  additionalImages: string[];
  brand: string;
  sku: string;
  gtin: string | null;
  isbn: string | null;
  mpn: string | null;
  price: number | null;
  currency: 'USD';
  // Availability of our own offer; null when we don't sell it on this site.
  availability: 'in_stock' | 'out_of_stock' | null;
  shippingCost: number | null;
  // Physical goods we sell, or a module only sold as a PDF on DriveThruRPG.
  format: 'physical' | 'digital';
  sellDirect: boolean;
  externalOffers: ExternalOffer[];
  variants: Variant[];
  attributes: { players: string | null; ages: string | null; pages: number | null };
};

type BuyOption = { name: string; link?: string; addToCart?: boolean };
type ImageRef = { src: string; alt: string };

export type SourceRecord = {
  id: string;
  slug: string;
  name: string;
  title: string;
  details: string;
  moreDetails?: string;
  mainImage: string;
  productImage?: string;
  sideImages?: ImageRef[];
  price?: number | null;
  shippingCost?: number;
  outOfStock?: boolean;
  alternateBuyOptions?: BuyOption[];
  signedCopyOptions?: { name: string; price: number; shippingCost: number }[];
  driveThruLink?: string;
  pdfOnly?: boolean;
  [key: string]: unknown;
};

export type Sources = { games: SourceRecord[]; books: SourceRecord[]; modules: SourceRecord[] };

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function sellerFor(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host.startsWith('amazon.')) return 'Amazon';
  if (host === 'drivethrurpg.com') return 'DriveThruRPG';
  return host;
}

function isbn10ToIsbn13(isbn10: string) {
  const body = `978${isbn10.slice(0, 9)}`;
  const sum = body.split('').reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return body + ((10 - (sum % 10)) % 10);
}

// Amazon book URLs use the ISBN-10 as the product id (/dp/<isbn10>). Only
// accept it when the ISBN-10 check digit is valid.
function isbnFromAmazon(url: string) {
  const match = url.match(/amazon\.[a-z.]+\/(?:.*\/)?dp\/(\d{9}[\dX])/i);
  if (!match) return null;
  const digits = match[1].toUpperCase();
  const sum = digits.split('').reduce((s, d, i) => s + (d === 'X' ? 10 : Number(d)) * (10 - i), 0);
  return sum % 11 === 0 ? isbn10ToIsbn13(digits) : null;
}

function buildProduct(record: SourceRecord, category: Category): Product {
  const isModule = category === 'golden-era-gaming';
  const path = `/${category}/${record.id}`;
  const options = record.alternateBuyOptions ?? [];
  const linkOffers = options
    .filter((o): o is BuyOption & { link: string } => !!o.link)
    .map((o): ExternalOffer => ({ label: o.name, url: o.link, seller: sellerFor(o.link), kind: 'store' }));
  const pdfOffer: ExternalOffer[] = record.driveThruLink
    ? [{ label: 'Purchase PDF Edition', url: record.driveThruLink, seller: sellerFor(record.driveThruLink), kind: 'pdf' }]
    : [];

  // Mirrors what each page shows: books with buy options only link out; games
  // link out unless one option is our own add-to-cart; modules show either a
  // buy-option link or our signed copies.
  const digital = isModule && !!record.pdfOnly;
  const price = digital ? null : record.price ?? null;
  const sellDirect =
    price != null &&
    !digital &&
    (category === 'games' ? !options.length || options.some((o) => o.addToCart) : !options.length);

  const variants: Variant[] =
    sellDirect && isModule
      ? (record.signedCopyOptions ?? []).map((v) => ({
          id: `${record.id}-${slugify(v.name)}`,
          name: v.name,
          price: v.price,
          shippingCost: v.shippingCost,
          itemGroupId: record.id,
        }))
      : [];

  const isbn = category === 'books' ? linkOffers.map((o) => isbnFromAmazon(o.url)).find(Boolean) ?? null : null;

  return {
    id: record.id,
    category,
    name: record.title,
    description: [record.details, record.moreDetails].filter(Boolean).join('\n\n'),
    path,
    url: SITE_URL + path,
    image: record.productImage ?? record.mainImage,
    additionalImages: (record.sideImages ?? []).map((i) => i.src),
    brand: category === 'books' ? 'Studio 9 Inc' : 'Studio 9 Games',
    sku: record.id,
    gtin: isbn,
    isbn,
    mpn: null,
    price,
    currency: 'USD',
    availability: sellDirect ? (record.outOfStock ? 'out_of_stock' : 'in_stock') : null,
    shippingCost: sellDirect ? record.shippingCost ?? null : null,
    format: digital ? 'digital' : 'physical',
    sellDirect,
    externalOffers: [...linkOffers, ...pdfOffer],
    variants,
    attributes: { players: null, ages: null, pages: null },
  };
}

// Cart line names come from the record's `name` (what is sold, e.g.
// "Midnight Legion Box Set"), which can differ from the page title.
function sellableItems(p: Product, record: SourceRecord): SellableItem[] {
  if (!p.sellDirect) return [];
  const inStock = p.availability === 'in_stock';
  if (p.variants.length) {
    return p.variants.map((v) => ({
      id: v.id,
      productId: p.id,
      name: `${record.name} (${v.name})`,
      price: v.price,
      shippingCost: v.shippingCost,
      inStock,
    }));
  }
  return [{ id: p.id, productId: p.id, name: record.name, price: p.price!, shippingCost: p.shippingCost!, inStock }];
}

export function buildCatalog(sources: Sources) {
  const entries = [
    ...sources.games.map((r) => [r, buildProduct(r, 'games')] as const),
    ...sources.books.map((r) => [r, buildProduct(r, 'books')] as const),
    ...sources.modules.map((r) => [r, buildProduct(r, 'golden-era-gaming')] as const),
  ];
  const products = entries.map(([, p]) => p);

  const ids = new Set<string>();
  for (const p of products) {
    if (ids.has(p.id)) throw new Error(`Duplicate product id: ${p.id}`);
    // pages/golden-era-gaming/mystery.jsx owns that URL.
    if (p.category === 'golden-era-gaming' && p.id === 'mystery') throw new Error('Module id "mystery" is reserved');
    ids.add(p.id);
  }

  const sellable = entries.flatMap(([r, p]) => sellableItems(p, r));

  return { products, sellable };
}

const sources: Sources = {
  games: (gameData as { games: SourceRecord[] }).games,
  books: (bookData as { books: SourceRecord[] }).books,
  modules: moduleData as SourceRecord[],
};

const catalog = buildCatalog(sources);

export const getAllProducts = () => catalog.products;
export const getProduct = (id: string) => catalog.products.find((p) => p.id === id) ?? null;
export const getProductsByCategory = (category: Category) => catalog.products.filter((p) => p.category === category);
// Cart ids: product ids for products without variants, variant ids otherwise.
export const getSellableItems = () => catalog.sellable;
export const getSellableItem = (id: string) => catalog.sellable.find((i) => i.id === id) ?? null;

// The raw JSON record, for page fields the catalog does not normalize
// (reviews, videos, side image alt text).
export function getSourceRecord(category: Category, id: string) {
  const list = category === 'games' ? sources.games : category === 'books' ? sources.books : sources.modules;
  return list.find((r) => r.id === id) ?? null;
}
