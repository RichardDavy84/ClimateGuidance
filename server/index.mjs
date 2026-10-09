import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createPayments, paymentConfig, HttpError } from './payments.mjs';

export function createPaymentServer(config, dependencies = {}) {
  const payments = createPayments(config, dependencies);
  const limits = new Map();
  const windowMs = 60000;
  async function readBody(req) {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 65536) throw new HttpError(413, 'Request too large.');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  return createServer({ requestTimeout: 20000, headersTimeout: 10000 }, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'application/json');
    const reply = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (path === '/health' && req.method === 'GET') return reply(200, { status: 'ok', mode: 'test' });
      if (path === '/api/checkout') {
        if (req.headers.origin !== config.origin) throw new HttpError(403, 'Unrecognised site origin.');
        res.setHeader('Access-Control-Allow-Origin', config.origin);
        res.setHeader('Vary', 'Origin');
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Methods', 'POST');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          return reply(204, {});
        }
        if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');
        if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new HttpError(415, 'Use application/json.');
        // Single-process sandbox limit. Behind a proxy, configure an edge limit as documented.
        const now = Date.now(), ip = req.socket.remoteAddress;
        for (const [key, value] of limits) if (value.until <= now) limits.delete(key);
        const value = limits.get(ip) || { count: 0, until: now + windowMs };
        limits.set(ip, value);
        if (++value.count > 10) throw new HttpError(429, 'Please wait a minute before trying again.');
        let input; try { input = JSON.parse((await readBody(req)).toString('utf8')); }
        catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'Invalid JSON.'); }
        return reply(200, await payments.checkout(input));
      }
      if (path === '/api/webhooks/lemonsqueezy' && req.method === 'POST') {
        return reply(200, await payments.webhook(await readBody(req), req.headers['x-signature']));
      }
      throw new HttpError(404, 'Not found.');
    } catch (error) { reply(error.status || 500, { error: error.status ? error.message : 'Payment service unavailable.' }); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = paymentConfig();
  createPaymentServer(config).listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => {
    console.log('Counting Carbon payment API running in TEST mode.');
  });
}
