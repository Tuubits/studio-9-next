# Agent commerce TODO

Open items for the owners (Aaron/Lisa) and for later phases. Each phase adds to this file.

## Versions in use (Phase 1)

- Next.js 16.4.1 (pages router, Turbopack builds), React 19.3.1, TypeScript 5.9, ESLint 9 flat config.
- Node 22 (`.nvmrc`); `package.json` `engines` requires Node >= 20.9.

## Netlify changes needed before deploying Phase 1

- **Next.js adapter.** Next 13.0 used Netlify's legacy Next runtime; Next 13.5+ uses the current adapter (OpenNext). It is zero-config (no `netlify.toml` needed). Netlify recommends not pinning its version. Confirm the deploy preview builds and the site works there.
- **Netlify Forms moved.** The current adapter only detects forms in static HTML, so the `contact` and `mystery-room-challenge` forms are now defined in `public/__forms.html` and the pages POST to `/__forms.html`. Netlify fails the build with "@netlify/plugin-nextjs@5 requires migration steps to support Netlify Forms" if this is missing. **Test both forms on the deploy preview** (submit the mystery form; click a PayPal button in the cart with a note to send the `contact` form) and check the submissions appear in Netlify's Forms tab.
- **Lightbox license.** `lightbox.js-react` was replaced by `yet-another-react-lightbox` (MIT, no key) because it has no working React 19 release. The lightbox.js license key is no longer used; cancel that subscription if there is one.

## Deferred upgrades

- App Router: not needed for this work; possible later migration.
- Tailwind 4 / daisyUI 5: separate upgrade later (currently Tailwind 3.2 + daisyUI 2).
- `lucide-react` 0.525 → 1.x: works with React 19 as is; upgrade separately.

## Known bugs found by the Phase 0 tests

These are marked `test.fixme` and are not fixed yet.

- **Dottie and Me Activity Book video.** `videoLink` in `book_details.json` holds placeholder text ("Testimonial ipsum dolor sit amet…") instead of a YouTube video id, so the page throws "Invalid video id" in the browser. Owners: supply the real video id, or remove the field. Test: `e2e/smoke.spec.ts`.
- **Out of Stock button is not really disabled.** On Global Crisis it is only styled as disabled (daisyUI `btn-disabled`) and has no `disabled` attribute, so screen readers and shopping agents see an enabled button. To be fixed in Phase 1 or 7. Test: `e2e/product.spec.ts`.

## Product identifiers (optional)

Barcodes help shopping feeds and AI agents match products across stores, but nothing is required. If a box or book has a barcode, its number is the UPC or ISBN; send it and it goes in the JSON data. If there is no barcode, leave it: the feeds will say the product has no GTIN, which small publishers are allowed to do. Do not buy barcodes for this.

- **ISBNs found automatically (please verify):** Zanjan → 978-1-931847-88-9 and Sweet Neighbors Come in All Colors → 978-1-61851-128-7, both read from their Amazon links in `book_details.json`.
- **Games with no identifier yet:** Charms: Antiracism, Villagers and Villains, Villagers and Villains: Borderlands, Villagers and Villains: City Builder, Treasures and Traps, Treasures and Traps: Expanded Realms, Treasures and Traps: Expanded Realms 2, Treasures and Traps: Random Encounters, Hero versus Guardian, Midnight Legion, Global Crisis, Charms.
- **Books with no identifier yet:** Blessed is the Spot, Dottie and Me Activity Book.
- **Physical Golden Era modules with no identifier yet:** Riders on the Midnight Storm, Into the Dark, Die, Robot!, 101 Hex Encounters, Greenwood of the Fey Sovereign, Reckoning of the Gods, A Strange Night at the Pint 'n' Pony, 101 City Encounters, Welcome to Eastwood, The Towers of Dr.Xill, The Years Between, Cathedral of the Undying.
- MPN (manufacturer part number) is left empty; the catalog uses each product id as its SKU.
- Player counts, ages and page counts are not in the data (`attributes` in `lib/catalog.ts` are null). Optional for feeds.

## Golden Era: switching a module to PDF-only

Set `"pdfOnly": true` and `"price": null` on the module in `module_details.json` (you can also delete `signedCopyOptions`), then rebuild. The module page, the Golden Era page and the cart follow automatically; later phases' structured data, feeds and order APIs do too. Physical modules today: Riders on the Midnight Storm, Into the Dark, Die, Robot!, 101 Hex Encounters, Greenwood of the Fey Sovereign, Reckoning of the Gods, A Strange Night at the Pint 'n' Pony, 101 City Encounters, Welcome to Eastwood, The Towers of Dr.Xill, The Years Between, Cathedral of the Undying.

## Shipping & returns policy (Phase 3)

`/shipping-returns` is live with placeholders marked "[to be confirmed]" (see `pages/shipping-returns.jsx`). Owners, please supply:

- How many days customers have to return an item, and whether it must be unopened.
- Who pays return shipping.
- What happens with damaged or lost shipments.
- Typical time to ship (handling days).

Once decided, also add `returnPolicyCategory` and the return window to the return policy in `lib/structuredData.ts`; Google's merchant listings expect them.

- **Contact email mismatch:** the footer and the new page use info@studio9inc.com, but the order thank-you message on the home page says studio9inc@mac.com. Which should customers use?
- **Reviews:** the structured data has no ratings or reviews, because the existing reviews are press quotes without ratings. If real customer ratings are collected later, they can be added.
- **Manual check:** paste a few product URLs into Google's Rich Results Test (https://search.google.com/test/rich-results) after deploying. Amazon-only books and PDF-only modules have no price of ours, so they will not get price snippets; that is expected.

## Observations

- The cart page never shows the shipping charge; shoppers only see it in the PayPal window. The tests read shipping from the cart's React state. Consider showing it on the cart page (a visible change, so not in this work without approval).
- Removed in Phase 1 as unused: `swell-js`, `axios`, `theme-change` (no theme switcher exists; the theme is fixed with `data-theme`), and `types.ts` (old Snipcart type declarations).
- `non_cart_book_details.json`, `non_cart_game_details.json` and `non_cart_module_details.json` are not referenced anywhere in the code. Left in place.

## Tests and CI

- Visual baselines (`e2e/visual.spec.ts-snapshots/`) are local only and gitignored, because screenshots differ between machines. `visual.spec.ts` is skipped in CI and on any checkout without baselines; create them with `npm run test:e2e:update -- e2e/visual.spec.ts` on a known-good build (e.g. `main`) before changing UI code. The Golden Era page screenshot loads 15 large Cloudinary images and can fail on a very slow network; rerun it before treating a diff as real.
- CI (`.github/workflows/e2e.yml`) reads an optional repository secret `PAYPAL_CLIENT`; without it the PayPal button test is skipped. Use a sandbox client id there. The Cloudinary cloud name is public and set in the workflow.
- `npm run lint` runs ESLint directly (flat config in `eslint.config.mjs`). It passes with 6 warnings left in code not touched by this work (unused alternate banner components in `components/mutliBanner.tsx`, effect dependencies in `pages/cart.js`, which Phase 5 rewrites).
