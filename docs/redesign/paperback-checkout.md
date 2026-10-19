# Direct paperback checkout

Owner-approved offer: one paperback of Counting Carbon for €19.99 including postage within Europe. Richard handles dispatch manually.

## Draft implementation

- Both paperback choices appear together on the book page.
- The Request a copy direct button opens the hosted form in one click. An information page is also retained at `/counting-carbon/paperback/`.
- `content/paperback.json` holds the price, region, payment mode and eventual hosted payment link.
- Stripe hosted checkout collects the buyer’s name, email, shipping address and payment in one form. The website itself needs no card or address storage.
- The URL validator allows the configured Stripe Payment Link environment only. Missing or mismatched configuration keeps checkout closed.
- The €9.99 digital checkout and its existing delivery automation remain in place.

## Sandbox checkout created and verified

The browser sign-in completed successfully. Only the existing Climate Guidance sandbox was changed.

- Sandbox account: `acct_1UOPUxBbpvbDaZbY`
- Product: `prod_VTGRaoElTcgENp`
- Price: `price_1USJuTBbpvbDaZbYoSZP4FXQ`
- Payment Link: `plink_1USJvnBbpvbDaZbYOJ1gR0J8`
- Test form: https://buy.stripe.com/test_4gM00i9cl5Vs0Jw1Khew802
- Product category: Books, `txcd_35010000`
- Price: one-time €19.99, tax-inclusive price behaviour, quantity fixed at one
- Name collection: required shipping recipient name, with email and shipping address; one name field in the buyer form
- Shipping: Stripe’s Europe group plus Cyprus, 53 destinations, recorded in `paperback-test-verification.json`
- Shipping charge: included in the product price
- Managed Payments: disabled for this physical-book flow
- Automatic tax: disabled in the sandbox pending review of live tax handling
- Success message: thanks the buyer, explains personal dispatch, and gives richard@climateguidance.com for questions

The hosted form was opened from the draft route and the exact total verified through Stripe’s order-summary tool: `livemode:false`, `currency:eur`, `totalAmount:1999`. Card fields and the full delivery-address form were inspected. No payment was submitted.

## Before later live activation

1. Confirm the exact postal destinations, delivery terms and available stock. The test configuration records the broad Europe grouping for review.
2. Confirm applicable VAT handling and tax registrations for the ordinary Stripe Payments flow. Tax-inclusive price behaviour records a price convention; automatic tax collection needs its own verified configuration.
3. Prepare the live physical-book product and payment link after launch approval, keeping the digital edition’s existing Managed Payments flow intact.
4. Enable owner notifications for successful payments. Verify the payment is paid in the Dashboard and read the delivery address from that same payment before dispatch. Keep pending asynchronous payments pending. If fulfilment email automation is added later, use verified paid Checkout webhook events and idempotent retries.
5. Complete paid, failed, cancelled and delayed-payment testing in the sandbox, then connect the approved live link and deploy only at the later launch step.

## References read

- [Managed Payments eligibility](https://docs.stripe.com/payments/managed-payments/eligibility)
- [Payment Link customisation, including names and addresses](https://docs.stripe.com/payment-links/customize)
