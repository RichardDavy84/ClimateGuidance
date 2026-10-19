export function paperbackCheckout(config) {
  if (config.price !== 19.99 || config.currency !== 'EUR' || config.shippingRegion !== 'Europe' || config.shippingIncluded !== true) return null;
  if (!['test','live'].includes(config.paymentMode) || typeof config.checkoutUrl !== 'string') return null;
  let url; try { url = new URL(config.checkoutUrl); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'buy.stripe.com' || url.username || url.password || url.port || url.search || url.hash) return null;
  if (!/^\/(?:test_)?[A-Za-z0-9]+$/.test(url.pathname)) return null;
  if (url.pathname.startsWith('/test_') !== (config.paymentMode === 'test')) return null;
  return url.href;
}
