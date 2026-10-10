import Stripe from 'stripe';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile, stat, realpath } from 'node:fs/promises';
import { resolve, join } from 'node:path';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const sessionId = id => typeof id === 'string' && /^cs_(test|live)_[A-Za-z0-9]+$/.test(id);
export function paymentConfig(env = process.env) {
  const mode = env.PAYMENT_MODE || 'test';
  if (!['test', 'live'].includes(mode)) throw Error('PAYMENT_MODE must be test or live.');
  const origin = new URL(env.SITE_ORIGIN || 'http://127.0.0.1:8766');
  if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password ||
      !(origin.protocol === 'https:' || (mode === 'test' && origin.protocol === 'http:' && ['localhost','127.0.0.1'].includes(origin.hostname)))) throw Error('SITE_ORIGIN must be an HTTPS origin (or local test origin).');
  const apiKey = env.STRIPE_SECRET_KEY || '';
  if (apiKey && !new RegExp(`^[sr]k_${mode}_`).test(apiKey)) throw Error('Stripe key and PAYMENT_MODE must match.');
  return {
    mode, origin: origin.origin, apiKey,
    priceId: env.STRIPE_DIGITAL_PRICE_ID || 'price_...',
    successUrl: env.STRIPE_SUCCESS_URL || `${origin.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: env.STRIPE_CANCEL_URL || origin.origin,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
    ledgerDir: resolve(env.PAYMENT_LEDGER_DIR || './.payment-data'),
    files: {pdf:env.BOOK_PDF_PATH || '', epub:env.BOOK_EPUB_PATH || ''},
  };
}

export function createPayments(config, { stripe: injectedStripe } = {}) {
  // No API version override: use the installed SDK's compatible default.
  const stripe = injectedStripe || (config.apiKey ? new Stripe(config.apiKey, {timeout:15000, maxNetworkRetries:2}) : null);
  function ready() {
    if (!stripe || !/^price_[A-Za-z0-9]+$/.test(config.priceId) || !config.webhookSecret) throw new HttpError(503, 'Checkout has not been configured yet.');
  }
  async function api(action) {
    try { return await action(); }
    catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(502, 'Payment service is temporarily unavailable. Please try again.'); }
  }
  async function privateFile(format) {
    if (!['pdf','epub'].includes(format) || !config.files?.[format]) throw new HttpError(503, 'Book downloads are not ready yet.');
    let path, info;
    try { path = await realpath(config.files[format]); info = await stat(path); } catch { throw new HttpError(503, 'Book downloads are not ready yet.'); }
    const root = resolve(import.meta.dirname, '..');
    // Files must be outside the static site or inside the explicitly excluded private folder.
    if (!info.isFile() || !info.size || (path.startsWith(root + '/') && !path.startsWith(join(root,'private-products') + '/'))) throw new HttpError(503, 'Private download storage is not configured correctly.');
    return {path, size:info.size, format};
  }
  async function validatePrice() {
    const price = await api(() => stripe.prices.retrieve(config.priceId));
    if (!price.active || price.type !== 'one_time' || price.currency !== 'eur' || price.unit_amount !== 1999 || price.tax_behavior !== 'inclusive' || price.livemode !== (config.mode === 'live')) throw new HttpError(503, 'The digital edition price must be €19.99 including tax.');
  }
  async function checkout(input) {
    if (!input || input.product !== 'digital' || Object.keys(input).some(k => k !== 'product')) throw new HttpError(400, 'Choose the digital edition (PDF + EPUB). Prices are set by the store.');
    ready();
    for (const value of [config.successUrl, config.cancelUrl]) {
      const url = new URL(value);
      if (url.origin !== config.origin) throw new HttpError(503, 'Checkout return URLs must use the website origin.');
    }
    if (!config.successUrl.includes('{CHECKOUT_SESSION_ID}')) throw new HttpError(503, 'The checkout success page is not configured.');
    await Promise.all([validatePrice(), privateFile('pdf'), privateFile('epub')]);
    const session = await api(() => stripe.checkout.sessions.create({
      ui_mode: 'hosted_page', mode: 'payment',
      billing_address_collection: 'auto', phone_number_collection: {enabled:false},
      // Owner approved omitting automatic_tax: Managed Payments controls tax itself.
      managed_payments: {enabled:true},
      allow_promotion_codes: false, submit_type: 'auto',
      integration_identifier: 'hosted_web_0001', origin_context: 'web',
      success_url: config.successUrl, cancel_url: config.cancelUrl,
      line_items: [{price:config.priceId, quantity:1}],
    }));
    let url; try { url = new URL(session.url); } catch { throw new HttpError(502, 'Invalid checkout response.'); }
    if (session.livemode !== (config.mode === 'live') || url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.username || url.password || url.port) throw new HttpError(502, 'Invalid checkout response.');
    return {url:url.href, mode:config.mode};
  }
  const orderPath = id => join(config.ledgerDir, createHash('sha256').update(id).digest('hex') + '.json');
  async function paidSession(id) {
    ready();
    if (!sessionId(id)) throw new HttpError(400, 'Invalid checkout reference.');
    const session = await api(() => stripe.checkout.sessions.retrieve(id, {expand:['line_items', 'payment_intent.latest_charge']}));
    const lines = session.line_items;
    if (session.livemode !== (config.mode === 'live') || session.mode !== 'payment' || session.managed_payments?.enabled !== true || lines?.has_more || lines?.data?.length !== 1 || lines.data[0].price?.id !== config.priceId || lines.data[0].quantity !== 1) throw new HttpError(403, 'This payment does not match the digital edition.');
    if (session.status !== 'complete' || session.payment_status !== 'paid') throw new HttpError(409, 'Payment is still being confirmed. Please check again shortly.');
    const charge = session.payment_intent?.latest_charge;
    if (!charge || typeof charge !== 'object' || !charge.paid || charge.amount_refunded > 0 || charge.refunded || charge.disputed) throw new HttpError(403, 'Downloads are unavailable for this payment.');
    return session;
  }
  async function webhook(raw, signature) {
    ready(); let event;
    try { event = stripe.webhooks.constructEvent(raw, signature, config.webhookSecret); }
    catch { throw new HttpError(400, 'Invalid webhook signature.'); }
    if (event.livemode !== (config.mode === 'live')) throw new HttpError(400, 'Webhook mode does not match.');
    if (!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed'].includes(event.type)) return {received:true};
    if (event.type === 'checkout.session.async_payment_failed') return {received:true};
    let session;
    try { session = await paidSession(event.data.object.id); }
    catch (error) { if ([403,409].includes(error.status)) return {received:true}; throw error; }
    await mkdir(config.ledgerDir,{recursive:true,mode:0o700});
    try { await writeFile(orderPath(session.id), JSON.stringify({sessionId:session.id, paymentIntent:session.payment_intent.id, priceId:config.priceId, mode:config.mode, eventId:event.id}), {flag:'wx',mode:0o600}); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
    return {received:true};
  }
  async function authoriseDownload(id) {
    const session = await paidSession(id); let record;
    try { record = JSON.parse(await readFile(orderPath(id),'utf8')); }
    catch { throw new HttpError(409, 'Your payment is confirmed. Downloads are being prepared; please check again shortly.'); }
    if (record.sessionId !== id || record.priceId !== config.priceId || record.mode !== config.mode) throw new HttpError(403, 'Download access could not be verified.');
    return session;
  }
  async function downloads(id) {
    await authoriseDownload(id); await Promise.all([privateFile('pdf'),privateFile('epub')]);
    return {files:['pdf','epub'].map(format=>({format,path:`/api/download/${format}?session_id=${encodeURIComponent(id)}`}))};
  }
  async function download(id,format) { await authoriseDownload(id); return privateFile(format); }
  return {checkout, webhook, downloads, download};
}
