// Accessible name for an outbound buy link: its text plus the store it opens,
// e.g. "Purchase here on Amazon", so shoppers and browsing agents know where it goes.
export function sellerLabel(product, option) {
  const offer = product.externalOffers.find((o) => o.url === option.link);
  return offer && !option.name.includes(offer.seller) ? `${option.name} on ${offer.seller}` : option.name;
}
