# Counting Carbon: setting up the digital edition

> Superseded for the current launch: the owner selected Stripe Managed Payments on 9 October 2026. This document records the earlier Lemon Squeezy approach. Follow [Stripe setup](stripe-managed-payments.md) instead.

Prepared 8 October 2026. The local development site offers one **€20 PDF + EPUB bundle**. The printed edition is **Coming soon**; no print checkout is implemented. No payment account or provider product has been created, and no purchase link is configured yet.

## 1. Create your account and store

[Sign up for Lemon Squeezy](https://www.lemonsqueezy.com/) using your own email, then create a Climate Guidance store. Keep **Test mode** enabled while setting it up. New stores start in test mode, so you can prepare the product before applying for live-store approval. [Test-mode instructions](https://docs.lemonsqueezy.com/help/getting-started/test-mode).

For live selling later, complete the account's store-activation application, identity verification and payout details. Enter banking and identity information directly with the provider. [Store activation](https://docs.lemonsqueezy.com/help/getting-started/activate-your-store).

## 2. Create one product containing both formats

In Products, choose **New Product** and use these settings:

| Setting | Value |
|---|---|
| Name | Counting Carbon — Digital edition (PDF + EPUB) |
| Description | A practical guide to carbon budgets, sinks and removal. Includes both PDF and EPUB in one purchase. |
| Payment | Single payment |
| Price / currency | 20.00 / EUR |
| Tax category | eBooks |
| Files | The PDF and EPUB attached to the same product/variant |

Keep one purchasable variant. Separate PDF and EPUB variants would make readers choose a format again. Use clearly labelled sample files while setting up; replace them with the approved release files before sale. The final EPUB still needs to be prepared and checked. The full paid book belongs in Lemon Squeezy's product files, not the public website repository. [Product and file settings](https://docs.lemonsqueezy.com/help/products/adding-products), [tax categories](https://docs.lemonsqueezy.com/help/products/tax-categories).

In the store's **General Settings**, enable **tax-inclusive pricing** so the advertised €20 includes applicable VAT. This affects the whole store. As merchant of record, Lemon Squeezy handles the checkout sales tax/VAT calculation, collection and remittance. Your payout is after tax and fees; your own income accounting is separate. [VAT settings](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat).

## 3. Get the test checkout link

With Test mode still enabled, publish the test product and use its **Share** button. Copy the reusable checkout URL directly from that panel and send that public link here. This is all we need for the website button; no API key is needed for this hosted-checkout route. Check that opening it shows a test checkout before we connect it.

Do not copy a customer-specific address containing `?cart=` from the browser after opening checkout. That address is created for an individual session. [Sharing a product](https://docs.lemonsqueezy.com/help/products/sharing-products).

The prepared local site will open this hosted checkout, and Lemon Squeezy will handle payment and digital delivery on its servers. The optional custom backend remains available for an independent order/refund audit, but it is not required to sell these files through a hosted link.

## 4. Test checkout and receipts

Use the provider's test Visa **4242 4242 4242 4242**, a future expiry date and any three-digit CVC. Confirm the €20 EUR total and tax presentation, a successful dashboard order, and the receipt. Test receipts go to the store owner/team even when another test customer email is entered.

**Lemon Squeezy disables file downloads for test purchases.** A sandbox test therefore cannot prove that both purchased files download correctly. We can inspect the attached files in the dashboard now; the final buyer download and refund-access checks belong to a separately approved live-release check. Do not use a real card in test mode. [Official testing instructions and limitations](https://docs.lemonsqueezy.com/help/getting-started/test-mode).

## 5. Prepare the live release later

Once the book files and checkout are approved, finish store activation, copy the product to Live mode, attach/check both release files, and verify the live price and tax settings. Test products do not automatically become live products. The current development code is configured for testing; a live checkout requires a deliberate release change. No live product publication or website deployment has been performed.

Lemon Squeezy sends net proceeds to the configured bank or PayPal account. Its published base fee is **5% + US$0.50** per transaction; international/PayPal payments and currency conversion or payouts can incur additional fees. The €20 is the reader's price, not your net proceeds. [Fees](https://docs.lemonsqueezy.com/help/getting-started/fees), [getting paid](https://docs.lemonsqueezy.com/help/getting-started/getting-paid).

The immediate next step is to create the test product and share its public checkout link. Keep passwords, API keys, banking details and identity documents out of chat.

## Printed edition

Printing is deferred at your request. The site has a disabled Coming soon option with no price or provider connection. Earlier cost comparisons are retained only as [research for a future print edition](print-on-demand-research.md).

Developer configuration and the optional backend are documented in [the technical payment guide](counting-carbon-payments.md).
