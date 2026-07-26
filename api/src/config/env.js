import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');
const trustProxyFromString = z.string()
  .regex(/^(true|false|[0-9]|10)$/)
  .transform((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Number(value);
  });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  TEST_DATABASE_URL: z.string().url().startsWith('postgresql://').optional(),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  TRUST_PROXY: trustProxyFromString.default('false'),
  JSON_BODY_LIMIT: z.string().regex(/^\d+(kb|mb)$/i).default('1mb'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  ENABLE_DEMO_ROUTES: booleanFromString.default('false'),
  SESSION_COOKIE_NAME: z.string().regex(/^[a-zA-Z0-9_-]+$/).default('lidkep_session'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
  SESSION_IDLE_HOURS: z.coerce.number().int().min(1).max(168).default(24),
  COOKIE_SECURE: booleanFromString.default('true'),
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(12).optional(),
  INITIAL_INNOVATOR_EMAIL: z.string().email().optional(),
  INITIAL_INNOVATOR_PASSWORD: z.string().min(12).optional()
});

/**
 * Validates process configuration once at startup so configuration failures do not
 * surface later as misleading database or network errors.
 */
export function parseEnvironment(source = process.env) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return {
    ...parsed.data,
    corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  };
}

export const env = parseEnvironment();
