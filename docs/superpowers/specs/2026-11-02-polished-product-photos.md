# Polished product photographs and stored image assignments

Steve supplied eighteen files and requested improved product pictures uploaded to the corresponding products on 2 November 2026.

## Real target and approved scope

- Live release: `0be1e65`, deployment `e9bcb26a.pickle-nick.pages.dev`; source branch starts at `76fde16` (later commits contain only backup routing/docs).
- D1 `pickle-nick-db` contains nine products. The read-only live snapshot is saved in the recovery cache as `product-photo-live-before-20261102.json`.
- Four sauce IDs: `prod_roast_habanero`, `prod_roast_jalapeno`, `prod_bourbon_glaze`, `prod_sweet_smokey`. Four matching pickle label IDs: `prod_carrot`, `prod_cauliflower`, `prod_cucumbers`, `prod_burger_onions`. Cowboy Candy has no supplied replacement.
- Eight PNGs exactly match the tracked original labels. Nine supplied photos match prior source hashes; the kitchen lineup `05976f0e-bc50-48a8-a85f-ccab5ef4b55f.jpg` is a higher quality new source. Ten JPEG originals are preserved with SHA-256 values under `assets/product-photo-inputs-20261102`.
- The existing product PUT handler uses INSERT OR REPLACE for all product fields. Do not use it for these image assignments. Use the official D1 CLI for an atomic, guarded UPDATE of image fields only, after the files are deployed and verified reachable.
- Lumina was checked first but is signed out, with no visible funded entitlement. No generation was submitted there. Use the built-in image editor for four requested photo edits; no ModelArk API use.

## Visible result

Four matching studio product photographs: one complete real bottle per frame, consistent 4:5 composition, warm neutral background and soft contact shadow. Keep each flavour's true liquid colour, bottle/cap shape, Pickle Nick branding, label artwork and wording. Use the full lineup and original close-up as complementary references so the cropped necks are not guessed. Updated pickle artwork remains intact and legible.

The main stored `products.image` field must point at the corresponding approved uploaded image, so Inventory and the storefront agree. Retain detail artwork and ingredient views without duplicate primary images. Preserve all non-image catalogue values, including stock, prices, descriptions and product IDs. Keep the existing hero behavior.

## Acceptance before publication

1. Inspect each edited image beside its actual source; check flavour, complete cap/base, true sauce colour, legible unchanged product name, and unchanged skull/flame/ingredient artwork. Reject a mismatched or corrupted label.
2. Test mapping of both relative and absolute approved image URLs; preserve art rendering and gallery de-duplication, and retain future admin-upload priority.
3. Verify on a Pages preview using the real catalogue: nine cards load, eight expected replacements are correct, four sauce galleries work, and mobile layout has no overflow. Run existing regression tests, TypeScript and build through the shared runner.
4. Publish exactly the preview-verified output. Check public asset URLs before changing the database.
5. Apply a single guarded image-only UPDATE based on the recorded current image URLs. Require eight changed rows, then re-read all nine complete product records and assert every other field is unchanged. Preserve an inverse image-only SQL file before writing.
6. Confirm live API image fields and storefront images match. Re-check the existing hero, record measured results, then commit/push and complete the standard cold save.

## Enforced pre-check lessons

D1 rejects `sqlite_version()` with error 7500; use the real `sqlite_master` table definition for the staging copy instead. A failed read caused the local Wrangler process to terminate with a native libuv error. Use the documented D1 HTTP query endpoint for the remaining bounded survey and guarded image-only statement; do not repeat a failed mutation. The helper records a write fingerprint before submission and refuses a second submission under the same receipt.

The temporary helper must resolve the same active credential location as the installed Wrangler: an existing user `.wrangler` directory takes priority over the older XDG configuration. Never print credentials or copy them into the project. API reference: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/.

Catalogue screenshot checks must wait until each card finishes its reveal animation (computed opacity at least 0.99). Image decoding alone does not prove that the card is visibly ready; `tests/catalogue-browser-check.js` now enforces both conditions.
