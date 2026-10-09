# Carbon Time Machine data and interpretation

The implemented page keeps an atmospheric-stock comparison separate from an annual emissions-rate comparison. It uses locally versioned public datasets; it does not fetch changing scientific data in a user's browser.

NOAA's Mauna Loa annual series runs from **1959 to 2025** in this snapshot. Measurements started in 1958, but the first full annual mean is 1959. Baseline: 2025, 427.35 ppm. For an amount in tonnes CO₂, divide by 1e9 and by 7.788 GtCO₂/ppm, then subtract from the baseline concentration. Find the corresponding date by linear interpolation between annual means, displaying an approximate year. Inputs below the oldest observation show the boundary rather than an extrapolated date. Amounts above the full atmospheric stock are explicitly identified. Tiny amounts stay within the latest annual average rather than displaying spurious day-level historical precision.

The physical conversion is **2.124 GtC/ppm × 44/12 = 7.788 GtCO₂/ppm**, rounding to the book's 7.8. The concentration-to-carbon factor follows [Global Carbon Budget 2025](https://essd.copernicus.org/articles/18/3211/2026/). The 44/12 convention follows the book; GCB uses a slightly different molecular-weight ratio in its own published mass conversions, so the imported emissions data are not re-converted. Mauna Loa is used as a concentration proxy rather than described as the global mean. No carbon-cycle rebound or climate response is modelled.

The emissions snapshot is **Global Carbon Budget 2025 via OWID, reference year 2024**, column `co2`, in million tonnes. It covers fossil fuel and industrial CO₂ and excludes land-use change. There are 219 country/territory entries, including missing/zero records, which do not get fabricated durations. Continents are sums of available country records. The global figure is their sum plus international aviation and shipping, which are deliberately not allocated to countries. This produces 38,598.580 MtCO₂/yr versus the published global 38,598.578; the 0.002 Mt difference is input rounding. A selected quantity divided by the annual rate gives a duration, not an atmospheric concentration change. This differs from the book's rounded 40 Gt total including land-use change and does not change the Management tool's 19 Gt benchmark.

Country geometry and geographic continent membership come from Natural Earth 1:50m, simplified with a 0.08° tolerance. Small-territory overrides and Kosovo's application code XKX are listed in the manifest. Countries split between continents use Natural Earth's assignment; the map is geographic context, not an alternative emissions dataset. Some tiny countries are easier to select in the keyboard-accessible menu. Countries without matching emissions are visibly unavailable. Global reset does not alter the CO₂ input.

## Rebuilding the snapshot

Download the four URLs in `counting-carbon/data/time-data-manifest.json` to a local directory, using the filenames recorded there. Then run:

```sh
python3 scripts/build-time-data.py /path/to/downloads
node --test tests/time-machine.test.mjs
```

Before refreshing, update the retrieval date in the script, check the latest common emissions year, review mapping exceptions and inspect the generated dataset diff. The script asserts chronological and concentration ordering, requires continent mappings, checks global reconciliation, and preserves SHA-256 hashes of source bytes. `codebook.csv` documents `co2` as MtCO₂; verify this meaning if the upstream schema changes. Do not publish raw downloaded workbooks or paid book files as site assets.

Browser checks cover countries, continent selection, reset, small quantities, and responsive display. Automated tests cover unit conversions, interpolation, out-of-range amounts, zero/missing data, regional durations, continent aggregation and map coordinates.
