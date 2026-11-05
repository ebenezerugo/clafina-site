// Serves out/ the way Cloudflare Pages does: directory index.html, and the nearest 404.html with a 404 status.
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = 'out';
const PORT = Number(process.env.PORT ?? 4311);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

function resolve(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, safe);
  if (existsSync(file) && statSync(file).isFile()) return file;
  if (existsSync(join(file, 'index.html'))) return join(file, 'index.html');
  return null;
}

function nearest404(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  while (parts.length) {
    const candidate = join(ROOT, ...parts, '404.html');
    if (existsSync(candidate)) return candidate;
    parts.pop();
  }
  return join(ROOT, '404.html');
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  // Behave like functions/api/lead.ts without a CRM or Turnstile configured.
  if (pathname === '/api/lead') {
    res.writeHead(req.method === 'POST' ? 503 : 405, { 'Content-Type': 'application/json' }).end(req.method === 'POST' ? '{"error":"not_connected"}' : '');
    return;
  }
  if (!pathname.endsWith('/') && !extname(pathname) && resolve(pathname + '/')) {
    res.writeHead(308, { Location: pathname + '/' }).end();
    return;
  }
  const file = resolve(pathname);
  const status = file ? 200 : 404;
  const path = file ?? nearest404(pathname);
  const type = TYPES[extname(path)] ?? 'application/octet-stream';
  const body = readFileSync(path);
  // Cloudflare compresses text; do the same so local and CI measurements match what visitors get.
  if (/text|javascript|json|xml|svg/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    res.writeHead(status, { 'Content-Type': type, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
    res.end(gzipSync(body));
    return;
  }
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}).listen(PORT, () => console.log(`Serving out/ on http://127.0.0.1:${PORT}`));
