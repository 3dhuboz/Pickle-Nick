# Product-photo upload implementation plan

**Goal:** Publish four consistent studio bottle photographs and assign the eight supplied product identities to the matching stored image fields.

**Architecture:** Preserve the live catalogue and existing UI. Use versioned static images, the ID-specific media resolver and one guarded image-only D1 statement. The accepted original artwork remains available in each matching detail gallery.

- [x] Survey the exact production release, nine product rows and real SQL table definition. Preserve all source inputs and record the acceptance failure on the old live photos.
- [x] Complete and inspect four built-in image edits; encode WebP derivatives, preserve edited PNGs and replace the kitchen lineup with the supplied higher-quality source.
- [x] Prepare the new approved relative/absolute URL mapping, real-data SQL tests, eight-row precondition and guarded inverse SQL. Confirm production precondition is eight with zero writes.
- [ ] Run all eighteen tests, TypeScript and the production build through the existing shared-runner queue. Deploy the built output to a task-branch preview and check the actual catalogue, gallery controls and mobile layout.
- [ ] Publish exactly the checked build. Verify asset URLs, capture a fresh catalogue snapshot, submit the guarded image-only statement once and prove eight changed images with every other field preserved.
- [ ] Repeat focused live checks, save the measured receipt, push and finish the standard cold backup to the approved container.
