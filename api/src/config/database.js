import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// A single client owns the process connection pool. Creating one per request leaks connections.
export const prisma = new PrismaClient({ adapter });

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
