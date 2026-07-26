import { describe, expect, it } from 'vitest';
import { parseEnvironment } from '../../config/env.js';

describe('environment validation', () => {
  it('parses valid production configuration', () => {
    const result = parseEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/lidkep',
      ENABLE_DEMO_ROUTES: 'false'
    });
    expect(result.NODE_ENV).toBe('production');
    expect(result.ENABLE_DEMO_ROUTES).toBe(false);
  });

  it('supports an exact trusted proxy hop count', () => {
    const result = parseEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/lidkep',
      TRUST_PROXY: '1'
    });
    expect(result.TRUST_PROXY).toBe(1);
  });

  it('fails early when DATABASE_URL is missing', () => {
    expect(() => parseEnvironment({ NODE_ENV: 'production' })).toThrow('DATABASE_URL');
  });
});
