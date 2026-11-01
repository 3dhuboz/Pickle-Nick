# Product media and continuous hero playback

Steve approved fixing the diagnosed hero and adding the supplied images as replacements for corresponding current product imagery on 1 November 2026.

## Verified target

- Live site: https://picklenick.au; Cloudflare Pages project `pickle-nick`.
- Storefront routing uses HashRouter: navigate through links or use `/#/shop` and `/#/product/<id>`; a bare `/shop` still renders Home. Browser checks must assert the page/product count before evaluating image replacements.
- Production release `8fb171e4-fb5e-470e-a389-60ee751dc02a`, source `499d197`, matches the starting Git HEAD.
- Real `/api/products` returns nine Product records with `id`, `name`, `image`, `category`, `price`, `stock`, `featured`, `weight`, `description`, `updatedAt`. Public snapshot is preserved in the recovery cache as `live-catalogue-before.json`.
- Four sauces have supplied individual photos and updated artwork. Carrots, cauliflower, cucumbers and onions have updated artwork. No replacement for Cowboy Candy was supplied; retain its own current image rather than assign a different product's label.
- Five supplied group photos and two ingredient photos supplement those product views. Eight original email attachments and eleven product/ingredient photos have been inspected. The twelfth clipboard image is conversation context, not website media.
- The current hero MP4 is 4.041667 seconds. Five live samples over twelve seconds remained ended/paused at normal speed, with loop false and no media error.
- Starting SHA-256: `pages/Home.tsx` = `1BE8F88A6A36A9C16D1E4CEC63986C9DAAEB0F299959A5BAD91FB786A7C17D9D`; `components/brand/BrandedProductImage.tsx` = `C834063215FB5856954242F1EEE0B5A80F6D0DD1DA08444FF8D02DF61935FA43`; `styles.css` = `E84CD8B8EE3CA2A8EA7F43C852621D9B1F7DB125C771B0F8AB616095EF8A7659`.

## Implementation boundaries

Use a typed media manifest keyed by the real product IDs. Override only the exact old image URLs recorded from production, or absent images; respect later administrator uploads. Use full-bottle photos on sauce cards, full artwork on pickle cards, and accessible photo/artwork/ingredient thumbnails on details. Keep prices, stock, IDs, descriptions and the database unchanged.

Use all eleven supplied photographs: four product cards, two detail ingredient images (one also in the homepage ingredient story), two group-photo replacements in existing homepage sections, and three group images in a compact homepage gallery. Serve optimized WebP derivatives with a source SHA manifest and descriptive alt text. Keep the original label PNGs as immutable source assets.

Repeat the existing hero video at 1.35x forward speed. On ending, fade to its matching poster for 450 ms, reset under the poster, then fade into forward playback. Pause while hidden, restart/resume when visible, and show the static poster for reduced motion. Clear timers/listeners and pause the video on route cleanup. No new generated media.

## Executable acceptance

1. Capture the nine real catalogue records. Resolver regression tests must replace the eight exact old URLs, retain Cowboy Candy, and respect a later custom upload. Tests must fail on the old resolver before the replacement is implemented.
2. Browser acceptance samples the real hero for at least three forward wraps, with positive playback rate and no video error. The old production behavior must fail this check.
3. Preview deployment uses the real public catalogue; verify all nine shop images load, detail thumbnail selection changes the main image, supplied artwork fits without cropping, and the home gallery loads.
4. Browser reduced-motion emulation leaves the video paused and poster visible. Returning from hidden state resumes animation; route changes clean up playback.
5. Check desktop and 390 px viewport for horizontal overflow, usable gallery controls, product links, stock-disabled controls, and adding/removing a sauce in the basket without placing an order.
6. TypeScript check and production build pass through the machine-wide runner. Deploy this exact built output to a Pages preview, verify it, then publish the same output to production and repeat focused live acceptance.

## Enforced process corrections

The stopped-video bug gets a browser regression check that requires actual wraps, not merely `playing=true`. The stale-image priority bug gets tests using recorded production URLs, plus an explicit check that future admin image changes are respected.

The remote scout returned no execution receipt (protected hold); no further offload is attempted. Continue with bounded known-path checks. Local heavy commands remain queued behind RAM/CPU checks.
