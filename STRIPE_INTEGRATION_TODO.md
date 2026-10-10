# Counting Carbon — Stripe setup

This is the single source of truth for checkout setup. The website sells **one €19.99 digital bundle containing both PDF and EPUB**. The printed edition remains **Coming soon**.

The code is implemented and tested locally. **Purchases are still disabled on the public site.** A production payment server, its credentials, webhook endpoint and private book files must be connected before enabling sales. GitHub Pages hosts the public website; it cannot run the Node payment API.

## Account and product already set up

The owner confirmed the **Climate Guidance** live account, `acct_1UOPUpBTUOb6lCsc`. Its live catalogue was empty. The following live product and price were created without taking a payment:

- Product: `prod_VPkbhHjiRsA4u0` — Counting Carbon — PDF + EPUB.
- Price: `price_1UOv6ABTUOb6lCscNicCpqFp` — **1999 euro cents**, one-time, tax-inclusive.
- Lookup key: `counting_carbon_digital_eur_1999`.
- Tax code: `txcd_10302000` — downloaded digital books with permanent rights.
- [Open the product](https://dashboard.stripe.com/acct_1UOPUpBTUOb6lCsc/products/prod_VPkbhHjiRsA4u0).

A separate **test/sandbox** copy of the product and price is required for test payments. Never use the live Price ID with test credentials.

## Values to replace

Files with deployment values: [.env.example](.env.example), [server/payments.mjs](server/payments.mjs), [counting-carbon/config.json](counting-carbon/config.json).

| Field | Current value | What to set |
|---|---|---|
| `mode` | `payment` | Already correct for the one-time bundle; no subscription. |
| `STRIPE_DIGITAL_PRICE_ID` → `line_items[0].price` | `price_...` | Test Price ID in a sandbox; the live ID above only for live deployment. Quantity is fixed at one. |
| `STRIPE_SUCCESS_URL` → `success_url` | `http://127.0.0.1:8766/success?session_id={CHECKOUT_SESSION_ID}` | For local tests: `http://127.0.0.1:8766/counting-carbon/downloads/?session_id={CHECKOUT_SESSION_ID}`. Live: `https://www.climateguidance.com/counting-carbon/downloads/?session_id={CHECKOUT_SESSION_ID}`. Keep the template exactly. |
| `STRIPE_CANCEL_URL` → `cancel_url` | `http://127.0.0.1:8766` | Local or live `/counting-carbon/#products` URL. |
| `SITE_ORIGIN` | `http://127.0.0.1:8766` | `https://www.climateguidance.com` in production. Must match checkout return URLs and browser Origin. |
| `STRIPE_SECRET_KEY` | Empty | Server-only restricted key with Checkout Sessions write/read, Prices read, PaymentIntents/Charges read and any permissions Stripe identifies during testing. Use a host secret store; never commit it or paste it into chat. |
| `STRIPE_WEBHOOK_SECRET` | Empty | Signing secret for this environment’s `/api/webhooks/stripe` endpoint. |
| `BOOK_PDF_PATH`, `BOOK_EPUB_PATH` | Empty | Absolute paths to the approved paid files on the payment server. Outside the public website, or in excluded `private-products/`. Both are required before checkout opens. |
| `PAYMENT_LEDGER_DIR` | `.payment-data` | A private, persistent directory with backups. This implementation is for one Node service with durable disk, not ephemeral/serverless instances. |
| `HOST`, `PORT` | `127.0.0.1`, `8787` | Bind as required by the chosen HTTPS reverse proxy/Node host. |
| `PAYMENT_MODE` | `test` | Keep test for testing; explicitly change to live with matching live key, price and webhook secret. |
| `checkoutApi` | Empty | HTTPS base URL of the deployed payment API, without a trailing slash. Local test example: `http://127.0.0.1:8787`. |
| `paymentMode` | `test` | Must match server mode. |
| `salesStatus`, digital `availability` | `coming_soon` | Change both to `available` only after the complete checkout/download test succeeds. Hardcopy stays `coming_soon`. |

The server retains the Checkout Studio sample return-path defaults and price placeholder until these environment values are supplied. No publishable key or Stripe.js is needed for this hosted redirect flow.

## Configured parameters

Scenario B applied: there was no Stripe Checkout call. The existing Node HTTP endpoint, origin checks, environment loading and private audit pattern were reused. The former Lemon Squeezy adapter was replaced.

[server/payments.mjs](server/payments.mjs) contains:

| Parameter | Value |
|---|---|
| `ui_mode` | `hosted_page` (Stripe Node SDK 22.6.0, pinned in package.json and pnpm-lock.yaml) |
| `mode` | `payment` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `managed_payments.enabled` | `true` |
| `automatic_tax` | **Omitted with the owner’s explicit approval.** Stripe documents this parameter as unsupported with Managed Payments, which controls tax itself. |
| `allow_promotion_codes` | `false` |
| `submit_type` | `auto` |
| `integration_identifier` | `hosted_web_0001` |
| `origin_context` | `web` |
| `payment_method_collection` | Omitted because this is a one-time payment, as required by the brief. |

No API version override and no payment-method allowlist are added. Managed Payments selects available payment methods. Adaptive Pricing may offer local currency; the base EUR price remains €19.99 inclusive of tax. Verify the actual checkout presentation in supported buyer locations.

## Set up and test

1. Confirm **Managed Payments is activated** in the Climate Guidance Dashboard and this ebook tax category is eligible. Account activation and any agreement acceptance must be completed by the owner.
2. In a Stripe sandbox/test environment, create the equivalent one-time €19.99 **inclusive** Price. Install dependencies with Node 22+ and `pnpm install --frozen-lockfile` (or `npm install` if pnpm is unavailable).
3. Copy `.env.example` to untracked `.env`, fill the test values above, and start `npm run payments`. Use `npm run preview` for the static site. Set the local config’s API and availability values for testing; do not publish a localhost API URL.
4. Forward Stripe test webhooks to `http://127.0.0.1:8787/api/webhooks/stripe` using Stripe CLI, or register the HTTPS test endpoint. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`. Put that endpoint’s signing secret in the server environment. Restart the server after environment changes.
5. Complete hosted Checkout using Stripe test card **4242 4242 4242 4242**, a future expiry and any valid CVC. Test authentication with **4000 0025 0000 3155** and a decline with **4000 0000 0000 9995**. These are test cards only, never real payments.
6. Confirm both files download after the webhook arrives. Test cancellation, delayed confirmation, retrying the same event, invalid signatures, an unpaid session, a wrong product, a refunded/disputed payment, and direct guesses at private file paths. A missing webhook must not grant access.
7. Deploy the Node API on an HTTPS host with persistent private storage. Upload the approved PDF and EPUB there. The current edit deliverable is v16 DOCX; it is **not yet a new publication PDF/EPUB**. Do not silently sell an old version as v16.
8. Register the live webhook endpoint and configure the live price/key/secret. Set production return URLs. Put a reverse-proxy rate limit on checkout and download endpoints, including per-session download limits, and redact `session_id` query strings from access logs. Back up the private ledger.
9. Add the site’s purchase/download support and refund terms. Verify Stripe receipts and the buyer’s return link. The implemented access path is the checkout success page; automated delivery/recovery email is **not implemented**. Establish a working manual receipt-based support process or add a mail provider before launch, so buyers who close Checkout can recover their files.
10. Only then enable digital availability and live mode in the public config. Hardcopy remains Coming soon.

## How the integration works

The button calls `POST /api/checkout` with only `product: digital`. The server retrieves and validates the configured Price, checks that both private files exist, then creates a Managed Payments Checkout Session. The browser redirects to Stripe; no card details pass through this website.

Stripe sends a signed raw-body webhook. The server retrieves the current Session, verifies its mode, one-item bundle, quantity and paid status, and writes an idempotent private order record. Delayed payments do not receive files until payment succeeds. The record contains Stripe identifiers, not card details or customer email.

The return page calls `POST /api/downloads`. File requests also re-check the live payment state and the webhook-created record. Refunded or disputed payments cannot download, including after a replayed old event. The private `session_id` acts as the download reference; do not share it publicly. Files are streamed from private disk with `no-store` and attachment headers. No paid file is included in the static build.

## Changed/new files

- [server/payments.mjs](server/payments.mjs): Stripe Session creation, validation, webhook and private delivery logic.
- [server/index.mjs](server/index.mjs): existing HTTP server and new Stripe/download routes.
- [counting-carbon/book.js](counting-carbon/book.js), [checkout.js](counting-carbon/checkout.js), [config.json](counting-carbon/config.json): €19.99 bundle display and validated Stripe redirect.
- [counting-carbon/downloads/index.html](counting-carbon/downloads/index.html), [app.js](counting-carbon/downloads/app.js): payment confirmation and both download buttons.
- [tests/payments.test.mjs](tests/payments.test.mjs): signatures, unpaid/refunded access, product/price validation, idempotency, HTTP and private-file isolation.
- [tutorial.js](counting-carbon/tutorial.js), [tutorial.css](counting-carbon/tutorial.css): separate optional guidance for the three tools; these do not alter the scientific models.

## References

- [Managed Payments setup](https://docs.stripe.com/payments/managed-payments/set-up)
- [Managed Payments parameter restrictions](https://docs.stripe.com/payments/managed-payments/update-checkout)
- [Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Stripe testing](https://docs.stripe.com/testing)
- [API-key security](https://docs.stripe.com/keys-best-practices)
- [Stripe support](https://support.stripe.com)
- [Stripe MCP documentation](https://docs.stripe.com/mcp)
