import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/src/tests/**/*.test.js'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://lidkep_app:DemoTest%40123@localhost:5434/lidkep',
      ENABLE_DEMO_ROUTES: 'false',
      COOKIE_SECURE: 'false',
      LOG_LEVEL: 'silent',
      RATE_LIMIT_MAX: '1000'
    }
  }
});
