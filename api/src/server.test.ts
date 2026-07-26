import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from './server';

describe('public discovery smoke test', () => {
  it('returns published innovations only', async () => {
    const response = await request(app).get('/api/v1/public/innovations');
    expect(response.status).toBe(200);
    expect(response.body.data.every((item: { status: string }) => item.status === 'PUBLISHED')).toBe(true);
  });
  it('serves stable public innovation detail links and hides unpublished records', async () => {
    const published = await request(app).get('/api/v1/public/innovations/solar-cold-chain-for-small-farms');
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe('PUBLISHED');
    const unpublished = await request(app).get('/api/v1/public/innovations/smart-irrigation-valve');
    expect(unpublished.status).toBe(404);
    expect(unpublished.body.error.code).toBe('INNOVATION_NOT_FOUND');
  });
  it('validates demo workflow actions', async () => {
    const invalid = await request(app).post('/api/v1/demo/actions').send({ action: '', entityId: '' });
    expect(invalid.status).toBe(422);
    const valid = await request(app).post('/api/v1/demo/actions').send({ action: 'SAVE_DRAFT', entityId: 'water-kiosk' });
    expect(valid.status).toBe(201);
    expect(valid.body.data.persisted).toBe(false);
  });
});
