import { PrismaClient } from '@prisma/client';

let prismaInstance = null;

export async function initDatabase() {
  console.log('[Database] Menginisialisasi koneksi database SQLite lokal (local.db)...');

  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }

  try {
    await prismaInstance.$queryRaw`SELECT 1`;
    // Aktifkan mode WAL & busy_timeout untuk konkurensi produksi tinggi
    await prismaInstance.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prismaInstance.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
    await prismaInstance.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
    console.log('[Database] Koneksi SQLite BERHASIL (WAL mode & busy_timeout=5000 aktif)! Database aktif: local.db.');
  } catch (error) {
    console.error('[Database] Gagal menginisialisasi SQLite:', error.message);
  }

  return { prisma: prismaInstance, provider: 'sqlite' };
}

export function getDbProvider() {
  return 'sqlite';
}

// Proxy for dynamic access to initialized Prisma instance
const prisma = new Proxy({}, {
  get(target, prop) {
    if (!prismaInstance) {
      prismaInstance = new PrismaClient();
    }
    return prismaInstance[prop];
  }
});

export default prisma;
