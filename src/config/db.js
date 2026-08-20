import { PrismaClient } from '@prisma/client';

let prismaInstance = null;

export async function initDatabase() {
  console.log('[Database] Menginisialisasi koneksi database SQLite lokal (local.db)...');

  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }

  try {
    await prismaInstance.$queryRaw`SELECT 1`;
    console.log('[Database] Koneksi SQLite BERHASIL! Database aktif: local.db.');
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
