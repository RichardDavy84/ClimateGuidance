# Browser-based climate tools

The five applications under `/climate-tools/` run entirely as static HTML, CSS and JavaScript. Their climate data are bundled in the `Shiny` GitHub release asset `climate-tools-data-2026-10-19.zip`. The Pages workflow downloads that asset, checks its SHA-256, extracts only the `climate-tools/data/` subtree, runs validation and publishes the public static build. Visitors fetch data from the website's own domain, not from GitHub Releases or Shiny.

The release keeps about 390 MB of preprocessed climate data out of Git history. The website is still a static GitHub Pages site. No R service, Shiny process, paid hosting service or new application server is required. OpenStreetMap supplies the attributed basemap tiles. Leaflet 1.9.4 is vendored locally with its licence.

## Layouts and calculations

- Reisa and Pasvik: period and model controls, priority and metric selectors, traffic-light boxes, map, three-model series and adaptive definitions. Reisa retains its main-trail mode.
- Snow: left control sidebar; map and five-percentile plot on the right; eight resorts and thirty cities retained. Map layers use the original factor-four aggregation; point queries retain native resolution and bilinear interpolation.
- Marine: map, month slider, production zone, ensemble plot, monthly category probabilities and over-20°C count, in the original order. The 2025 archive's original five-consecutive-six-hourly-sample rule is made explicit; it is not silently relabelled as a five-day test.
- GSI: full-map layout with a history/trend/correlation popup; factor-two display aggregation and full-resolution histories.

The website's `/climate-tools/migration-notes.html` records approved bug fixes and remaining scientific scope caveats. R source archives were not modified. Data export and independent R reference scripts are retained in the project workspace at `work_shiny_migration/` alongside the extracted user-supplied archives.

## Validation

`node scripts/check.mjs` validates JavaScript syntax, JSON and local HTML links. After extracting the data archive, `node --test tests/climate-tools.test.mjs` checks forty park metric packs against R reference values; classification boundary cases; snow interpolation; all 45 GSI years, trend p-values and correlations; and probabilities for all thirteen marine production zones. `node --test tests/*.test.mjs` also runs the existing website and payment tests.

`node scripts/preview.mjs` serves the tools locally at `http://127.0.0.1:8766/climate-tools/`. `node scripts/build.mjs` creates the allowlisted public files in `dist/`, including CNAME, without including backend files, paid books, private data or tests.

When replacing a climate snapshot, regenerate data and R reference fixtures, re-run the checks, upload a new versioned release asset, and update the pinned URL and checksum in the Pages workflow. Never relabel archived forecasts as live forecasts without verified issue dates and an actual refresh process.

## Shared website branding

The catalog, its legacy Data Viz alias, all tool pages and migration notes include the same masthead/navigation and Banner.png hero as the main website. Their styles are scoped in `climate-tools/shared/site-chrome.css` so they do not reset scientific controls or chart layouts. Mobile navigation reuses `counting-carbon/navigation.js`.

Public root asset extensions are matched without case sensitivity during the build; this retains original case-sensitive URLs such as `RichardDavy-portrait.JPG` on the About page.
