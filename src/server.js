import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import prisma, { initDatabase } from './config/db.js';
import adminRoutes from './routes/admin.js';
import candidateRoutes from './routes/candidates.js';
import blogRoutes from './routes/blog.js';
import { initWhatsApp } from './services/whatsapp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 25552;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:25553';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:25553', 'https://pikr-manseku.my.id'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/blog', blogRoutes);

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
      update: {},
      create: {
        username: defaultUsername,
        password: hashedPassword
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

// Start Server
app.listen(PORT, async () => {
  // Initialize Database before queries run
  await initDatabase();

  console.log(`[Server] PIK-R MANSEKU Backend berjalan di port ${PORT}`);
  console.log(`[Server] Mengizinkan CORS dari origin: ${FRONTEND_URL}`);
  
  // Seed admin if necessary
  await seedDefaultAdmin();
  
  // Initialize WhatsApp Bot service in the background
  try {
    console.log('[Server] Menghubungkan ke WhatsApp Web...');
    await initWhatsApp();
  } catch (error) {
    console.error('[Server] Gagal menginisialisasi WhatsApp Bot:', error);
  }
});
