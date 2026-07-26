import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../app.js';

describe('real platform identity and public API', () => {
  it('returns database-backed public bootstrap data', async () => {
    const response = await request(app).get('/api/v1/public/bootstrap');
    expect(response.status).toBe(200);
    expect(response.body.data.innovations).toEqual(expect.any(Array));
    expect(response.body.data.taxonomies.sectors.length).toBeGreaterThan(0);
    expect(response.body.meta.requestId).toBe(response.headers['x-request-id']);
  });

  it('does not expose removed demo routes', async () => {
    const response = await request(app).get('/api/v1/demo/bootstrap');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('registers, authenticates, and logs out a real public user', async () => {
    const agent = request.agent(app);
    const email = `test-${randomUUID()}@example.rw`;
    const registered = await agent.post('/api/v1/auth/register').send({
      email,
      password: 'ValidPassword@123',
      displayName: 'Integration User',
      role: 'PUBLIC_USER'
    });
    expect(registered.status).toBe(201);
    expect(registered.body.data.user.email).toBe(email);
    expect(registered.body.data.requiresApproval).toBe(false);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.role).toBe('PUBLIC_USER');

    const logout = await agent.post('/api/v1/auth/logout').send({});
    expect(logout.status).toBe(200);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });

  it('rejects weak registration passwords', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'weak@example.rw',
      password: 'password',
      displayName: 'Weak Password',
      role: 'INNOVATOR'
    });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid credentials without revealing whether an email exists', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: `missing-${randomUUID()}@example.rw`,
      password: 'WrongPassword@123'
    });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
