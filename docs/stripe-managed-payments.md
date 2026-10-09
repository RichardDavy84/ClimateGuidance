# Stripe Managed Payments: digital book release

The selected product is **Counting Carbon — PDF + EPUB**, one payment of **€20 EUR**. Both formats come with the same purchase. The printed edition remains Coming soon.

## Current state

The owner has configured Stripe Managed Payments and a sandbox product. The public website is configured for this provider but deliberately shows the digital bundle as Coming soon. There is no Stripe payment endpoint, private file store or verified download-delivery system connected yet. The old Lemon Squeezy test backend does not serve this route.

The completed release files are Counting Carbon v14.pdf and Counting Carbon v14.epub, held outside this repository. Only the cover and three limited page images are public.

## Connect the purchase

1. Keep the existing Stripe product and create the appropriate Checkout or Payment Link with Managed Payments enabled. Set the final EUR price and verify tax-inclusive presentation if the customer total is to remain €20.
2. Upload both release files to private storage, such as a private Cloudflare R2 bucket. Keep public access off. Stripe's product image field is for promotional artwork, not delivery of the book.
3. Deploy a small backend separately from GitHub Pages. It verifies Stripe webhook signatures, retrieves the paid session and checks the product and payment status before granting access to both formats. Record fulfilment so duplicate events do not create duplicate orders.
4. Provide a purchase-confirmation page and email access link. Generate short-lived download URLs from the private files after authorising the purchase. Handle delayed payments, refunds and repeat access explicitly.
5. Test checkout, both downloads, confirmation email and duplicate events in the sandbox. Then configure the live product, storage and endpoint, test the live release flow, and enable the purchase button. Do not expose a sandbox payment link as a working public sale.

Keep API and webhook secrets in the backend host's secret settings, never in config.json or the public repository.

## Official references

- [Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments)
- [Managed Payments with Payment Links](https://docs.stripe.com/payments/managed-payments/use-payment-links)
- [Stripe fulfilment and verified payment events](https://docs.stripe.com/checkout/fulfillment)
- [Private R2 download links](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
