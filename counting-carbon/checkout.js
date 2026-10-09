// A Share link from a test-mode product can serve the static preview directly.
// checkoutMode records a manual dashboard/checkout check; it cannot prove the
// provider's mode. Confirm the test banner before configuring any link here.
export function hostedTestCheckout(config, product) {
  if (config.paymentMode !== 'test' || product.id !== 'digital' ||
      product.checkoutMode !== 'test' || !product.purchaseUrl) return null;
  try {
    const url = new URL(product.purchaseUrl);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.lemonsqueezy.com') ||
        url.username || url.password || url.port || url.hash || url.searchParams.has('cart') ||
        !/^\/(checkout\/)?buy\/[a-z0-9-]+\/?$/i.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}
