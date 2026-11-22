import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.pushSubscription.count();
  console.log('Push subscriptions count in DB:', count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
