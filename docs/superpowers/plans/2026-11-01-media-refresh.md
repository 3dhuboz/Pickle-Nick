# Product media and hero playback implementation plan

**Goal:** Show Nick's supplied product photography and updated labels, and keep the approved hero pouring forward.

**Architecture:** A typed media resolver shared by the existing product-image component, plus a small media lifecycle controller used by Home. Keep the live API and commerce data intact. Execute inline in the existing isolated task branch.

**Tech stack:** React 19, TypeScript 5.8, Vite 6, GSAP 3, Cloudflare Pages; Node's built-in test runner and browser checks via Kimi WebBridge.

- [ ] Record real-target acceptance failure for hero wraps; add resolver tests against the recorded product IDs/URLs and run them red.
- [ ] Add provenance-tracked source labels and optimized image derivatives; implement the ID-specific resolver and detail gallery; update existing Home imagery and add the three-image gallery.
- [ ] Implement bounded forward replay, visibility/reduced-motion behavior and cleanup; preserve the poster and existing video.
- [ ] Run resolver checks, TypeScript and production build through the shared runner; deploy the built output to the task-branch preview.
- [ ] Verify three video cycles, nine products, detail thumbnails, mobile/reduced-motion behavior and basket operations against the real API on preview. Review the diff and repeat the acceptance before publishing.
- [ ] Commit, publish the verified output to production, repeat focused live checks, push the task branch and run the global save script. Report measured outcomes and any cold-publication delay.
