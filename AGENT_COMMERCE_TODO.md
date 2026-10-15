# Agent commerce TODO

Open items for the owners (Aaron/Lisa) and for later phases. Each phase adds to this file.

## Known bugs found by the Phase 0 tests

These are marked `test.fixme` and are not fixed yet.

- **Dottie and Me Activity Book video.** `videoLink` in `book_details.json` holds placeholder text ("Testimonial ipsum dolor sit amet…") instead of a YouTube video id, so the page throws "Invalid video id" in the browser. Owners: supply the real video id, or remove the field. Test: `e2e/smoke.spec.ts`.
- **Out of Stock button is not really disabled.** On Global Crisis it is only styled as disabled (daisyUI `btn-disabled`) and has no `disabled` attribute, so screen readers and shopping agents see an enabled button. To be fixed in Phase 1 or 7. Test: `e2e/product.spec.ts`.
- **Golden Era variant cart ids contain a space** (e.g. `riders-on-the-midnight-storm-signed hardcover`). Fixed in Phase 2. Test: `e2e/golden-era.spec.ts`.

## Observations

- The cart page never shows the shipping charge; shoppers only see it in the PayPal window. The tests read shipping from the cart's React state. Consider showing it on the cart page (a visible change, so not in this work without approval).
- `non_cart_book_details.json`, `non_cart_game_details.json` and `non_cart_module_details.json` are not referenced anywhere in the code. Left in place.

## Tests and CI

- Visual snapshots (`e2e/visual.spec.ts-snapshots/`) are macOS baselines. `visual.spec.ts` is skipped in CI; generate Linux baselines (e.g. in the Playwright Docker image) to run it there.
- CI (`.github/workflows/e2e.yml`) reads optional repository secrets `PAYPAL_CLIENT` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. Without `PAYPAL_CLIENT` the PayPal button test is skipped. Use a sandbox client id there.
- `npm run lint` is not set up yet (`next lint` asks interactive setup questions on Next 13). Set up in Phase 1.
