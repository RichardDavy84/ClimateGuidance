# Counting Carbon: Dropbox delivery

The selected workflow uses Stripe Managed Payments for checkout, Dropbox for the publication files, and Make to send email through the existing Climate Guidance mailbox. GitHub Pages continues to host the website. No additional payment server or paid hosting plan is needed for this workflow. The earlier Render configuration and Node payment server are retained as an alternative; they have not been deployed.

## Publication files

Version 18 is exported as a 720-page PDF and a reflowable EPUB. The Word source is unchanged. All PDF pages were rendered and reviewed; text, illustrations and footnotes were checked. EPUBCheck reports zero errors and zero warnings.

Both files have been uploaded to the private Dropbox folder **Counting Carbon - Version 18**. Version-specific download links belong in the private delivery configuration, never in this repository or the public website. Anyone receiving a link can forward it. Refunding a payment cannot retract downloaded files or revoke only that buyer's shared link.

For each major edition, upload new files to a new version folder, generate new links, verify both downloads, and update the Make email template. Keep older edition files available for previous purchasers. Do not replace the previous edition silently.

## Email connection

Make sends from **richard@climateguidance.com** through Namecheap Private Email. The prepared connection uses `mail.privateemail.com`, port `465`, secure TLS enabled, explicit TLS disabled, and the full email address as username. Enter the mailbox password or app password directly in Make, never in source files or chat.

The purchaser receives both file links after confirmed payment. A separate optional checkout choice asks about major edition announcements. Blank or No does not subscribe them. Keep the consent wording, choice and timestamp with the order. Every announcement should explain that replying “unsubscribe” stops future announcements; record that suppression before the next campaign.

## Operations

Check Make failure notifications and order records. If an email send has an uncertain outcome, inspect the mailbox/provider status before retrying. For a support request, verify the payment in Stripe before resending.

The scenario must retrieve the current Stripe Session, validate payment and product, and record the Session ID to suppress duplicate webhook deliveries. A checkout redirect or webhook payload alone is not sufficient proof of a paid order. Delayed payments wait for confirmed success.

See [the integration checklist](../STRIPE_INTEGRATION_TODO.md) for current launch status. Books are uploaded and both download hashes match the approved files. Sandbox payment-to-email tests passed, including both update choices, duplicate replay and wrong-price rejection. The live Make scenario is active and the website uses the live Managed Payments link.

## References

- [Stripe Managed Payments Payment Links](https://docs.stripe.com/payments/managed-payments/use-payment-links)
- [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Make Stripe integration](https://apps.make.com/stripe)
- [Make Email integration](https://apps.make.com/email)
- [Namecheap Private Email configuration](https://www.namecheap.com/support/knowledgebase/article.aspx/1179/2175/general-private-email-configuration-for-mail-clients-and-mobile-devices/)
