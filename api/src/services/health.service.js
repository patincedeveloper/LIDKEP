import { prisma } from '../config/database.js';

export async function checkHealth() {
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'ok', database: 'postgresql' };
}
