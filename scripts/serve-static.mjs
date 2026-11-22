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
  '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf',
  '.apk': 'application/vnd.android.package-archive'
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
  if (ext === '.apk') {
    headers['Content-Disposition'] = `attachment; filename="${path.basename(file)}"`;
  }
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

// ─── Social Media Crawler Detection (WhatsApp, FB, Telegram, etc) ────────
const CRAWLER_RE = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|TelegramBot|Discordbot|LinkedInBot|SkypeUriPreview|Slackbot|Pinterest|Googlebot|bingbot/i;
const escapeHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CERITA_RESERVED = new Set([
  'cari', 'jelajah', 'aktivitas', 'pesan', 'konseling', 'p', 'disimpan', 'arsip',
  'pengaturan', 'profil', 'login', 'manifest.webmanifest', 'sw.js', 'robots.txt',
  'sitemap.xml', 'assets', 'media', 'uploads', 'api', 'healthz', 'favicon.ico'
]);

function injectMetaTags(rawIndex, { title, description, image, url, type = 'website', siteName = 'PIK-R MANSEKU' }) {
  let img = image || 'https://pikr-manseku.my.id/media/logos/L_PIK-R_Title.png';
  if (img.startsWith('/')) {
    img = `https://pikr-manseku.my.id${img}`;
  }
  
  let desc = String(description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (desc.length > 200) desc = desc.slice(0, 197) + '...';
  if (!desc) desc = 'Pusat Informasi & Konseling Remaja MAN 1 Muara Enim';

  const cleanTitle = String(title || siteName).replace(/\s+/g, ' ').trim();
  const fullTitle = cleanTitle.includes(siteName) ? cleanTitle : `${cleanTitle} — ${siteName}`;

  const tags = `
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeHtml(desc)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />

    <!-- Open Graph / WhatsApp / Facebook / Telegram -->
    <meta property="og:type" content="${escapeHtml(type)}" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(cleanTitle)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    <meta property="og:image" content="${escapeHtml(img)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(img)}" />
    <meta property="og:image:alt" content="${escapeHtml(cleanTitle)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:locale" content="id_ID" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(cleanTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(desc)}" />
    <meta name="twitter:image" content="${escapeHtml(img)}" />
`;

  // Strip existing <title>, <meta description>, <meta property="og:...">, <meta name="twitter:...">
  let cleaned = rawIndex
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["'](description|title|twitter:[^"']+)["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["'](og:[^"']+)["'][^>]*>/gi, '');

  return cleaned.replace(/<head>/i, `<head>${tags}`);
}

async function serveCrawlerBlog(req, res, slug, pathname) {
  try {
    const rawIndex = fs.readFileSync(INDEX, 'utf8');
    let post = null;

    // 1. Coba ambil dari Forum / Blog posts
    try {
      const resForum = await fetch(`${API.origin}/api/forum/posts/${encodeURIComponent(slug)}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (resForum.ok) {
        const json = await resForum.json();
        post = json.post || json;
      }
    } catch { /* abaikan */ }

    // 2. Fallback ambil dari Berita posts
    if (!post || !post.title) {
      try {
        const resNews = await fetch(`${API.origin}/api/blog/posts/${encodeURIComponent(slug)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (resNews.ok) {
          post = await resNews.json();
        }
      } catch { /* abaikan */ }
    }

    if (!post || !post.title) {
      return send(res, 200, rawIndex, 'text/html; charset=utf-8');
    }

    let featuredImg = post.featuredImg || null;
    if (!featuredImg && post.content) {
      const match = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        featuredImg = match[1];
      }
    }
    if (!featuredImg) {
      featuredImg = 'https://pikr-manseku.my.id/media/logos/L_PIK-R_Title.png';
    } else if (featuredImg.startsWith('/')) {
      featuredImg = `https://pikr-manseku.my.id${featuredImg}`;
    }

    const title = post.title;
    const desc = post.content || 'Berita dan informasi kegiatan Pusat Informasi dan Konseling Remaja MAN 1 Muara Enim.';
    const canonicalUrl = `https://pikr-manseku.my.id${pathname}`;

    const injected = injectMetaTags(rawIndex, {
      title,
      description: desc,
      image: featuredImg,
      url: canonicalUrl,
      type: 'article',
      siteName: 'PIK-R MANSEKU'
    });

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    return res.end(injected);
  } catch (err) {
    console.error('[serve] error serveCrawlerBlog:', err.message);
    return serveFile(req, res, INDEX, fs.statSync(INDEX));
  }
}

async function serveCrawlerProfile(req, res, slug, fromCerita = false) {
  try {
    const rawIndex = fs.readFileSync(INDEX, 'utf8');
    const apiRes = await fetch(`${API.origin}/api/public/profile/${encodeURIComponent(slug)}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!apiRes.ok) {
      return send(res, 200, rawIndex, 'text/html; charset=utf-8');
    }
    const data = await apiRes.json();
    const name = data.name || slug;
    const siteName = fromCerita ? 'Ruang Cerita · PIK-R MANSEKU' : 'PIK-R MANSEKU';
    const title = `${name} (@${slug})`;

    const descParts = [];
    if (data.bio) descParts.push(data.bio);
    if (data.jabatan) descParts.push(data.jabatan);
    if (data.className) descParts.push(`Kelas ${data.className}`);
    if (data.asalSekolah) descParts.push(data.asalSekolah);
    descParts.push('PIK-R MAN 1 Muara Enim');
    const desc = descParts.join(' • ');

    let photo = data.photoPath;
    if (photo && photo.startsWith('/')) {
      photo = `https://pikr-manseku.my.id${photo}`;
    } else if (!photo || !photo.startsWith('http')) {
      photo = 'https://pikr-manseku.my.id/media/logos/logo_pik-r.png';
    }

    const canonicalUrl = fromCerita
      ? `https://cerita.pikr-manseku.my.id/${slug}`
      : `https://pikr-manseku.my.id/@${slug}`;

    const injected = injectMetaTags(rawIndex, {
      title,
      description: desc,
      image: photo,
      url: canonicalUrl,
      type: 'profile',
      siteName
    });

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    return res.end(injected);
  } catch (err) {
    console.error('[serve] error serveCrawlerProfile:', err.message);
    return serveFile(req, res, INDEX, fs.statSync(INDEX));
  }
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

    // Jika perayap sosial media (WhatsApp, FB, Telegram, Twitter, Discord, dll)
    if (CRAWLER_RE.test(req.headers['user-agent'] || '')) {
      // 1. Blog atau Berita: /blog/:slug atau /berita/:slug
      if (pathname.startsWith('/blog/')) {
        const slug = pathname.slice(6).split('/')[0].split('?')[0];
        if (slug) return serveCrawlerBlog(req, res, slug, pathname);
      }
      if (pathname.startsWith('/berita/')) {
        const slug = pathname.slice(8).split('/')[0].split('?')[0];
        if (slug) return serveCrawlerBlog(req, res, slug, pathname);
      }

      // 2. Profil pengguna: /@slug atau /ruang-cerita/@slug atau /ruang-cerita/:username
      if (pathname.startsWith('/@')) {
        const slug = pathname.slice(2).split('/')[0].split('?')[0];
        if (slug) return serveCrawlerProfile(req, res, slug, false);
      }
      if (pathname.startsWith('/ruang-cerita/')) {
        const sub = pathname.slice(14).replace(/^@/, '').split('/')[0].split('?')[0];
        if (sub && !CERITA_RESERVED.has(sub.toLowerCase())) {
          return serveCrawlerProfile(req, res, sub, true);
        }
      }

      // 3. Khusus server Ruang Cerita (pikr-cerita): /:username atau /@:username
      const isCerita = ROOT.toLowerCase().includes('cerita');
      if (isCerita) {
        const seg = pathname.replace(/^\/+/, '').split('/')[0].split('?')[0];
        const userSlug = seg.replace(/^@/, '');
        if (userSlug && !CERITA_RESERVED.has(userSlug.toLowerCase())) {
          return serveCrawlerProfile(req, res, userSlug, true);
        }
      }
    }

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
