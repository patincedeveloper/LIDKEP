import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/src/tests/**/*.test.js'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/lidkep_test',
      ENABLE_DEMO_ROUTES: 'true',
      LOG_LEVEL: 'silent',
      RATE_LIMIT_MAX: '1000'
    }
  }
});
