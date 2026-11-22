import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import prisma, { initDatabase } from './config/db.js';
import adminRoutes from './routes/admin.js';
import candidateRoutes from './routes/candidates.js';
import blogRoutes from './routes/blog.js';
import forumRoutes from './routes/forum.js';
import publicRoutes from './routes/public.js';
import absenRoutes from './routes/absen.js';
import { getPublicProfile } from './controllers/absen.js';
import socialRoutes from './routes/social.js';
import rcRoutes from './rc/router.js';
import pushRoutes from './routes/push.js';
import { checkMessageKey } from './rc/crypto.js';
import { authAny } from './middlewares/auth.js';
import { ensureAbsenAccount } from './middlewares/authAbsen.js';
import { ensureMemberIdentity } from './utils/slug.js';
import readline from 'readline';
import { execSync } from 'child_process';
import { initWhatsApp, isWhatsAppReady } from './services/whatsapp.js';
import { SITE_URL, ALLOWED_ORIGINS } from './config/site.js';
import { startAnnouncementScheduler } from './services/announcementScheduler.js';

dotenv.config();

// ─── Validasi ENV — hanya info, tidak crash server ─────────────────────────
// ────────────────────────────────────────────────────────────────────────────


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 25552;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:25551';

// Trust reverse proxy (Pterodactyl/Nginx) agar rate limiter bisa baca IP asli user
app.set('trust proxy', 1);

