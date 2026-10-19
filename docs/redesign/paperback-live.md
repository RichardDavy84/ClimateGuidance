# Direct paperback sales: live setup

19 October 2026. Owner explicitly approved activation and website connection of the live €19.99 checkout after confirming dispatch from Norway and no current VAT registration.

- Account: Climate Guidance, `acct_1UOPUpBTUOb6lCsc` (live).
- Product: `prod_VTGuSPo1NVFR84`, Counting Carbon: Paperback.
- Price: `price_1USKMjBTUOb6lCscM47SWAEl`, one-time EUR 19.99, fixed quantity one, price inclusive if taxes are enabled in a future configuration.
- Product tax code: Books, `txcd_35010000`.
- Payment link: `plink_1USKQ8BTUOb6lCscvTCDWpBg`.
- Buyer URL: https://buy.stripe.com/28EcN41SNfTN8fAc5C4wM03
- Shipping destinations: Stripe Europe group plus Cyprus, 53 destinations, matching the reviewed sandbox form.
- No separate shipping charge. European postage is included in €19.99.
- Delivery email, full shipping name and address are required. No duplicate billing-name field or mandatory phone number.
- Managed Payments is disabled: physical books are ineligible.
- Automatic tax collection is disabled because the owner confirmed no VAT registration. This does not assert that the seller has no future registration obligations.
- Product and website text disclose dispatch from Norway and recipient responsibility for import taxes or carrier handling fees where applicable.
- Confirmation page thanks the buyer and explains that dispatch is arranged after confirmed payment.
- Owner successful-payment email preference and customer receipts were enabled in the live Dashboard. Customer support replies use richard@climateguidance.com. Orders and addresses remain available in Stripe.

## Fulfil an order

Check that the payment has succeeded in Stripe, including any delayed payment method. Open the payment’s shipping details and post the paperback to that address. Contact the buyer using their order email if needed and send dispatch confirmation manually. Do not post on the basis of a pending payment or the browser confirmation page alone. Maintain an order/dispatch record and handle any refund in Stripe.

Digital sales continue through the existing €9.99 product and its existing delivery automation. The physical book has a separate product, price and payment link. Its purchases also receive PDF and EPUB through the same Make scenario. The saved filter adds a separate physical branch pinned to the new price and payment link; all existing digital rules and all connection, SMTP, record and duplicate-guard mappings were preserved exactly. Immediately-as-data-arrives scheduling and active state were verified after reloading. The exported rule set accepted the valid physical fixture and rejected a mismatch in each of its 13 required fields. No live payment was submitted. Amazon purchasers can request the included digital formats by emailing their order confirmation; Amazon does not supply buyer emails to this automation.

## Tax and customs references

The owner confirmed the posting country and registration status; no tax registration was invented or submitted.

- Norwegian registration threshold and prohibition on invoicing VAT before registration: https://www.skatteetaten.no/en/business-and-organisation/vat-and-duties/vat/register-change-delete
- EU consumer guidance on buying goods from outside the EU: https://europa.eu/youreurope/citizens/consumers/shopping/vat/index_en.htm
- UK overseas-goods guidance, including its section on solely zero-rated goods: https://www.gov.uk/guidance/vat-and-overseas-goods-sold-directly-to-customers-in-the-uk
- Stripe tax collection and registration model: https://docs.stripe.com/tax/how-tax-works

Review registration and destination rules as sales grow or the dispatch arrangement changes. An import declaration with the correct sale value and description is needed for exports. The website and checkout avoid promising a tax-free delivery abroad.

## Verification and backup

The saved Make blueprint was exported after reloading. Its filter matches the prepared two-branch filter exactly. All connections, module mappings, SMTP settings and private download links match the pre-change export. The original digital branch is unchanged. Private before/after blueprints are saved in the adjacent `work_paperback_live` workspace directory, outside this public repository. `paperback-delivery-filter.json` records only the non-secret filter rules. The live checkout was opened and verified to display €19.99, included PDF + EPUB, required shipping fields and the intended 53 European destinations. No card data was entered and no live test payment was made.
