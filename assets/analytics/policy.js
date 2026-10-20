// Only fixed, public labels enter analytics. Calculator and form values are excluded.
export const CONSENT_KEY = 'cg.analytics-consent.v1';
export const CONSENT_DAYS = 180;
export function readConsent(raw, now = Date.now()) {
  try {
    const item = JSON.parse(raw);
    if (item?.version !== 1 || !['accepted', 'declined'].includes(item.choice) ||
        !Number.isFinite(item.savedAt) || item.savedAt > now + 300000 ||
        now - item.savedAt > CONSENT_DAYS * 86400000) return null;
    return item.choice;
  } catch { return null; }
}
export function canonicalPath(pathname) {
  return pathname.replace(/\/index\.html$/, '/');
}
export function pageMeasurement(config, location) {
  const path = canonicalPath(location.pathname);
  if (!/^G-[A-Z0-9]+$/.test(config.measurementId || '') ||
      !['www.climateguidance.com', 'climateguidance.com'].includes(location.hostname) ||
      !config.pages.includes(path) || path.startsWith('/counting-carbon/downloads/')) return null;
  return { page_path: path, page_location: location.origin + path };
}
export function safeReferrer(referrer, config) {
  try {
    const url = new URL(referrer);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    const internal = ['www.climateguidance.com', 'climateguidance.com'].includes(url.hostname);
    const path = canonicalPath(url.pathname);
    return url.origin + (internal && config.pages.includes(path) ? path : '/');
  } catch { return ''; }
}
export function interactionMeasurement(tool, kind) {
  if (!tool || !['control', 'button', 'map'].includes(kind)) return null;
  return {tool_id: tool.id, tool_name: tool.title, interaction_type: kind};
}
export function checkoutMeasurement(path, href, digitalButton = false) {
  if (!['/counting-carbon/', '/counting-carbon/paperback/'].includes(canonicalPath(path))) return null;
  if (digitalButton) return {book_format: 'digital_bundle', checkout_channel: 'direct'};
  try {
    const url = new URL(href);
    if (url.hostname === 'buy.stripe.com' && url.pathname === '/28EcN41SNfTN8fAc5C4wM03')
      return {book_format: 'paperback_bundle', checkout_channel: 'direct'};
    if (url.hostname === 'www.amazon.co.uk' && url.pathname === '/dp/B0HN5DCX52')
      return {book_format: 'paperback', checkout_channel: 'amazon'};
  } catch { /* Other links have no checkout event. */ }
  return null;
}
