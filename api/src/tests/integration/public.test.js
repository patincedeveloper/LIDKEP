import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../app.js';

describe('Phase 1 API foundation', () => {
  it('returns published innovations with the standard envelope', async () => {
    const response = await request(app).get('/api/v1/public/innovations?page=1&pageSize=2');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((item) => item.status === 'PUBLISHED')).toBe(true);
    expect(response.body.meta).toMatchObject({ total: 3, page: 1, pageSize: 2 });
    expect(response.body.meta.requestId).toBe(response.headers['x-request-id']);
  });

  it('rejects invalid query input without exposing internals', async () => {
    const response = await request(app).get('/api/v1/public/innovations?page=0&unexpected=true');
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
    expect(response.body.error).not.toHaveProperty('stack');
  });

  it('serves published detail and hides unpublished records', async () => {
    const published = await request(app).get('/api/v1/public/innovations/solar-cold-chain-for-small-farms');
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe('PUBLISHED');

    const unpublished = await request(app).get('/api/v1/public/innovations/smart-irrigation-valve');
    expect(unpublished.status).toBe(404);
    expect(unpublished.body.error.code).toBe('INNOVATION_NOT_FOUND');
  });

  it('preserves the development bootstrap contract', async () => {
    const response = await request(app).get('/api/v1/demo/bootstrap');
    expect(response.status).toBe(200);
    expect(response.body.data.roles).toHaveLength(5);
  });

  it('validates demo actions and records no persistence claim', async () => {
    const invalid = await request(app).post('/api/v1/demo/actions').send({ action: '', entityId: '' });
    expect(invalid.status).toBe(422);

    const valid = await request(app).post('/api/v1/demo/actions').send({ action: 'SAVE_DRAFT', entityId: 'water-kiosk' });
    expect(valid.status).toBe(201);
    expect(valid.body.data.persisted).toBe(false);
  });

  it('returns the standard not-found error', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
