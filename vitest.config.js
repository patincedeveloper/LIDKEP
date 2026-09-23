import { defineConfig } from "vitest/config";
import "dotenv/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 15000,
    include: ["api/src/tests/**/*.test.js"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL,
      ENABLE_DEMO_ROUTES: "false",
      COOKIE_SECURE: "false",
      LOG_LEVEL: "silent",
      RATE_LIMIT_MAX: "1000",
    },
  },
});
