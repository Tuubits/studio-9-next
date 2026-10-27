// Shipping for an order, shared by the cart (utils/Store.js) and the order API.
// Each unit is ranked by its shipping cost, highest first: the first pays in
// full, the second 50%, the third 25%, and every further unit 12.5%.
const SHARES = [1, 0.5, 0.25];
const LATER_SHARE = 0.125;

export function shippingFor(lines: { shippingCost: number; quantity: number }[]) {
  const units = lines
    .flatMap((line) => Array.from({ length: line.quantity }, () => line.shippingCost))
    .sort((a, b) => b - a);
  const total = units.reduce((sum, cost, rank) => sum + cost * (SHARES[rank] ?? LATER_SHARE), 0);
  return Math.round(total * 100) / 100;
}
