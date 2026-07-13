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
import publicRoutes from './routes/public.js';
import { initWhatsApp } from './services/whatsapp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 25552;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:25551';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:25551', 'https://pikr-manseku.my.id'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads/photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded photos as static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/public', publicRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PIK-R MANSEKU API is running smoothly' });
});

// Helper function to seed default admin
async function seedDefaultAdmin() {
  try {
    const defaultUsername = 'pikrmanseku01';
    const defaultPassword = 'pikrmanseku1me';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Clean up old temporary 'admin' account if it exists
    try {
      const oldAdmin = await prisma.admin.findUnique({ where: { username: 'admin' } });
      if (oldAdmin) {
        await prisma.admin.delete({ where: { username: 'admin' } });
        console.log('Removed temporary admin account.');
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
    console.log(`Password: ${defaultPassword}`);
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
  
  // Initialize WhatsApp Bot service in the background
  try {
    console.log('[Server] Menghubungkan ke WhatsApp Web...');
    await initWhatsApp();
  } catch (error) {
    console.error('[Server] Gagal menginisialisasi WhatsApp Bot:', error);
  }
});
