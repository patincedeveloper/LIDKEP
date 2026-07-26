import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'api/prisma/schema.prisma',
  migrations: {
    path: 'api/prisma/migrations',
    seed: 'node api/prisma/seed.js'
  },
  datasource: {
    // Prisma commands can validate/generate without a local .env; migrations still require a real URL.
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/lidkep'
  }
});
