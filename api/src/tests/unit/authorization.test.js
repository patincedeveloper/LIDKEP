import { describe, expect, it, vi } from 'vitest';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

describe('access middleware foundation', () => {
  it('rejects unauthenticated requests', async () => {
    const next = vi.fn();
    await authenticate({}, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, code: 'AUTHENTICATION_REQUIRED' });
  });

  it('rejects a forbidden role', () => {
    const next = vi.fn();
    authorize('SYSTEM_ADMINISTRATOR')({ user: { role: 'INNOVATOR' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
