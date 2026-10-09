import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { paymentConfig, createPayments, validSignature } from '../server/payments.mjs';
import { createPaymentServer } from '../server/index.mjs';

const config = { origin: 'http://127.0.0.1:8766', apiKey: 'fake-test-key', storeId: '1', variants: { digital: '10' }, webhookSecret: 'fake-webhook-secret' };
const response = attributes => ({ ok: true, json: async () => ({ data: { type: 'checkouts', attributes } }) });
const checkout = { url: 'https://example.lemonsqueezy.com/checkout/custom/test', test_mode: true, store_id: 1, variant_id: 10 };
const event = Buffer.from(JSON.stringify({ meta: { event_name: 'order_created' }, data: { type: 'orders', id: '100', attributes: { test_mode: true } } }));
const sign = raw => createHmac('sha256', config.webhookSecret).update(raw).digest('hex');

test('configuration forbids live mode and unsafe origins', () => {
  assert.throws(() => paymentConfig({ PAYMENT_MODE: 'live' }), /Only test/);
  assert.throws(() => paymentConfig({ SITE_ORIGIN: 'http://example.com' }));
  assert.throws(() => paymentConfig({ LEMONSQUEEZY_DIGITAL_VARIANT_ID: 'invalid' }));
  assert.equal(paymentConfig({}).origin, config.origin);
});
test('checkout forces test mode, locks variant and uses provider price', async () => {
  let body;
  const p = createPayments(config, { fetchImpl: async (_, opts) => { body = JSON.parse(opts.body); return response(checkout); } });
  assert.equal((await p.checkout({ product: 'digital' })).mode, 'test');
  assert.equal(body.data.attributes.test_mode, true);
  assert.deepEqual(body.data.attributes.product_options.enabled_variants, [10]);
  assert.equal(body.data.attributes.custom_price, undefined);
  await assert.rejects(p.checkout({ product: 'digital', price: 1 }), /Prices/);
  for (const product of ['pdf', 'epub', 'hardcopy']) await assert.rejects(p.checkout({ product }));
  assert.equal(body.data.attributes.checkout_data.custom.product, 'digital');
});
test('checkout refuses live, wrong-store, wrong-variant and hostile URL responses', async () => {
  for (const patch of [{ test_mode: false }, { store_id: 2 }, { variant_id: 11 }, { url: 'https://lemonsqueezy.com.evil.test/pay' }]) {
    const p = createPayments(config, { fetchImpl: async () => response({ ...checkout, ...patch }) });
    await assert.rejects(p.checkout({ product: 'digital' }));
  }
});
test('missing configuration disables checkout; provider errors do not leak secrets', async () => {
  await assert.rejects(createPayments({ ...config, apiKey: '' }).checkout({ product: 'digital' }), /not been configured/);
  await assert.rejects(createPayments(config, { fetchImpl: async () => { throw Error('secret'); } }).checkout({ product: 'digital' }), /temporarily unavailable/);
});
test('signature binds exact raw bytes and rejects malformed signatures', () => {
  assert.equal(validSignature(event, sign(event), config.webhookSecret), true);
  assert.equal(validSignature(Buffer.concat([event, Buffer.from(' ')]), sign(event), config.webhookSecret), false);
  assert.equal(validSignature(event, 'no', config.webhookSecret), false);
});
test('webhook rechecks provider and persists idempotent private records, including refunds', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cc-payment-'));
  let status = 'paid';
  const p = createPayments({ ...config, ledgerDir: dir }, { fetchImpl: async () => ({ ok: true, json: async () => ({ data: { type: 'orders', id: '100', attributes: { test_mode: true, store_id: 1, first_order_item: { variant_id: 10 }, status, updated_at: status } } }) }) });
  try {
    await assert.rejects(p.webhook(event, 'bad'), /signature/);
    await p.webhook(event, sign(event)); await p.webhook(event, sign(event));
    assert.equal((await readdir(dir)).length, 1);
    status = 'refunded'; await p.webhook(event, sign(event));
    assert.equal((await readdir(dir)).length, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('signed webhook cannot register a live or unrelated order', async () => {
  for (const patch of [{ test_mode: false }, { store_id: 2 }, { first_order_item: { variant_id: 999 } }]) {
    const p = createPayments(config, { fetchImpl: async () => ({ ok: true, json: async () => ({ data: { type: 'orders', id: '100', attributes: { test_mode: true, store_id: 1, first_order_item: { variant_id: 10 }, status: 'paid', ...patch } } }) }) });
    await assert.rejects(p.webhook(event, sign(event)), /does not match/);
  }
});
test('HTTP origin checks, preflight, malformed JSON and private-path isolation', async () => {
  const server = createPaymentServer(config, { fetchImpl: async () => response(checkout) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const root = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(root + '/api/checkout', { method: 'POST' })).status, 403);
    assert.equal((await fetch(root + '/api/checkout', { method: 'OPTIONS', headers: { Origin: config.origin } })).status, 204);
    const headers = { Origin: config.origin, 'Content-Type': 'application/json' };
    assert.equal((await fetch(root + '/api/checkout', { method: 'POST', headers, body: '{' })).status, 400);
    const r = await fetch(root + '/api/checkout', { method: 'POST', headers, body: JSON.stringify({ product: 'digital' }) });
    assert.equal(r.status, 200); assert.equal((await r.json()).mode, 'test');
    for (const path of ['/.env', '/.payment-data', '/private-products/book.pdf', '/server/payments.mjs']) assert.equal((await fetch(root + path)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
