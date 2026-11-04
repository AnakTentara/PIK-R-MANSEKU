#!/usr/bin/env node
/**
 * Server produksi ringan untuk frontend hasil build (folder dist). Tanpa dependensi, tanpa Vite.
 *
 *   node scripts/serve-static.mjs --dir <folder dist> --port 25551 [--api http://127.0.0.1:25552]
 *                                 [--https --cert-dir <folder>]
 *
 * - File statis: kompresi br/gzip (di-cache di memori), ETag/304, cache setahun untuk /assets (nama berhash)
 * - Rute SPA: path tanpa ekstensi aset -> index.html; file aset yang hilang -> 404 (bukan HTML)
 * - /api, /uploads, /robots.txt, /sitemap.xml diteruskan ke backend; rantai X-Forwarded-For dari Cloudflare
 *   dibiarkan utuh supaya backend (trust proxy) melihat IP asli pengunjung, bukan IP komputer ini
 * - --https: sertifikat self-signed dibuat otomatis (butuh openssl, ada di Git for Windows)
 *   supaya kamera HP bisa dipakai lewat alamat LAN
 */
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith('--')) continue;
  const next = argv[i + 1];
  args[argv[i].slice(2)] = next && !next.startsWith('--') ? next : true;
}

const ROOT = path.resolve(String(args.dir || 'dist'));
const PORT = Number(args.port || 8080);
const API = new URL(String(args.api || 'http://127.0.0.1:25552'));
const INDEX = path.join(ROOT, 'index.html');
if (!fs.existsSync(INDEX)) {
  console.error(`[serve] ${INDEX} tidak ada. Jalankan "npm run build" di folder frontend dulu.`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.map': 'application/json',
  '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf'
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml', '.map']);

const send = (res, code, text, type = 'text/plain; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(text);
};

// ─── Proxy ke backend ───────────────────────────────────────────────────────
const isProxied = (p) => p === '/api' || p.startsWith('/api/') || p.startsWith('/uploads/') || p === '/robots.txt' || p === '/sitemap.xml';
const agent = new http.Agent({ keepAlive: true, maxSockets: 128 });
const HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);

function proxy(req, res) {
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k)) headers[k] = v;
  // Dari Cloudflare rantai ini sudah ada dan tidak disentuh; akses langsung (LAN) memakai IP peer
  if (!headers['x-forwarded-for']) headers['x-forwarded-for'] = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const up = http.request({ hostname: API.hostname, port: API.port, path: req.url, method: req.method, headers, agent, timeout: 120000 }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on('timeout', () => up.destroy(new Error('timeout')));
  up.on('error', () => {
    if (!res.headersSent) send(res, 502, JSON.stringify({ message: 'Server aplikasi sedang tidak tersedia, coba lagi sebentar.' }), 'application/json; charset=utf-8');
    else res.destroy();
  });
  res.on('close', () => { if (!res.writableEnded) up.destroy(); });
  req.pipe(up);
}

// ─── File statis ────────────────────────────────────────────────────────────
const zcache = new Map();
let zbytes = 0;
function compressed(file, stat, enc) {
  const key = `${file}|${stat.mtimeMs}|${enc}`;
  let buf = zcache.get(key);
  if (buf) return buf;
  const raw = fs.readFileSync(file);
  buf = enc === 'br'
    ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
    : zlib.gzipSync(raw, { level: 6 });
  if (zbytes + buf.length > 64 * 1024 * 1024) { zcache.clear(); zbytes = 0; }
  zcache.set(key, buf);
  zbytes += buf.length;
  return buf;
}

function serveFile(req, res, file, stat) {
  const ext = path.extname(file).toLowerCase();
  const rel = '/' + path.relative(ROOT, file).split(path.sep).join('/');
  const noCache = ext === '.html' || ext === '.webmanifest' || /^\/(sw|service-worker|registerSW)\.js$/.test(rel);
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    ETag: etag,
    'Last-Modified': stat.mtime.toUTCString(),
    'Cache-Control': noCache ? 'no-cache' : rel.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    Vary: 'Accept-Encoding'
  };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }

  const ae = String(req.headers['accept-encoding'] || '');
  const enc = COMPRESSIBLE.has(ext) && stat.size > 1024 && stat.size <= 5 * 1024 * 1024
    ? (ae.includes('br') ? 'br' : ae.includes('gzip') ? 'gzip' : null) : null;
  if (enc) {
    const body = compressed(file, stat, enc);
    res.writeHead(200, { ...headers, 'Content-Encoding': enc, 'Content-Length': body.length });
    return res.end(req.method === 'HEAD' ? undefined : body);
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

function handle(req, res) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return send(res, 400, 'Permintaan tidak valid'); }
  if (pathname.includes('\0')) return send(res, 400, 'Permintaan tidak valid');
  if (pathname === '/healthz') return send(res, 200, 'ok');
  if (isProxied(pathname)) return proxy(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Metode tidak diizinkan');

  let file = path.join(ROOT, pathname);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, 'Dilarang');
  let stat = null;
  try { stat = fs.statSync(file); } catch { /* tidak ada */ }
  if (stat?.isDirectory()) { file = path.join(file, 'index.html'); try { stat = fs.statSync(file); } catch { stat = null; } }
  if (!stat?.isFile()) {
    // Aset yang hilang jangan dijawab HTML (bisa merusak cache); path halaman SPA kembali ke index.html
    if (MIME[path.extname(pathname).toLowerCase()]) return send(res, 404, 'Tidak ditemukan');
    file = INDEX;
    stat = fs.statSync(INDEX);
  }
  serveFile(req, res, file, stat);
}

const onRequest = (req, res) => {
  try { handle(req, res); } catch (err) {
    console.error('[serve] error:', err.message);
    if (!res.headersSent) send(res, 500, 'Kesalahan server'); else res.destroy();
  }
};

// ─── HTTPS self-signed (opsional) ───────────────────────────────────────────
function ensureCert() {
  const dir = path.resolve(String(args['cert-dir'] === true || !args['cert-dir'] ? path.join(os.homedir(), '.pikr-certs') : args['cert-dir']));
  const key = path.join(dir, 'key.pem');
  const cert = path.join(dir, 'cert.pem');
  if (!fs.existsSync(key) || !fs.existsSync(cert)) {
    fs.mkdirSync(dir, { recursive: true });
    const ips = Object.values(os.networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4').map((n) => n.address);
    const san = ['DNS:localhost', 'IP:127.0.0.1', ...ips.map((ip) => `IP:${ip}`)].join(',');
    const candidates = ['openssl', 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe', 'C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe'];
    let made = false;
    for (const bin of candidates) {
      try {
        execFileSync(bin, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '3650',
          '-subj', '/CN=PIK-R Absen', '-addext', `subjectAltName=${san}`], { stdio: 'ignore' });
        made = true;
        break;
      } catch { /* coba kandidat berikutnya */ }
    }
    if (!made) { console.error('[serve] openssl tidak ditemukan; tidak bisa membuat sertifikat HTTPS.'); process.exit(1); }
    console.log(`[serve] Sertifikat self-signed dibuat di ${dir}`);
  }
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}

const server = args.https ? https.createServer(ensureCert(), onRequest) : http.createServer(onRequest);
server.keepAliveTimeout = 65000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[serve] ${args.https ? 'https' : 'http'}://0.0.0.0:${PORT}  <-  ${ROOT}  |  API -> ${API.origin}`);
});
const stop = () => server.close(() => process.exit(0));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
