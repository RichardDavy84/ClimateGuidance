# Counting Carbon print-on-demand comparison

Checked 8 October 2026 using the providers' official documentation and public pricing calculators. No manuscript was uploaded and no order or account was created.

**Status: deferred at the owner's request.** The website shows Printed edition — coming soon, with no price or print checkout. These earlier findings are retained for future planning.

**Provisional recommendation for a future print edition: Lulu Bookstore.** It supports the tested long colour paperback and offers international ordering through its own checkout. That is simpler for this static website than building a second physical-goods payment and fulfilment backend. Lemon Squeezy explicitly excludes physical goods. [Lemon Squeezy product restrictions](https://docs.lemonsqueezy.com/help/getting-started/prohibited-products).

## Printing and shipping estimates

The local final-cover v13 PDF has 499 A4 pages (210 × 297 mm). For an indicative quote, I used **one 500-page A4, perfect-bound paperback, standard-colour interior, 60# white uncoated paper and matte cover** in the [Lulu calculator](https://www.lulu.com/pricing). Its product code was `0827X1169.FC.STD.PB.060UW444.MXX`. The 500-page figure is a quoting proxy, not a print-ready file specification; cover separation, blanks and final typesetting can change the interior count.

The calculator's “Book Total” was **€28.30**, and the following were its least-expensive listed trackable shipping services. These are **starting estimates, excluding tax and applicable fees**, not binding checkout quotes. No street address or postcode was entered. The last column is our arithmetic, adding the requested €20 markup to the two quoted costs.

| Destination | Printing | Shipping & handling from | Print + shipping | With €20 markup, before tax/fees |
|---|---:|---:|---:|---:|
| Germany | €28.30 | €6.04 | €34.34 | €54.34 |
| Norway | €28.30 | €23.42 | €51.72 | €71.72 |
| United States | €28.30 | €5.39 | €33.69 | €53.69 |
| Australia | €28.30 | €11.16 | €39.46 | €59.46 |

These examples show why neither “€25 delivered” nor one Europe-wide postage price fits the current layout. If printing resumes, the earlier requested model was **€20 + printing & delivery**, with applicable taxes shown before payment. The current site makes no print-price offer. We do not publish the sampled rates as guaranteed reader prices. Customs/import charges, where applicable, may be separate from checkout charges.

For comparison, Peecho's [public calculator](https://www.peecho.com/products/magazines) quoted **€88.00 product price + shipping from €17.88 = €105.88 including VAT** to Norway for one **500-page A4 matte magazine, perfect bound on 115 gsm silk-coated paper**, with currency set to EUR. This is a different paper/print product and tax basis, not an identical specification to Lulu. Adding our €20 markup would raise the price further; any tax effect on the markup would be determined by checkout.

## Provider fit

| Provider / route | Local production coverage | Checkout and pricing fit | Assessment |
|---|---|---|---|
| Lulu Bookstore | France, UK, US, Canada, Australia, India; automatic routing where feasible | Hosted checkout, shipping quote and retail tax handling; author sets list price per currency | Potential fit for the current 499-page colour manuscript; no integration is active. |
| Peecho hosted checkout | Global partner network; local production where the product is available | Hosted payments, fixed markup, address-based print/shipping quote | Convenient integration, but the standard softcover book stops at 300 pages; the 500-page magazine alternative is expensive in the sample. |
| Bookvault | UK plus domestic partners in US, Canada and Australia, subject to specification | Quote tool and ecommerce integrations; UK fulfils international routes when a domestic partner cannot | Worth a second production quote after final typesetting; its listed network offers less local European coverage. No numeric Bookvault quote was obtained. |

Lulu cannot guarantee a particular factory. Bookvault's overseas partners fulfil domestically; unsupported specifications route internationally from the UK. “Global” therefore means broad coverage, not a printer in every destination country. [Lulu routing](https://help.api.lulu.com/en/support/solutions/articles/64000254640-where-are-the-products-produced-and-shipped-from-), [Bookvault locations](https://help.bookvault.app/where-is-my-book-printed), [Bookvault shipping](https://help.bookvault.app/how-long-does-delivery-take).

Peecho's [hosted checkout](https://www.peecho.com/solutions/checkout) is attractive if a future print edition becomes shorter. Its [softcover specifications](https://www.peecho.com/products/books/softcover) allow 20–300 pages; its [magazine specifications](https://www.peecho.com/products/magazines) allow up to 500. Its regional availability varies by product. The pricing comparison above is why I would not select its 500-page option for this edition.

## Margin and implementation

The earlier pricing proposal used a **€20 markup before provider deductions**. In the Lulu Bookstore, the author's share is 80% of gross profit, so a €20 margin over manufacturing implies approximately €16 creator revenue before any withholding/income tax. A €20 net creator-revenue target would instead need €25 above manufacturing before other charges; that adjustment has not been made. [Lulu creator revenue guide](https://help.lulu.com/en/support/solutions/articles/64000262744-creator-revenue-guide).

The hosted Lulu approach uses a maintained list price per currency, with shipping calculated at checkout. It does **not** dynamically add a live factory-cost quote to €20 on our own server. Recalculate list prices when costs/specifications change. A fully dynamic cost-plus checkout would require a physical-commerce payment/tax system and the Lulu Print API; the existing Lemon Squeezy API must not be repurposed for physical orders.

The print listing, final product URL and approved print files do not exist. The site intentionally keeps the printed edition disabled, even if a URL were added. Resuming print sales would require a separate implementation and release decision. The [current setup guide](payments-and-print-setup.md) focuses on digital sales only.
