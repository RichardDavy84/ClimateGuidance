export function validCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}

export function paymentLinkForProduct(config, product) {
  if (product.checkoutMode !== 'payment_link' || !['test', 'live'].includes(config.paymentMode)) return null;
  try {
    const url = new URL(product.purchaseUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com' || url.username || url.password || url.port) return null;
    if (!/^\/(?:test_)?[A-Za-z0-9]+$/.test(url.pathname) || url.search || url.hash) return null;
    if (url.pathname.startsWith('/test_') !== (config.paymentMode === 'test')) return null;
    return url.href;
  } catch { return null; }
}
