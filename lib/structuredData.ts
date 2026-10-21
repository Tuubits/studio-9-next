import { SITE_URL, type Product } from './catalog';

export const SITE_NAME = 'Studio 9 Inc';
export const SITE_TAGLINE = 'A family friendly media company • Creating joy since 2005';
export const SITE_LOGO =
  'https://res.cloudinary.com/rollfunkydice-com/image/upload/q_auto,f_auto/v1672721304/studio9/s9incLOGO_covCLEAR_kwlbz5.png';

// Schema.org structured data for search engines and shopping agents. Built
// only from lib/catalog.ts so it always matches what the page sells.

export const RETURNS_PATH = '/shipping-returns';

const studio9 = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL };

const shippingDetails = (cost: number) => ({
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: cost.toFixed(2), currency: 'USD' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
});

// Matches /shipping-returns: defective items only, within 14 days of receipt.
const returnPolicy = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'US',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  itemCondition: 'https://schema.org/DamagedCondition',
  url: SITE_URL + RETURNS_PATH,
};

function ownOffer(product: Product, item: { name?: string; sku: string; price: number; shippingCost: number }) {
  return {
    '@type': 'Offer',
    ...(item.name ? { name: item.name } : {}),
    sku: item.sku,
    url: product.url,
    price: item.price.toFixed(2),
    priceCurrency: 'USD',
    availability: product.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: studio9,
    shippingDetails: shippingDetails(item.shippingCost),
    hasMerchantReturnPolicy: returnPolicy,
  };
}

export function productJsonLd(product: Product) {
  const offers: object[] = [];

  if (product.sellDirect) {
    if (product.variants.length) {
      for (const v of product.variants) offers.push(ownOffer(product, { name: v.name, sku: v.id, price: v.price, shippingCost: v.shippingCost }));
    } else {
      offers.push(ownOffer(product, { sku: product.id, price: product.price!, shippingCost: product.shippingCost! }));
    }
  }

  for (const o of product.externalOffers) {
    // A product we sell here only lists its PDF edition elsewhere; its other
    // store links (e.g. Midnight Legion's other books) are different products.
    if (o.kind === 'store' && product.sellDirect) continue;
    // No price: the other store sets it and may change it.
    offers.push({
      '@type': 'Offer',
      ...(o.kind === 'pdf' ? { name: 'PDF edition' } : {}),
      url: o.url,
      seller: { '@type': 'Organization', name: o.seller },
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': product.category === 'books' ? ['Product', 'Book'] : 'Product',
    '@id': `${product.url}#product`,
    name: product.name,
    description: product.description,
    url: product.url,
    image: [product.image, ...product.additionalImages],
    brand: { '@type': 'Brand', name: product.brand },
    sku: product.sku,
    ...(product.gtin ? { gtin13: product.gtin } : {}),
    ...(product.isbn ? { isbn: product.isbn } : {}),
    ...(product.mpn ? { mpn: product.mpn } : {}),
    offers,
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    email: 'info@studio9inc.com',
    sameAs: ['https://www.twitter.com/Studio_9_Games', 'https://www.youtube.com/@ackreader', 'https://www.facebook.com/Studio9Inc'],
  };
}