// Force HTTP -> HTTPS 301 Permanent Redirect for Google SEO Canonical compliance
app.use((req, res, next) => {
  const xfp = req.headers['x-forwarded-proto'];
  if (xfp && xfp.toLowerCase() === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Middleware
// Origin yang boleh memanggil API: semua diturunkan dari .env (lihat config/site.js)
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads/photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded photos as static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/absen', absenRoutes);
app.get('/api/public/profile/:slug', authAny, getPublicProfile);
app.use('/api/social', socialRoutes);
app.use('/api/rc', rcRoutes); // Ruang Cerita
app.use('/api/push', pushRoutes);

// SEO: Robots.txt
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin
Disallow: /api/

# AI Search & Grounding Bots
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`);
});

// AI Grounding LLMs.txt
app.get('/llms.txt', (req, res) => {
  const p = path.join(__dirname, '../frontend/public/llms.txt');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.status(404).send('Not found');
});

app.get('/llms-full.txt', (req, res) => {
  const p = path.join(__dirname, '../frontend/public/llms-full.txt');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.status(404).send('Not found');
});

// SEO: Dynamic Sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  const baseUrl = SITE_URL;
  const staticPages = [
    '',
    '/daftar',
    '/ruang-cerita',
    '/kami',
    '/cek-kelulusan',
    '/berita',
    '/blog',
    '/anggota',
    '/alumni'
  ];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const posts = await prisma.post.findMany({
      select: { slug: true, updatedAt: true }
    });
    
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true }
    });
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    staticPages.forEach(page => {
      const loc = page === '' ? `${baseUrl}/` : `${baseUrl}${page}`;
      const priority = page === '' ? '1.0' : (page === '/daftar' || page === '/ruang-cerita' || page === '/kami' ? '0.9' : '0.8');
      xml += `  <url>\n`;
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
    });
    
    posts.forEach(post => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/berita/${post.slug}</loc>\n`;
      xml += `    <lastmod>${post.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });
    
    blogPosts.forEach(post => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
      xml += `    <lastmod>${post.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });
    
    xml += `</urlset>`;
    return res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

// Health check endpoint — cek DB dan WA Bot
app.get('/health', async (req, res) => {
  let dbStatus = 'OK';
  try { await prisma.$queryRaw`SELECT 1`; }
  catch { dbStatus = 'ERROR'; }

  const waStatus = isWhatsAppReady() ? 'CONNECTED' : 'DISCONNECTED';
  const overall = dbStatus === 'OK' ? 'OK' : 'DEGRADED';

  return res.status(dbStatus === 'OK' ? 200 : 503).json({
    status: overall,
    services: { db: dbStatus, whatsapp: waStatus },
    uptime: Math.floor(process.uptime()) + 's',
    timestamp: new Date().toISOString()
  });
});

// Helper function to seed default admin
async function seedDefaultAdmin() {
  try {
    const defaultUsername = 'pikr-manseku';
    const defaultPassword = 'pikrman2026==';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Clean up old temporary 'admin' and 'pikrmanseku01' accounts if they exist
    try {
      const oldAdmin = await prisma.admin.findUnique({ where: { username: 'admin' } });
      if (oldAdmin) {
        await prisma.admin.delete({ where: { username: 'admin' } });
        console.log('Removed temporary admin account.');
      }
      const oldDev = await prisma.admin.findUnique({ where: { username: 'pikrmanseku01' } });
      if (oldDev) {
        await prisma.admin.delete({ where: { username: 'pikrmanseku01' } });
        console.log('Removed old developer account pikrmanseku01.');
      }
    } catch (e) {
      // Ignore errors (e.g. table not ready yet)
    }

    // Upsert new default admin credentials
    await prisma.admin.upsert({
      where: { username: defaultUsername },
      update: { role: 'DEVELOPER' },
      create: {
        username: defaultUsername,
        password: hashedPassword,
        role: 'DEVELOPER'
      }
    });

    console.log('==================================================');
    console.log('Seed Akun Admin Berhasil:');
    console.log(`Username: ${defaultUsername}`);
    console.log('Password: (bawaan dari kode; segera ganti lewat dashboard)');
    console.log('==================================================');
  } catch (error) {
    console.error('Gagal menjalankan seeding admin default:', error);
  }
}

// Seed dummy org structure if empty
async function seedDummyOrgData() {
  try {
    const count = await prisma.orgMember.count();
    if (count > 0) return; // Already seeded

    const YEAR = new Date().getFullYear();
    const dummies = [
      { name: 'Drs. Ahmad Fauzi, M.Pd', role: 'PEMBINA', jabatan: 'Pembina', yearStart: YEAR, isCurrent: true, quote: 'PIK-R MANSEKU adalah wadah terbaik untuk mengembangkan karakter dan potensi remaja. Jadilah generasi yang bermanfaat!' },
      { name: 'Siti Rahmawati', role: 'KETUA', jabatan: 'Ketua Umum', yearStart: YEAR, isCurrent: true, quote: 'Bersama kita bisa membangun PIK-R MANSEKU menjadi organisasi yang lebih baik untuk generasi mendatang.' },
      { name: 'Muhammad Rizki', role: 'WAKIL', jabatan: 'Wakil Ketua', yearStart: YEAR, isCurrent: true, quote: 'Satu langkah kecil bersama dapat menjadi perubahan besar bagi komunitas kita.' },
      { name: 'Nurul Hidayah', role: 'KABINET', jabatan: 'Sekretaris Umum', yearStart: YEAR, isCurrent: true },
      { name: 'Fajar Maulana', role: 'KABINET', jabatan: 'Bendahara Umum', yearStart: YEAR, isCurrent: true },
      { name: 'Aisyah Putri', role: 'KABINET', jabatan: 'Koordinator Bidang Kesehatan Reproduksi', yearStart: YEAR, isCurrent: true },
      { name: 'Dini Permata', role: 'KABINET', jabatan: 'Koordinator Bidang Humas & Media', yearStart: YEAR, isCurrent: true },
      { name: 'Budi Santoso', role: 'KABINET', jabatan: 'Koordinator Bidang Pengembangan Diri', yearStart: YEAR, isCurrent: true },
    ];

    for (const d of dummies) {
      await prisma.orgMember.create({ data: { ...d, yearEnd: null, photoPath: null, quote: d.quote || null } });
    }

    // Seed dummy testimonials
    const tCount = await prisma.alumniTestimonial.count();
    if (tCount === 0) {
      const testimonials = [
        { name: 'Rania Safitri', angkatan: '2023', content: 'PIK-R MANSEKU telah membuka wawasan saya tentang kesehatan remaja dan pentingnya konseling sebaya. Pengalaman yang tak terlupakan!', photoPath: null },
        { name: 'Hendra Pratama', angkatan: '2023', content: 'Bergabung dengan PIK-R adalah keputusan terbaik semasa SMA. Banyak ilmu dan sahabat yang saya dapatkan di sini.', photoPath: null },
        { name: 'Dinda Maharani', angkatan: '2024', content: 'Program-program PIK-R sangat bermanfaat dan membentuk karakter saya. Terima kasih PIK-R MANSEKU!', photoPath: null },
      ];
      for (const t of testimonials) {
        await prisma.alumniTestimonial.create({ data: t });
      }
    }

    console.log('[Seed] Data dummy organisasi & testimoni berhasil ditambahkan.');
  } catch (error) {
    console.error('[Seed] Gagal menambahkan data dummy organisasi:', error.message);
  }
}

// SPA Static Fallback & HTML Serving (No-Cache for index.html so normal refresh always gets latest build)
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  const CRAWLER_RE = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|TelegramBot|Discordbot|LinkedInBot|SkypeUriPreview|Slackbot|Pinterest|Googlebot|bingbot/i;
  const escapeHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function injectMetaTags(rawIndex, { title, description, image, url, type = 'website', siteName = 'PIK-R MANSEKU' }) {
    let img = image || 'https://pikr-manseku.my.id/media/logos/L_PIK-R_Title.png';
    if (img.startsWith('/')) img = `https://pikr-manseku.my.id${img}`;
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

    let cleaned = rawIndex
      .replace(/<title>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta\s+name=["'](description|title|twitter:[^"']+)["'][^>]*>/gi, '')
      .replace(/<meta\s+property=["'](og:[^"']+)["'][^>]*>/gi, '');

    return cleaned.replace(/<head>/i, `<head>${tags}`);
  }

  app.get(/^.*$/, async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/sitemap') || req.path.startsWith('/robots') || req.path.startsWith('/llms')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Crawler dynamic OpenGraph injection
    if (CRAWLER_RE.test(req.headers['user-agent'] || '')) {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          const rawIndex = fs.readFileSync(indexPath, 'utf8');

          // 1. Blog / Berita
          if (req.path.startsWith('/blog/') || req.path.startsWith('/berita/')) {
            const slug = req.path.replace(/^\/(blog|berita)\//, '').split('/')[0];
            if (slug) {
              let post = await prisma.blogPost.findUnique({ where: { slug } });
              if (!post) {
                post = await prisma.post.findUnique({ where: { slug } });
              }
              if (post) {
                let featuredImg = post.featuredImg || null;
                if (!featuredImg && post.content) {
                  const m = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
                  if (m && m[1]) featuredImg = m[1];
                }
                const injected = injectMetaTags(rawIndex, {
                  title: post.title,
                  description: post.content,
                  image: featuredImg,
                  url: `https://pikr-manseku.my.id${req.path}`,
                  type: 'article',
                  siteName: 'PIK-R MANSEKU'
                });
                return res.send(injected);
              }
            }
          }

          // 2. Profil
          if (req.path.startsWith('/@') || req.path.startsWith('/ruang-cerita/@')) {
            const slug = req.path.replace(/^(\/ruang-cerita)?\/@/, '').split('/')[0];
            if (slug) {
              const m = await prisma.member.findUnique({
                where: { slug },
                include: { orgMember: true }
              });
              if (m) {
                const descParts = [];
                if (m.bio) descParts.push(m.bio);
                if (m.className) descParts.push(`Kelas ${m.className}`);
                if (m.asalSekolah) descParts.push(m.asalSekolah);
                descParts.push('PIK-R MAN 1 Muara Enim');
                const injected = injectMetaTags(rawIndex, {
                  title: `${m.name.trim()} (@${slug})`,
                  description: descParts.join(' • '),
                  image: m.photoPath,
                  url: `https://pikr-manseku.my.id/@${slug}`,
                  type: 'profile',
                  siteName: 'PIK-R MANSEKU'
                });
                return res.send(injected);
              }
            }
          }
        }
      } catch (err) {
        console.error('[server] Crawler error:', err.message);
      }
    }

    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, async () => {
  // Initialize Database before queries run
  await initDatabase();

  console.log(`[Server] PIK-R MANSEKU Backend berjalan di port ${PORT}`);
  console.log(`[Server] Mengizinkan CORS dari origin: ${FRONTEND_URL}`);
  
  // Seed admin if necessary
  await seedDefaultAdmin();

  // Seed dummy org data if empty
  await seedDummyOrgData();

  // Absensi: akun bersama + kode ID Card & link profil untuk semua anggota
  await ensureAbsenAccount();
  await ensureMemberIdentity();

  // Bot WhatsApp: nyala/mati diatur dari dashboard (Pengaturan → Atur Bot WhatsApp).
  // DISABLE_WHATSAPP=1 di .env mengunci bot mati (komputer uji, supaya tidak berebut sesi dengan server utama).
  try {
    await initWhatsApp();
  } catch (error) {
    console.error('[Server] Gagal menginisialisasi WhatsApp Bot:', error);
  }

  // Start Announcement Scheduler Service
  try {
    startAnnouncementScheduler();
  } catch (error) {
    console.error('[Server] Gagal mengaktifkan Announcement Scheduler:', error);
  }

  // ─── OTP Cleanup Cron: hapus OTP expired/used setiap 1 jam ────────────────
  setInterval(async () => {
    try {
      const otpModel = prisma.passwordResetOtp || prisma.PasswordResetOtp;
      if (otpModel) {
        const { count } = await otpModel.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: new Date() } }, // sudah expired
              { isUsed: true }                    // sudah digunakan
            ]
          }
        });
        if (count > 0) console.log(`[Cleanup] ${count} OTP kedaluwarsa berhasil dihapus.`);
      }
    } catch (e) {
      // silent — jangan crash server karena cleanup gagal
    }
  }, 60 * 60 * 1000); // setiap 1 jam

  // Start Interactive Terminal Console CLI Listener (/restart, /pull, /status, /help)
  setupConsoleCLI();
});

