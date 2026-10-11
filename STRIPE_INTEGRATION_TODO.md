# Counting Carbon — payment and delivery setup

The selected launch sells **one €19.99 PDF + EPUB bundle**, with Stripe Managed Payments checkout and delivery from **richard@climateguidance.com**. Dropbox holds version-specific files; Make handles verified orders and email. The printed edition remains **Coming soon**.

## Current status — 11 October 2026

| Item | Status |
|---|---|
| Version 18 PDF and EPUB | Complete; source unchanged, PDF reviewed, EPUBCheck passed |
| Dropbox upload | Both buyer links downloaded and matched the approved file hashes |
| Live Stripe catalogue | €19.99 one-time, tax-inclusive product and price created |
| Make account and Stripe connection | Connected |
| Stripe webhook | Enabled for completed Checkout Sessions and successful delayed payments |
| Make scenario | Inactive draft; trigger and authenticated Session lookup added |
| Email connection | Connected; test message received in the Climate Guidance inbox |
| Paid-order filters and duplicate guard | Configured in inactive draft; end-to-end validation pending |
| Sandbox purchase and actual email/download test | Pending |
| Live Payment Link | Not created |
| Website Buy button | Disabled until delivery passes testing |

The connector currently exposes only the live Stripe account. A separate sandbox connection is needed for end-to-end testing. No real payment is needed.

## Catalogue

Climate Guidance account: `acct_1UOPUpBTUOb6lCsc`.

- Product: `prod_VPkbhHjiRsA4u0` — Counting Carbon — PDF + EPUB.
- Price: `price_1UOv6ABTUOb6lCscNicCpqFp` — EUR 1999 cents, one-time, inclusive tax.
- Lookup key: `counting_carbon_digital_eur_1999`.
- Tax category: `txcd_10302000` — downloaded digital books.
- [Stripe product](https://dashboard.stripe.com/acct_1UOPUpBTUOb6lCsc/products/prod_VPkbhHjiRsA4u0).

Confirm Managed Payments activation and product eligibility before launch. Use `managed_payments.enabled: true`. Omit `automatic_tax` and a payment-method allowlist; the owner approved this adjustment because Managed Payments controls them. Adaptive Pricing may offer local currency; validate the purchased Price ID rather than assuming every charged amount is in EUR.

## Finish the Make workflow

The scenario **Counting Carbon — paid order delivery** receives `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Its authenticated lookup retrieves the current Checkout Session, expanded line items and latest charge.

Require a complete, paid, one-time Session in the expected environment, with exactly one configured book bundle item and quantity one. Check the payment is not refunded or disputed. Use the email from the retrieved Session. Restrict delivery to the book's Payment Link or metadata once configured.

Use sequential scenario processing and a durable record keyed by Session ID. Reserve the order before sending, record edition and delivery outcome, and ignore already delivered events. Ambiguous SMTP failures need review before retrying. Keep update opt-in and unsubscribe suppression separate; purchase does not imply consent to announcements.

Connect SMTP, add the private v18 links to the thank-you email, and record delivery state. Download links, credentials and buyer information must never enter GitHub or the public website.

## Test and activate

1. Create a Stripe sandbox product/price and matching Make connection. Use only test card details in sandbox checkout.
2. Complete a sandbox Checkout Session. Confirm one email arrives containing both working edition-18 links; download and open both files.
3. Replay the event and confirm no duplicate email. Unpaid, wrong-product and wrong-environment events must send nothing. Delayed payments wait for success. Verify the error notification/support path.
4. Test Yes, No and blank update choices, plus suppression of an unsubscribed address in future announcements.
5. Verify live Managed Payments readiness. Create the live Payment Link only after delivery testing passes. Add the optional book-update dropdown, default No, and record its wording with consent.
6. In `counting-carbon/config.json`, set the live digital `purchaseUrl`, `paymentMode: live`, `salesStatus: available`, and digital `availability: available`. Keep `checkoutMode: payment_link`, `checkoutApi` empty and printed edition Coming soon.
7. Publish and verify the public button opens the correct €19.99 bundle checkout. Do not make a real charge as a test.

## Website and maintenance

`checkout.js` accepts only HTTPS links on `buy.stripe.com` with no credentials, query or hash, and matching test/live mode. `book.js` enables the button only when a valid link and available status exist. Card details stay on Stripe.

The earlier Node server and Render configuration remain an undeployed alternative. No recurring hosting charge has been accepted. For support, verify an order in Stripe before resending. For a new edition, upload and test fresh links, update the delivery template, and deliberately send an announcement only to opted-in, non-suppressed buyers.

See [Dropbox delivery details](docs/download-hosting.md) for file maintenance and mail settings.

## References

- [Managed Payments Payment Links](https://docs.stripe.com/payments/managed-payments/use-payment-links)
- [Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Payment Link custom fields](https://docs.stripe.com/payment-links/customize#add-custom-fields)
- [Make Stripe integration](https://apps.make.com/stripe)
