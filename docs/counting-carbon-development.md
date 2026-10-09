# Counting Carbon development preview

Public release prepared on `feature/counting-carbon`, based on main `5b3b0a5`. The owner authorised publishing the book page and companion tools on 9 October 2026. The existing domain and GitHub Pages hosting are retained. Purchases remain disabled while Stripe delivery is connected.

## Run and verify

Node 22+; the static site and test-only API require no npm package installation.

```sh
npm run preview  # http://127.0.0.1:8766/counting-carbon/
npm run check
npm test
npm run build   # static preview artifact only, no deployment
```

The preview server listens only on loopback and serves the public root assets, `counting-carbon/` and `warm-nights/`. It does not serve `.env`, server code, tests, private product directories or payment records. Leave the preview terminal running. The production website is still the original static site; its hosting has no configured branch-preview service in the repository. `dist/` contains only the static artifact, not the payment service. Do not point a general-purpose public file server at the repository root.

## Pages

- `/counting-carbon/`: new v14 cover, three limited v14 page previews, format configuration and companion tools. Source files stay outside the site. The digital edition is €20 for PDF + EPUB together; the printed edition is Coming soon with no price or checkout. The v14 PDF and EPUB are finished and remain outside the public repository. Stripe checkout and private download delivery remain pending.
- `/counting-carbon/carbon-management/`: existing diagram, presets, linked bars, thirteen method equations, direct-value control and assumption controls preserved. Small screens use readable HTML controls connected to the same state; the three primary input nodes move between layouts rather than calculating a second model.
- `/counting-carbon/claim-checker/`: 61 searchable comparisons, the original Habit 1 cartoon, boxed result, short linked source explanations, optional 30-year tree growth view, geography for per-person comparisons and a named custom factor with kg/tonne units.
- `/counting-carbon/carbon-time-machine/`: original illustration, NOAA stock comparison with observed history plot, country/continent map and separate emissions-duration comparison. Numeric inputs, zero, record boundaries and missing data have explicit behaviour.

Navigation is added across the existing root pages. No tool data load on unrelated pages. The four new pages have canonical URLs and sitemap entries; the preview-only noindex directives have been removed. Analytics is null; no tracker or customer-data collection was added.

## Configuration and data

`counting-carbon/config.json` owns book/product configuration. The selected provider is now Stripe Managed Payments. `salesStatus` and digital product availability are `coming_soon`, and there is no configured checkout URL or API. The earlier Lemon Squeezy test adapter is retained only as legacy code, excluded from the published Pages site. It is not a Stripe integration. See [Stripe release setup](stripe-managed-payments.md).

Claim factors and sources are in `counting-carbon/data/equivalences.json`; parameters remain separate from presentation. Time Machine source snapshots, constants and hashes are in the same directory; see [dataset refresh instructions](time-machine-data.md). Source workbooks are not bundled into the site.

## Scientific qualifications kept visible

The Management default sums standalone Practical Scenario values: about 8.00 GtCO₂e/yr. The book's coordinated value is about 7.18. No shared-resource reconciliation was invented. Its 19 GtCO₂/yr red reference is atmospheric increase (40 emissions minus 21 uptake), while method benefits use the book's CO₂e convention. Avoided natural releases are not added as extra removal in this existing tool.

The IPCC preset is a mixed comparator: nine mapped ranges, four clearly labelled book fallbacks, two midpoints constrained by book ceilings. Arithmetic midpoints are not assessed means, and the total is not an IPCC-assessed portfolio. Physical Limit is the book's permissive resource scenario, not a universal hard limit.

Tree values and survival remain explicit editable illustrations, averaged over 30 years, not universal measured capture per tree. The EPA 10-year-seedling comparison was not added because the reference page's heading and factor description have inconsistent time wording; the tool does not silently reinterpret it. Full household footprints require a supplied factor. Country per-person comparisons use 2023, the most recent common year with consumption data in the snapshot; Time Machine uses 2024 emissions. Source years and boundaries are visible.

Atmospheric lookup uses 2025 Mauna Loa annual mean as its baseline, not a current daily global reading; it stops before the 1959 annual record. The regional comparison excludes land-use change, with international transport added only at global level. Neither calculation models rebound or temperature.

## Validation and limits

Automated tests cover the original 13 equations/presets, independent changes and resets, bounds, direct mode, unit and custom-factor arithmetic, annualised tree trajectories, historical interpolation, regional aggregation, data boundaries, and sandbox payment authentication/validation. Static checks cover JS syntax, JSON and local HTML references. Browser checks exercise the updated Claim Checker and map, country/continent/reset behaviour, custom factors, invalid inputs, small amounts, 375/805px layouts, and mobile-to-desktop Management state continuity.

Stripe sandbox payment, Managed Payments tax presentation, verified fulfilment and both buyer downloads still need end-to-end testing. The site can be public while the digital product remains Coming soon. No complete paid manuscript, credentials or customer records are in the site or static build.

Commercial setup: [owner guide](payments-and-print-setup.md) and [print/shipping comparison](print-on-demand-research.md).
