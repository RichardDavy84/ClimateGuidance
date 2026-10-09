import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.ico':'image/x-icon', '.mp4':'video/mp4', '.webm':'video/webm', '.woff2':'font/woff2' };
createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const parts = path.split('/').filter(Boolean);
    if (parts.some(p => p.startsWith('.')) || (parts.length > 1 && !['counting-carbon','warm-nights'].includes(parts[0]))) throw Error();
    let file = resolve(root, '.' + path);
    if ((await stat(file)).isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(302, { Location: path + '/' }); return res.end(); }
      file = resolve(file, 'index.html');
    }
    file = await realpath(file);
    if (!file.startsWith(root + sep) || !mime[extname(file)]) throw Error();
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain' }); res.end('Not found'); }
}).listen(8766, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8766/counting-carbon/'));
