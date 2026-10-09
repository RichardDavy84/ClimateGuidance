# Counting Carbon payments — development branch

> Superseded for the current launch: the owner selected Stripe Managed Payments on 9 October 2026. This document records the earlier Lemon Squeezy approach. Follow [Stripe setup](stripe-managed-payments.md) instead.

For the short account-owner walkthrough, see [digital-edition setup](payments-and-print-setup.md).

## Provider and responsibilities

Digital sales use **Lemon Squeezy as merchant of record**, following the request for automatic international VAT handling. It calculates, collects and remits applicable sales taxes/VAT for sales through its checkout. Business-income/payout accounting remains the seller's responsibility. Select the provider's appropriate **ebook tax category**; do not assume ordinary software tax treatment. Enable tax-inclusive pricing in the provider dashboard to match the advertised €20 price; this is a store-wide setting.

The **€20 EUR digital edition** uses one dedicated, single-payment test variant containing **both PDF and EPUB**. Attach both purchased files to that variant in Lemon Squeezy, not this public repository. The provider confirms payment on its servers and makes the purchased files available through its receipt/customer purchase flow. The application never sends paid-file URLs to an unauthenticated browser and does not implement a parallel download entitlement system. The webhook is an independently verified audit of orders/refunds, not a signal from the browser granting access. Do not override the provider's download receipt button with a public file URL.

The printed edition is deferred. Its card is always disabled and says Coming soon, with no price or print-provider connection. Lemon Squeezy is used only for the digital bundle.

## Hosted checkout: simplest connection for the static site

Create/publish the bundle in the provider's **test dashboard** and obtain its reusable **Share** link. Open it and confirm the test banner and €20 EUR bundle before configuring it. Then set the digital product's `purchaseUrl` to that URL and `checkoutMode` to `"test"` in `counting-carbon/config.json`; keep `paymentMode: "test"`. Leave `checkoutApi` empty for this route. No API credential or separate Node host is required. Both final files must be attached to the same provider product/variant.

`checkout.js` accepts only HTTPS Lemon Squeezy Share links for the digital test configuration. Customer-specific cart links and unrelated hosts are rejected. **The URL and the local checkoutMode label cannot prove the provider's mode**: dashboard and checkout verification are required before adding a real link. No link is configured at present. A hosted link takes precedence over `checkoutApi`; it does not create a local audit record unless the optional webhook service is separately configured.

The current backend's API is stricter about mode: it requests and verifies a test checkout in the provider response. Neither route puts paid-file URLs into the public page. The frontend price is a display value; the provider product's price and tax settings remain authoritative.

## Optional backend: implemented

- `POST /api/checkout`: accepts only `{"product":"digital"}` (PDF + EPUB together). Store/variant mapping is server-owned; caller-supplied price, variant, redirect or other fields are rejected. Provider prices are authoritative.
- Every checkout explicitly uses `test_mode:true`; live mode is refused. The returned checkout must also be a matching test checkout on the provider's HTTPS domain. Checkout links expire after 30 minutes.
- `POST /api/webhooks/lemonsqueezy`: verifies SHA-256 HMAC over untouched request bytes, then retrieves the current order from the provider API. Only the configured test store and variants are accepted. Handles `order_created` and `order_refunded`; duplicate records are harmless. Replayed events use current status, including refunds.
- Private immutable audit files contain order ID, product, status and provider timestamp, not customer details or download URLs. They require a persistent private disk; this is a single-instance sandbox service.
- Exact frontend-origin allowlist, limited request body size, provider timeout, checkout rate limit and generic upstream error messages. No API key in browser code. The API serves no static files.

## Local setup

Requires Node 22 or newer. Copy `.env.example` to untracked `.env`, then supply test API key, store ID, one digital variant ID (`LEMONSQUEEZY_DIGITAL_VARIANT_ID`) and a random webhook signing secret using your secret manager. Do not paste credentials into chat or commit them.

```sh
node --env-file=.env server/index.mjs
node --test tests/payments.test.mjs
```

The default API is `http://127.0.0.1:8787`; frontend origin is `http://127.0.0.1:8766`. Set `checkoutApi` in `counting-carbon/config.json` to the API base URL and keep the configured €20 EUR display price in sync with the provider. The digital button remains disabled while both a verified hosted test link and API configuration are missing. Match display prices to the provider variants and state tax treatment in the product UI.

The existing website is static and cannot run this Node backend on GitHub Pages. A separate sandbox Node service with HTTPS and persistent private storage is needed for remote checkout/webhook testing. Set its frontend allowlisted origin, bind `HOST=0.0.0.0` there, and use its secret manager. Configure edge rate limiting when behind a proxy; the built-in limit deliberately does not trust spoofable forwarding headers. Do not serve the repository root as a public directory: `.env`, audit files and backend files must stay private.

No hosting service, payment account, product or webhook was created; no production configuration was changed. Live operation is intentionally unavailable on this branch and needs a separately reviewed release change.

## Provider configuration and acceptance checks still required

1. In **test mode**, create the €20 EUR digital bundle, select tax-inclusive pricing and eBooks classification, and attach sample PDF and EPUB files to the same variant. Live-store activation can follow later.
2. For the hosted route, verify the reusable Share link's test banner and price, then configure it as described above. For the optional API route, configure the sandbox service and webhook endpoint for `order_created` and `order_refunded` with the matching signing secret.
3. Complete a provider sandbox checkout. Check price, tax presentation, successful order and receipt. Test cancellation/failure and refunds. Sandbox receipts are sent to the store owner/team.
4. **File downloads are disabled for all test-mode purchases.** Inspect the attached files in the dashboard, but defer actual buyer download and post-refund access checks to the separately approved live release. Do not claim that sandbox checkout proves delivery of the final PDF and EPUB.
5. For the optional backend, check dashboard orders against audit records, invalid signatures, webhook retries and service restarts with persistent storage. Check the frontend on keyboard/mobile.

Automated tests mock the provider at the HTTP boundary; they verify our request/security logic, not actual tax calculations, receipt emails or download access. No provider checkout has yet been completed. The tests reject obsolete separate-format `pdf`/`epub` orders and physical orders. Hosted-link tests cover missing configuration, mode restrictions, customer cart links and unsafe URLs.

## Official references (checked 8 October 2026)

- [Sales tax and VAT](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat)
- [Tax categories](https://docs.lemonsqueezy.com/help/products/tax-categories)
- [Create checkout](https://docs.lemonsqueezy.com/api/checkouts/create-checkout)
- [Signing webhook requests](https://docs.lemonsqueezy.com/help/webhooks/signing-requests)
- [Order object](https://docs.lemonsqueezy.com/api/orders/the-order-object)
- [Sharing products](https://docs.lemonsqueezy.com/help/products/sharing-products)
- [Managing product files](https://docs.lemonsqueezy.com/help/products/managing-file-versions)
- [Test mode](https://docs.lemonsqueezy.com/help/getting-started/test-mode)
