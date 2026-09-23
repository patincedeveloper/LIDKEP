import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

const createdEmails = [];
const evidenceStorageKeys = [];

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

  it('registers a real Innovator with an immediate active session', async () => {
    const agent = request.agent(app);
    const email = `test-${randomUUID()}@example.rw`;
    const registered = await agent.post('/api/v1/auth/register').send({
      email,
      password: 'ValidPassword@123',
      displayName: 'Integration User',
      role: 'INNOVATOR'
    });
    expect(registered.status).toBe(201);
    createdEmails.push(email);
    expect(registered.body.data.user.email).toBe(email);
    expect(registered.body.data.requiresApproval).toBe(false);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.approvalStatus).toBe('APPROVED');
    expect(me.body.data.user.accountStatus).toBe('ACTIVE');
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

  it('requires an uploaded document for other government-issued identification', async () => {
    const agent = request.agent(app);
    const email = `other-id-${randomUUID()}@example.rw`;
    const registered = await agent.post('/api/v1/auth/register').send({
      email,
      password: 'ValidPassword@123',
      displayName: 'Other Document User',
      role: 'EXPERT'
    });
    expect(registered.status).toBe(201);
    createdEmails.push(email);

    const profile = await agent.put('/api/v1/users/me/profile').send({
      displayName: 'Other Document User',
      identificationType: 'OTHER_GOVERNMENT_ID',
      identificationNumber: 'GOV/ABC-123',
      phoneNumber: '0788123499',
      educationLevel: "Bachelor's degree",
      province: 'City of Kigali',
      district: 'Gasabo',
      administrativeSector: 'Kimironko',
      occupation: 'Technical specialist',
      yearsOfExperience: 3,
      organization: '',
      preferredLanguage: 'en',
      publicProfile: false
    });
    expect(profile.status).toBe(200);

    const missingDocument = await agent.post('/api/v1/users/me/profile/submit').send({});
    expect(missingDocument.status).toBe(422);
    expect(missingDocument.body.error.code).toBe('IDENTIFICATION_DOCUMENT_REQUIRED');

    const uploaded = await agent.post('/api/v1/users/me/profile/evidence')
      .attach('file', Buffer.from('government identification image'), {
        filename: 'government-id.jpg',
        contentType: 'image/jpeg'
      });
    expect(uploaded.status).toBe(201);
    evidenceStorageKeys.push((await prisma.evidenceFile.findUnique({ where: { id: uploaded.body.data.id } })).storageKey);

    const savedProfile = await agent.get('/api/v1/users/me/profile');
    expect(savedProfile.body.data.identificationDocuments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: uploaded.body.data.id, name: 'government-id.jpg' })
    ]));
    expect((await agent.get(`/api/v1/users/profile/evidence/${uploaded.body.data.id}/download`)).status).toBe(200);
    expect((await agent.post('/api/v1/users/me/profile/submit').send({})).status).toBe(200);

    const duplicateAgent = request.agent(app);
    const duplicateEmail = `duplicate-identity-${randomUUID()}@example.rw`;
    expect((await duplicateAgent.post('/api/v1/auth/register').send({
      email: duplicateEmail,
      password: 'ValidPassword@123',
      displayName: 'Duplicate Check User',
      role: 'EXPERT'
    })).status).toBe(201);
    createdEmails.push(duplicateEmail);
    const duplicateBase = {
      displayName: 'Duplicate Check User',
      identificationType: 'OTHER_GOVERNMENT_ID',
      educationLevel: "Bachelor's degree",
      province: 'City of Kigali',
      district: 'Gasabo',
      administrativeSector: 'Kimironko',
      occupation: 'Technical specialist',
      yearsOfExperience: 2,
      organization: '',
      preferredLanguage: 'en',
      publicProfile: false
    };
    const duplicateId = await duplicateAgent.put('/api/v1/users/me/profile').send({
      ...duplicateBase,
      identificationNumber: 'gov/abc-123',
      phoneNumber: '0788123498'
    });
    expect(duplicateId.status).toBe(409);
    expect(duplicateId.body.error.code).toBe('IDENTIFICATION_NUMBER_ALREADY_USED');
    expect(duplicateId.body.error.fieldErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'identificationNumber' })
    ]));

    const duplicatePhone = await duplicateAgent.put('/api/v1/users/me/profile').send({
      ...duplicateBase,
      identificationNumber: 'GOV/UNIQUE-456',
      phoneNumber: '+250788123499'
    });
    expect(duplicatePhone.status).toBe(409);
    expect(duplicatePhone.body.error.code).toBe('PHONE_NUMBER_ALREADY_USED');
    expect(duplicatePhone.body.error.fieldErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'phoneNumber' })
    ]));
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

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica'");
    const users = await tx.user.findMany({ where: { email: { in: createdEmails } }, select: { id: true } });
    const ids = users.map((user) => user.id);
    await tx.verificationRequest.deleteMany({ where: { userId: { in: ids } } });
    await tx.notification.deleteMany({ where: { OR: [{ userId: { in: ids } }, { entityId: { in: ids } }] } });
    await tx.session.deleteMany({ where: { userId: { in: ids } } });
    await tx.userProfile.deleteMany({ where: { userId: { in: ids } } });
    await tx.user.deleteMany({ where: { email: { in: createdEmails } } });
  });
  await Promise.all(evidenceStorageKeys.map((storageKey) =>
    unlink(path.resolve(process.env.UPLOAD_DIR ?? 'api/uploads', storageKey)).catch(() => {})
  ));
});
