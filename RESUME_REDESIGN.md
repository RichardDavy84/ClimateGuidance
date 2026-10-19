# Launch continuation, 19 October 2026

The owner approved publication. The consulting acquisition/processing wording and mobile checks are complete. Direct paperback activation was subsequently approved. Its live checkout, included PDF + EPUB delivery, import-charge disclosure and manual postage workflow are recorded in docs/redesign/paperback-live.md. Existing digital and Amazon purchases remain available. Use `docs/redesign/rollback.md` for the archived previous production version. The GitHub publication PR and Pages workflow provide the authoritative deployment record.

## Earlier review notes

# Review-ready: personal-profile redesign

User resumed the paused task on 19 October 2026. The review iteration is complete. Do not push, merge or deploy without a later explicit instruction. Start with REDESIGN_REVIEW.md for the delivery index.

## Non-negotiable scope

- Development branch: `personal-profile-redesign`.
- Isolated checkout: `/Users/ricavy/.codex/.chatgpt-projects/g-p-68d237e2a8748191aca151b90d9c4e7b/personal-profile-redesign`.
- Production branch is `main`, last verified remotely at `68c6fdfdc012c6e53961ca6dfc9031f0c43b115b`.
- Nothing from this redesign has been pushed, merged or deployed. Do not change DNS, production workflow/settings, secrets or payment infrastructure.
- Richard's latest content decision: retain the broader Urban Climate theme, but **defer Bergen-specific project material**. It is excluded from visible pages.
- Full user brief remains in `/Users/ricavy/.codex/attachments/4087ddec-80fe-4b98-98ed-af1a60b14e9a/Pasted text.txt`.
- Files under the parent project's `sources/` remain read-only.

## Saved draft

The new static editorial design makes Richard the primary identity, with Climate Guidance as the site name. Homepage, four research themes, tools gallery, Counting Carbon, publications, media/teaching, About, Services and Contact are generated from `content/*.json` by `scripts/render-profile.mjs`.

Existing nine tools, calculation/data modules, current €9.99 book configuration, checkout/delivery code, Formspree endpoint and production workflow are retained. Shared personal-profile navigation is applied to the tool pages. No checkout purchase or contact-form submission was made during testing.

Research provenance: `content/sources.md` and `content/source-records.json`.
Content gaps: `MISSING_CONTENT.md`.
Route map: `docs/redesign/site-map.md`.
Legacy route audit: `docs/redesign/legacy-audit.md`.
Design and four-visitor review: `docs/redesign/design-and-review.md`.
Protected baseline hashes: `docs/redesign/protected-baseline.json`.

## Verification completed

- All **32 automated tests passed**, including the existing local HTTP payment test (required loopback permission).
- Final syntax/JSON/local-link check passed across 4,976 files.
- Final static build completed successfully in ignored `dist/`.
- Protected-file hash checks pass: production workflow, commerce configuration and original calculation/data files unchanged.
- All nine tools loaded locally; Claim Checker 1,000 annualised trees returned 8 tCO2/yr; publication filter returned two Urban Climate papers; book preview dialog and €9.99 format cards worked.
- Desktop, 390px phone and 768px tablet checked. Keyboard mobile menu opens with Enter and closes with Escape. No horizontal overflow found in the reviewed pages. No missing alt attributes on the five principal review pages.
- No Lighthouse score was claimed. DOM/layout/keyboard checks and functional tests are the available equivalent checks.

## Local screenshots

Ignored but saved at `redesign-review/screenshots/`:

- `home-desktop.png` and `home-desktop-full.png`
- `home-mobile.png` and `home-mobile-top.png`
- `arctic-theme.png`
- `counting-carbon.png`
- `publications.png`
- `media.png`
- `services.png`

Nine tool screenshots are source assets in `assets/tools/`.
Two publisher figures are CC BY 4.0 with adjacent credits and original colours: neXtSIM drift (Ólason et al., 2026, Fig. 9) and Apatity winter temperature (Varentsov et al., 2018, Fig. 6). Bergen is not depicted. The boundary-layer diagram is explicitly conceptual.

## Final review completed

- REDESIGN_REVIEW.md links all seven requested review views plus the tools gallery, route map, design/source notes, audit and content gaps.
- Arctic wording now identifies co-authorship of the neXtSIM v2 paper. Urban wording identifies Mikhail Varentsov as first author, without asserting unverified project leadership.
- Full book/publications/mobile screenshots and gallery thumbnails reviewed. All homepage/gallery images loaded; no phone overflow. Desktop and mobile homepage screenshots refreshed.
- Final redesign tests: 3/3 pass. Static build passes; syntax/JSON/local HTML links pass across 4,978 files. The earlier complete suite passed 32/32.
- Main palette contrast ratios measured against cream: ink 13.21:1, muted 5.66:1, accent 5.63:1 and link blue 6.69:1. No Lighthouse score claimed.
- Final read-only GitHub check confirms main still at 68c6fdfdc012c6e53961ca6dfc9031f0c43b115b. Nothing pushed, merged or deployed.
- Remaining content gaps are editorial/user confirmations, listed in MISSING_CONTENT.md; unsupported achievements are omitted.

## Safe resumption

The owned local preview on port 8766 has been stopped after final QA. Do not leave an old dead preview URL as a deliverable.

Node runtime used: `/Users/ricavy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.
From this checkout, start `node scripts/preview.mjs` to regenerate and serve the draft locally at `http://127.0.0.1:8766/`. Stop the owned preview server after QA.

Scientific data are ignored in `climate-tools/data/`; they were copied from the previously verified dataset. The pinned release and SHA remain in the unchanged production workflow. Do not commit the large derived data.

`node_modules/` is ignored and copied from the prior local checkout to run existing Stripe tests; no dependency version or production infrastructure was changed.

## Second review iteration, completed 19 October 2026

- Home, Climate Tools, Consulting and About now have explicit navigation links. Consulting has planning timescales, three application examples and seven FAQs.
- Positive editorial style and punctuation preferences are recorded in content/editorial-style.md. Research bodies omit consultancy distinctions.
- Full Good Summer Index wording is used in the explorer, chart, map legend and gallery. Original data route and numerical methods remain stable.
- Paperback request button is adjacent to Amazon. The direct paperback button opens a €19.99 Europe-postage Stripe test checkout in one click. An information page remains at /counting-carbon/paperback/.
- Browser login eventually completed. Sandbox product, price and Payment Link were created in acct_1UOPUxBbpvbDaZbY. IDs, precise destination list and verification are in docs/redesign/paperback-checkout.md and paperback-test-verification.json.
- The checkout total was verified as 1999 EUR minor units with livemode false. No payment submitted. Live account configuration, digital product and delivery automation unchanged.
- Full suite 35/35 passes. Final build/link check result is in REDESIGN_REVIEW.md.
- Before a later live activation: postal terms/country list, VAT handling, owner payment notifications and paid/failure/async lifecycle tests.
- Nothing pushed, merged or deployed.
