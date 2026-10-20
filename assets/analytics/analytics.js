import {CONSENT_KEY, readConsent, pageMeasurement, safeReferrer, interactionMeasurement, checkoutMeasurement} from './policy.js';

const element = document.querySelector('#cg-analytics-config');
const config = element ? JSON.parse(element.textContent) : null;
const page = config && pageMeasurement(config, location);
const privacyPage = location.pathname === '/privacy.html';
const localPreview = ['localhost', '127.0.0.1'].includes(location.hostname) && /^G-[A-Z0-9]+$/.test(config?.measurementId || '') && config.pages.includes(location.pathname);
const canChoose = Boolean(page || localPreview);
const browserOptOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
let choice = null, started = false, banner, lastInteraction = -Infinity;
try { choice = readConsent(localStorage.getItem(CONSENT_KEY)); } catch { /* Choices remain available without storage. */ }
const tool = config?.tools.find(item => item.url === page?.page_path);
const disabledKey = config?.measurementId ? 'ga-disable-' + config.measurementId : '';
if (disabledKey) window[disabledKey] = browserOptOut || choice !== 'accepted';
const emit = (name, parameters) => {
  if (started && choice === 'accepted' && !browserOptOut) window.gtag('event', name, parameters);
};
function start() {
  if (!page || started || browserOptOut || choice !== 'accepted') return;
  started = true;
  window[disabledKey] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
  window.gtag('consent', 'update', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
  window.gtag('js', new Date());
  const common = {...page, page_title: document.title, page_referrer: safeReferrer(document.referrer, config)};
  window.gtag('set', common);
  window.gtag('config', config.measurementId, {
    ...common, send_page_view:true, allow_google_signals:false,
    allow_ad_personalization_signals:false, cookie_expires:90 * 86400,
    cookie_update:false, cookie_flags:'SameSite=Lax;Secure'
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.measurementId);
  document.head.append(script);
  if (tool) emit('tool_open', {tool_id:tool.id, tool_name:tool.title});
}
function clearAnalyticsCookies() {
  const domains = ['', location.hostname, 'climateguidance.com'];
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (!/^_ga(?:_|$)/.test(name)) continue;
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax; Secure${domain ? '; domain=' + domain : ''}`;
  }
}
function updateStatus() {
  const status = document.querySelector('#analytics-choice-status');
  if (status) status.textContent = browserOptOut
    ? 'Your browser privacy preference keeps optional analytics off.'
    : localPreview ? 'Analytics is disabled in local previews.'
    : !page ? 'Optional analytics is awaiting connection. No analytics is being collected.'
    : choice === 'accepted' ? 'Your current choice: analytics allowed.'
    : choice === 'declined' ? 'Your current choice: analytics declined.'
    : 'You can allow or decline optional analytics below.';
  document.querySelectorAll('[data-analytics-choice="accepted"]').forEach(button => { button.disabled = browserOptOut || !canChoose; });
}
function choose(next) {
  choice = next;
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify({version:1, choice, savedAt:Date.now()})); } catch { /* Apply this visit's choice even without storage. */ }
  banner?.remove();
  updateStatus();
  if (choice === 'accepted') start();
  else {
    if (disabledKey) window[disabledKey] = true;
    clearAnalyticsCookies();
    // A fresh page removes the loaded tag and its event listeners after withdrawal.
    if (started) location.reload();
  }
}
if (canChoose && !browserOptOut && !choice && !privacyPage) {
  banner = document.createElement('section');
  banner.className = 'cg-analytics-consent';
  banner.setAttribute('aria-labelledby', 'cg-analytics-heading');
  banner.innerHTML = '<div><h2 id="cg-analytics-heading">Help improve these climate tools?</h2><p>Optional analytics helps me see which pages and tools people use, and for how long. You can change your choice at any time. <a href="/privacy.html">Privacy &amp; analytics</a></p></div><div class="cg-analytics-actions"><button type="button" data-analytics-choice="accepted">Allow analytics</button><button type="button" data-analytics-choice="declined">Decline analytics</button></div>';
  document.body.append(banner);
}
document.addEventListener('click', event => {
  const preference = event.target.closest('[data-analytics-choice]');
  if (preference) { choose(preference.dataset.analyticsChoice); return; }
  if (!started || choice !== 'accepted' || browserOptOut) return;
  const link = event.target.closest('a[href]');
  const checkout = checkoutMeasurement(location.pathname, link?.href, Boolean(event.target.closest('#products article:first-child button')));
  if (checkout) emit('book_checkout_click', checkout);
  if (!tool || !event.target.closest('main') || event.target.closest('.cg-tutorial, .tutorial-overlay, dialog, nav')) return;
  const kind = event.target.closest('.leaflet-container, canvas, svg') ? 'map' : event.target.closest('button, [role="tab"]') ? 'button' : null;
  if (kind && performance.now() - lastInteraction > 1000) {
    lastInteraction = performance.now();
    emit('tool_interaction', interactionMeasurement(tool, kind));
  }
}, true);
document.addEventListener('change', event => {
  if (!tool || !event.target.closest('main') || !event.target.matches('input, select') || performance.now() - lastInteraction <= 1000) return;
  lastInteraction = performance.now();
  emit('tool_interaction', interactionMeasurement(tool, 'control'));
});
updateStatus();
start();