// Interactive Console CLI System
function setupConsoleCLI() {
  try {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    console.log('\n💡 [Console CLI System Ready]');
    console.log('👉 Ketik "pull" atau "/restart" untuk Git Pull & Auto-Build/Reload.');
    console.log('👉 Ketik "status" atau "/status" untuk cek RAM & WhatsApp Bot.\n');

    rl.on('line', (line) => {
      const input = line.trim().toLowerCase();

      if (
        input === 'pull' || input === '/pull' ||
        input === 'restart' || input === '/restart' ||
        input === 'reload' || input === '/reload'
      ) {
        console.log('\n==================================================');
        console.log('🔄 [Console CLI] Memulai Git Pull & Auto-Reload...');
        console.log('==================================================\n');

        try {
          execSync('git pull origin master', { stdio: 'inherit' });
          console.log('\n✅ Git pull berhasil!');

          const frontendPath = path.join(__dirname, '../frontend');
          if (fs.existsSync(frontendPath)) {
            console.log('📦 Rebuilding frontend bundle...');
            try {
              execSync('npm run build', { cwd: frontendPath, stdio: 'inherit' });
              console.log('✅ Frontend build selesai!');
            } catch (e) {
              console.warn('⚠️ Frontend build warning:', e.message);
            }
          }

          console.log('\n🚀 Memuat ulang server backend...\n');
          process.exit(0);
        } catch (err) {
          console.error('❌ Gagal mengeksekusi git pull / restart:', err.message);
        }
      } else if (input === 'status' || input === '/status') {
        const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const uptimeSec = Math.floor(process.uptime());
        const uptimeMin = (uptimeSec / 60).toFixed(1);
        const waReady = isWhatsAppReady() ? 'CONNECTED ✅' : 'DISCONNECTED ❌';

        console.log('\n📊 === STATUS SISTEM LIVE ===');
        console.log(`⏱️ Uptime: ${uptimeSec} detik (${uptimeMin} menit)`);
        console.log(`💾 RAM Usage: ${ramUsage} MB`);
        console.log(`💬 WhatsApp Bot: ${waReady}`);
        console.log('=============================\n');
      } else if (input === 'help' || input === '/help') {
        console.log('\n📌 === PERINTAH KONSOL TERSEDIA ===');
        console.log('👉 pull / restart / /restart : Git pull otomatis & reload server');
        console.log('👉 status / /status          : Cek RAM, Uptime, dan Status WhatsApp Bot');
        console.log('===================================\n');
      }
    });
  } catch (err) {
    console.warn('[Console CLI] Tidak dapat mengaktifkan stdin listener:', err.message);
  }
}

