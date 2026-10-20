# Website analytics and search indexing

The owner requested private traffic, page, tool-use and engagement-time reporting on 20 October 2026. The reports live in the owner's Google Analytics account. The public site contains a measurement ID, which is a public tag identifier rather than an access credential. No public reporting dashboard is provided.

`content/analytics.json` owns the measurement ID. `scripts/render-profile.mjs` adds one configuration and consent-aware module to each rendered HTML page. The list of public routes and the tool registry are generated from existing content. Verification documents are copied unchanged by the normal build.

The implementation uses basic consent mode. The Google tag is loaded only after analytics is accepted, only on recognised public paths and only on the two production hostnames. Local previews never send measurements. Advertising storage, advertising user data, advertising personalisation and Google signals stay disabled. Browser Global Privacy Control and Do Not Track signals prevent collection. The privacy page provides a persistent way to change consent; withdrawal disables collection, clears first-party analytics cookies and reloads to remove the loaded tag. Consent expires after 180 days; analytics cookies are configured for 90 days without renewal.

The web stream has automatic enhanced measurement disabled. Page views and standard foreground engagement use GA4's normal measurement. URL queries and fragments are stripped, and referrers are reduced to their origin or a recognised internal path. Contact-form contents, calculator values and order references are excluded. The private downloads route is outside the allowed measurement paths.

Custom events:

| Event | Meaning | Fixed parameters |
| --- | --- | --- |
| `tool_open` | A recognised tool page was opened with analytics accepted | `tool_id`, `tool_name` |
| `tool_interaction` | A tool control changed, a tool button was clicked, or the map was used | `tool_id`, `tool_name`, `interaction_type` |
| `book_checkout_click` | A recognised digital, paperback or Amazon checkout link was clicked | `book_format`, `checkout_channel` |

Checkout clicks measure interest, not confirmed sales. There is no new payment integration. Inputs, payment processing, fulfilment, scientific equations and datasets are retained.

Tests in `tests/analytics.test.mjs` cover refusal, explicit acceptance, withdrawal, storage expiry, hostname/path restrictions, sensitive URL removal and exclusion of input values. These tests do not contact Google.

Search Console uses an HTML verification document at the site root. Keep existing verification files. The sitemap is generated from the public routes and referenced in `robots.txt`; private downloads are excluded. Google accepted the sitemap on 20 October 2026. Index inclusion and timing remain Google's decision.

Documentation: [basic consent mode](https://developers.google.com/tag-platform/security/guides/consent), [engagement time](https://support.google.com/analytics/answer/11109416), [enhanced measurement](https://support.google.com/analytics/answer/9216061), [sitemap submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
