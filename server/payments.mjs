import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const positiveId = value => typeof value === 'string' && /^[1-9]\d*$/.test(value);

// This branch cannot switch to live mode through an environment variable.
export function paymentConfig(env = process.env) {
  if (env.PAYMENT_MODE && env.PAYMENT_MODE !== 'test') throw Error('Only test payments are supported on this branch.');
  const origin = new URL(env.SITE_ORIGIN || 'http://127.0.0.1:8766');
  if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password ||
      !(origin.protocol === 'https:' || (origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname)))) {
    throw Error('SITE_ORIGIN must be an HTTPS origin (or local development origin).');
  }
  const variants = { digital: env.LEMONSQUEEZY_DIGITAL_VARIANT_ID };
  for (const value of Object.values(variants)) if (value && !positiveId(value)) throw Error('Variant IDs must be positive integers.');
  if (env.LEMONSQUEEZY_STORE_ID && !positiveId(env.LEMONSQUEEZY_STORE_ID)) throw Error('Invalid store ID.');
  return {
    origin: origin.origin, apiKey: env.LEMONSQUEEZY_API_KEY || '',
    storeId: env.LEMONSQUEEZY_STORE_ID || '', variants,
    webhookSecret: env.LEMONSQUEEZY_WEBHOOK_SECRET || '',
    ledgerDir: resolve(env.PAYMENT_LEDGER_DIR || './.payment-data'),
  };
}

export function validSignature(raw, signature, secret) {
  if (!secret || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac('sha256', secret).update(raw).digest(), Buffer.from(signature, 'hex'));
}

export function createPayments(config, { fetchImpl = fetch, now = () => Date.now() } = {}) {
  async function api(path, body) {
    if (!config.apiKey || !config.storeId) throw new HttpError(503, 'Test checkout has not been configured yet.');
    let response;
    try {
      response = await fetchImpl(`https://api.lemonsqueezy.com/v1/${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${config.apiKey}`, Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
      });
    } catch { throw new HttpError(502, 'Payment provider is temporarily unavailable. Please try again.'); }
    if (!response.ok) throw new HttpError(502, 'Payment provider could not complete the request. Please try again.');
    try { return (await response.json()).data; }
    catch { throw new HttpError(502, 'Payment provider returned an invalid response.'); }
  }
  async function checkout(input) {
    if (!input || input.product !== 'digital' || Object.keys(input).some(k => k !== 'product')) {
      throw new HttpError(400, 'Choose the digital edition (PDF + EPUB). Prices and payment details are set by the store.');
    }
    const variant = config.variants[input.product];
    if (!variant) throw new HttpError(503, 'The digital edition is not yet available in test checkout.');
    const data = await api('checkouts', { data: {
      type: 'checkouts', attributes: {
        test_mode: true, expires_at: new Date(now() + 30 * 60 * 1000).toISOString(),
        product_options: { enabled_variants: [Number(variant)] },
        checkout_options: { embed: false },
        checkout_data: { custom: { product: input.product, integration: 'counting-carbon-sandbox' } },
      },
      relationships: { store: { data: { type: 'stores', id: config.storeId } }, variant: { data: { type: 'variants', id: variant } } },
    } });
    const a = data?.attributes;
    let url;
    try { url = new URL(a?.url); } catch { throw new HttpError(502, 'Invalid checkout response.'); }
    if (a.test_mode !== true || String(a.store_id) !== config.storeId || String(a.variant_id) !== variant ||
        url.protocol !== 'https:' || !url.hostname.endsWith('.lemonsqueezy.com') || url.username || url.password || url.port) {
      throw new HttpError(502, 'Provider response failed sandbox validation.');
    }
    return { url: url.href, mode: 'test' };
  }
  async function webhook(raw, signature) {
    if (!config.webhookSecret) throw new HttpError(503, 'Webhook is not configured.');
    if (!validSignature(raw, signature, config.webhookSecret)) throw new HttpError(401, 'Invalid webhook signature.');
    let event;
    try { event = JSON.parse(raw.toString('utf8')); } catch { throw new HttpError(400, 'Invalid JSON.'); }
    const name = event?.meta?.event_name;
    if (!['order_created', 'order_refunded'].includes(name)) return { received: true, ignored: true };
    const id = event?.data?.id;
    if (event?.data?.type !== 'orders' || !positiveId(String(id)) || event?.data?.attributes?.test_mode !== true) {
      throw new HttpError(400, 'Expected a test order.');
    }
    // Re-fetch current provider state: a replayed paid event cannot resurrect a refunded order.
    const order = await api(`orders/${id}`);
    const a = order?.attributes;
    const variant = String(a?.first_order_item?.variant_id);
    const product = Object.keys(config.variants).find(k => config.variants[k] === variant);
    if (String(order?.id) !== String(id) || order?.type !== 'orders' || a?.test_mode !== true ||
        String(a.store_id) !== config.storeId || !product) throw new HttpError(400, 'Order does not match this test store.');
    if (!['paid', 'refunded', 'partial_refund'].includes(a.status)) return { received: true, ignored: true };
    const record = { provider: 'lemonsqueezy', orderId: String(id), product, status: a.status, testMode: true,
      providerUpdatedAt: a.updated_at, event: name, fulfilment: 'provider_managed_download' };
    // Immutable, idempotent audit records; never store customer data, receipt URLs or file URLs.
    const key = createHash('sha256').update(JSON.stringify(record)).digest('hex');
    await mkdir(config.ledgerDir, { recursive: true, mode: 0o700 });
    try { await writeFile(join(config.ledgerDir, `${key}.json`), JSON.stringify(record) + '\n', { flag: 'wx', mode: 0o600 }); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
    return { received: true };
  }
  return { checkout, webhook };
}
