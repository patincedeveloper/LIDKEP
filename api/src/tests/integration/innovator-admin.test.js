import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

const suffix = randomUUID();
const innovatorEmail = `phase1-innovator-${suffix}@example.rw`;
const expertEmail = `phase1-expert-${suffix}@example.rw`;
const partnerEmail = `phase1-partner-${suffix}@example.rw`;
const managedEmail = `admin-managed-${suffix}@example.rw`;
const password = 'ValidPassword@123';
const evidenceStorageKeys = [];

describe.sequential('Innovator and System Administrator prototype lifecycle', () => {
  const innovator = request.agent(app);
  const administrator = request.agent(app);
  const expert = request.agent(app);
  const partner = request.agent(app);
  let innovationId;
  let verificationId;
  let innovatorVerificationId;
  let innovatorUserId;
  let assignmentId;
  let engagementId;

  it('registers an Innovator and persists a complete submitted innovation', async () => {
    const registration = await innovator.post('/api/v1/auth/register').send({
      email: innovatorEmail,
      password,
      displayName: 'Phase One Innovator',
      role: 'INNOVATOR'
    });
    expect(registration.status).toBe(201);
    expect(registration.body.data.requiresApproval).toBe(true);
    let verification = await prisma.verificationRequest.findFirst({ where: { user: { email: innovatorEmail } } });
    expect(verification.status).toBe('DRAFT');

    const profile = await innovator.put('/api/v1/users/me/profile').send({
      displayName: 'Phase One Innovator',
      identificationType: 'NATIONAL_ID',
      identificationNumber: '1199880012345678',
      phoneNumber: '+250788123456',
      educationLevel: "Bachelor's degree",
      province: 'City of Kigali',
      district: 'Gasabo',
      administrativeSector: 'Kimironko',
      occupation: 'Water systems technician',
      yearsOfExperience: 4,
      organization: 'Prototype Lab',
      preferredLanguage: 'en',
      publicProfile: true
    });
    expect(profile.status).toBe(200);
    expect(profile.body.data.profileComplete).toBe(true);
    innovatorUserId = profile.body.data.id;
    const submittedProfile = await innovator.post('/api/v1/users/me/profile/submit').send({});
    expect(submittedProfile.status).toBe(200);
    expect(submittedProfile.body.data.approvalStatus).toBe('PENDING_APPROVAL');
    verification = await prisma.verificationRequest.findFirst({ where: { user: { email: innovatorEmail } } });
    innovatorVerificationId = verification.id;
    expect(verification.status).toBe('PENDING_APPROVAL');

    const adminLogin = await administrator.post('/api/v1/auth/login').send({
      email: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD
    });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.data.user.mustChangePassword).toBe(false);
    const prematureApproval = await administrator.post(`/api/v1/admin/verifications/${innovatorVerificationId}/decision`).send({ decision: 'APPROVE' });
    expect(prematureApproval.status).toBe(409);
    expect(prematureApproval.body.error.code).toBe('VERIFICATION_REVIEW_REQUIRED');
    const reviewedApplication = await administrator.get(`/api/v1/admin/verifications/${innovatorVerificationId}`);
    expect(reviewedApplication.status).toBe(200);
    expect(reviewedApplication.body.data.email).toBe(innovatorEmail);
    const approval = await administrator.post(`/api/v1/admin/verifications/${innovatorVerificationId}/decision`).send({
      decision: 'APPROVE'
    });
    expect(approval.status).toBe(200);
    expect((await innovator.get('/api/v1/auth/me')).body.data.user.accountStatus).toBe('ACTIVE');

    const draft = await innovator.post('/api/v1/innovations').send({
      title: 'Phase One Water Monitor',
      ownershipDeclared: true,
      accuracyDeclared: true,
      supportingLinks: [{ title: 'Prototype notes', url: 'https://example.com/water-monitor' }]
    });
    expect(draft.status).toBe(201);
    innovationId = draft.body.data.id;

    const overWordLimit = await innovator.patch(`/api/v1/innovations/${innovationId}`).send({
      problem: Array.from({ length: 51 }, () => 'word').join(' ')
    });
    expect(overWordLimit.status).toBe(422);
    expect(overWordLimit.body.error.fieldErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'body.problem', message: 'Use 50 words or fewer.' })
    ]));

    const incompleteSubmission = await innovator.post(`/api/v1/innovations/${innovationId}/submit`).send({});
    expect(incompleteSubmission.status).toBe(422);
    expect(incompleteSubmission.body.error.code).toBe('INNOVATION_INCOMPLETE');
    expect(incompleteSubmission.body.error.fieldErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'summary' }),
      expect.objectContaining({ field: 'problem' })
    ]));

    const evidenceUpload = await innovator.post(`/api/v1/innovations/${innovationId}/evidence`)
      .field('visibility', 'REVIEW_TEAM')
      .attach('file', Buffer.from('%PDF-1.4 prototype evidence'), { filename: 'prototype-evidence.pdf', contentType: 'application/pdf' });
    expect(evidenceUpload.status).toBe(201);
    expect(evidenceUpload.body.data.name).toBe('prototype-evidence.pdf');
    evidenceStorageKeys.push((await prisma.evidenceFile.findUnique({ where: { id: evidenceUpload.body.data.id } })).storageKey);

    const videoUpload = await innovator.post(`/api/v1/innovations/${innovationId}/evidence`)
      .attach('file', Buffer.from('prototype video'), { filename: 'prototype.mp4', contentType: 'video/mp4' });
    expect(videoUpload.status).toBe(422);
    expect(videoUpload.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');

    const updated = await innovator.patch(`/api/v1/innovations/${innovationId}`).send({
      title: 'Phase One Water Monitor',
      summary: 'A community water quality monitoring prototype.',
      problem: 'Communities need timely visibility into drinking water quality.',
      solution: 'A simple sensor and reporting station records water quality indicators.',
      beneficiaries: 'Community water users and local operators.',
      sector: 'Water & Sanitation',
      category: 'Product innovation',
      district: 'Gasabo',
      maturity: 'M3 Prototype',
      impactArea: 'Health access',
      impact: 'Improved awareness and faster response to water quality risks.',
      novelty: 'Combines low-cost local sensing with a simple community reporting workflow.',
      currentEvidence: 'A bench prototype has completed initial sensor readings.',
      implementationPlan: 'Complete calibration, run a community pilot, and document results over three months.',
      scalability: 'The modular station can be reproduced for other community water points.',
      sustainability: 'Local operators can maintain the station using replaceable standard components.',
      supportNeeded: 'Pilot testing support',
      ownershipDeclared: true,
      accuracyDeclared: true
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.completion).toBe(100);

    const submitted = await innovator.post(`/api/v1/innovations/${innovationId}/submit`).send({});
    expect(submitted.status).toBe(200);
    expect(submitted.body.data.status).toBe('SUBMITTED');

    const lockedEdit = await innovator.patch(`/api/v1/innovations/${innovationId}`).send({ title: 'Not allowed after submission' });
    expect(lockedEdit.status).toBe(409);
    expect(lockedEdit.body.error.code).toBe('INNOVATION_NOT_EDITABLE');
  });

  it('registers an Expert into the System Administrator approval queue', async () => {
    const response = await expert.post('/api/v1/auth/register').send({
      email: expertEmail,
      password,
      displayName: 'Phase One Expert',
      role: 'EXPERT'
    });
    expect(response.status).toBe(201);
    expect(response.body.data.requiresApproval).toBe(true);
    expect((await expert.put('/api/v1/users/me/profile').send({
      displayName: 'Phase One Expert', identificationType: 'NATIONAL_ID', identificationNumber: '1199880012345001',
      phoneNumber: '+250788123457', educationLevel: "Master's degree", province: 'City of Kigali', district: 'Gasabo',
      administrativeSector: 'Kacyiru', occupation: 'Innovation evaluation specialist', yearsOfExperience: 8,
      organization: 'Evaluation Centre', preferredLanguage: 'en', publicProfile: true
    })).status).toBe(200);
    expect((await expert.post('/api/v1/users/me/profile/submit').send({})).status).toBe(200);
    const record = await prisma.verificationRequest.findFirst({ where: { user: { email: expertEmail } } });
    expect(record?.status).toBe('PENDING_APPROVAL');
    verificationId = record.id;
  });

  it('allows the System Administrator to approve and assign the Expert', async () => {
    const reviewedApplication = await administrator.get(`/api/v1/admin/verifications/${verificationId}`);
    expect(reviewedApplication.status).toBe(200);
    expect(reviewedApplication.body.data.name).toBe('Phase One Expert');
    const verification = await administrator.post(`/api/v1/admin/verifications/${verificationId}/decision`).send({
      decision: 'APPROVE'
    });
    expect(verification.status).toBe(200);

    const expertUser = await prisma.user.findUnique({ where: { email: expertEmail } });
    await prisma.innovation.update({ where: { id: innovationId }, data: { status: 'PUBLISHED' } });
    const assigned = await administrator.post(`/api/v1/admin/innovations/${innovationId}/assignments`).send({ expertId: expertUser.id });
    expect(assigned.status).toBe(201);
    assignmentId = assigned.body.data.id;
    expect((await prisma.innovation.findUnique({ where: { id: innovationId } })).status).toBe('PUBLISHED');

    const notification = await prisma.notification.findFirst({
      where: { userId: expertUser.id, type: 'EXPERT_ASSIGNMENT_CREATED', entityId: assignmentId }
    });
    expect(notification?.title).toBe('New innovation review assigned');

    const expertWorkspace = await expert.get('/api/v1/auth/bootstrap');
    expect(expertWorkspace.status).toBe(200);
    expect(expertWorkspace.body.data.assignments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: assignmentId, innovation: 'Phase One Water Monitor' })
    ]));
    expect(expertWorkspace.body.data.notifications).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'EXPERT_ASSIGNMENT_CREATED' })
    ]));

    const duplicate = await administrator.post(`/api/v1/admin/innovations/${innovationId}/assignments`).send({ expertId: expertUser.id });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('INNOVATION_ALREADY_ASSIGNED');
    expect(await prisma.expertAssignment.count({ where: { innovationId } })).toBe(1);
  });

  it('allows the approved Expert to score and submit a recommendation before final publication', async () => {
    const accepted = await expert.post(`/api/v1/reviews/assignments/${assignmentId}/accept`).send({});
    expect(accepted.status).toBe(200);
    const criteria = accepted.body.data.criteria;
    expect(criteria.length).toBeGreaterThan(1);
    const saved = await expert.put(`/api/v1/reviews/assignments/${assignmentId}`).send({
      scores: criteria.map((criterion) => ({ criterionKey: criterion.key, score: 4, comment: 'Evidence supports this criterion.' })),
      rationale: 'The submitted evidence and implementation plan support a positive recommendation.',
      recommendation: 'APPROVE',
      revisionRequests: []
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.review.totalScore).toBe(80);
    const submittedReview = await expert.post(`/api/v1/reviews/assignments/${assignmentId}/submit`).send({});
    expect(submittedReview.status).toBe(200);
    expect(submittedReview.body.data.status).toBe('COMPLETED');

    const approve = await administrator.post(`/api/v1/admin/innovations/${innovationId}/decision`).send({ status: 'APPROVED', reason: 'Expert recommendation and evidence support approval.' });
    expect(approve.status).toBe(200);
    const publish = await administrator.post(`/api/v1/admin/innovations/${innovationId}/decision`).send({ status: 'PUBLISHED', reason: 'Approved record is ready for public discovery.' });
    expect(publish.status).toBe(200);
    const publicRecord = await request(app).get(`/api/v1/public/innovations/${publish.body.data.slug}`);
    expect(publicRecord.status).toBe(200);
    expect(publicRecord.body.data.title).toBe('Phase One Water Monitor');
  });

  it('allows an approved Partner to request collaboration and receive consented contact details', async () => {
    expect((await partner.post('/api/v1/auth/register').send({ email: partnerEmail, password, displayName: 'Phase One Partner', role: 'INVESTOR_PARTNER' })).status).toBe(201);
    expect((await partner.put('/api/v1/users/me/profile').send({
      displayName: 'Phase One Partner', identificationType: 'NATIONAL_ID', identificationNumber: '1199880012345002',
      phoneNumber: '+250788123458', educationLevel: "Bachelor's degree", province: 'City of Kigali', district: 'Gasabo',
      administrativeSector: 'Remera', occupation: 'Investment manager', yearsOfExperience: 6,
      organization: 'Responsible Capital Rwanda', preferredLanguage: 'en', publicProfile: true
    })).status).toBe(200);
    expect((await partner.post('/api/v1/users/me/profile/submit').send({})).status).toBe(200);
    const partnerVerification = await prisma.verificationRequest.findFirst({ where: { user: { email: partnerEmail } } });
    expect((await administrator.get(`/api/v1/admin/verifications/${partnerVerification.id}`)).status).toBe(200);
    expect((await administrator.post(`/api/v1/admin/verifications/${partnerVerification.id}/decision`).send({ decision: 'APPROVE' })).status).toBe(200);

    const created = await partner.post('/api/v1/engagements').send({
      innovationId,
      type: 'FUNDING_OFFER',
      summary: 'We would like to discuss non-binding pilot funding and operational support.',
      termsSummary: 'Initial discussion only; any later agreement will be handled outside LIDKEP.',
      nonBindingAccepted: true
    });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('PENDING');
    engagementId = created.body.data.id;

    const response = await innovator.post(`/api/v1/engagements/${engagementId}/respond`).send({ status: 'ACCEPTED', shareEmail: true, sharePhone: false });
    expect(response.status).toBe(200);
    const opportunities = await partner.get('/api/v1/engagements');
    expect(opportunities.status).toBe(200);
    const accepted = opportunities.body.data.find((item) => item.id === engagementId);
    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.contact.email).toBe(innovatorEmail);
    expect(accepted.contact.phone).toBe('');
  });

  it('allows the System Administrator to CRUD users and innovations', async () => {
    const createdUser = await administrator.post('/api/v1/admin/users').send({
      email: managedEmail,
      password,
      displayName: 'Administrator Managed User',
      role: 'EXPERT',
      status: 'ACTIVE',
      organization: 'LIDKEP Test Office'
    });
    expect(createdUser.status).toBe(201);
    const managedUserId = createdUser.body.data.id;
    expect((await administrator.get(`/api/v1/admin/users/${managedUserId}`)).body.data.organization).toBe('LIDKEP Test Office');
    const updatedUser = await administrator.put(`/api/v1/admin/users/${managedUserId}`).send({
      email: managedEmail,
      displayName: 'Updated Managed User',
      role: 'EXPERT',
      status: 'SUSPENDED',
      organization: 'Updated Office'
    });
    expect(updatedUser.status).toBe(200);
    expect(updatedUser.body.data.name).toBe('Updated Managed User');
    expect(updatedUser.body.data.accountStatus).toBe('SUSPENDED');
    expect((await administrator.delete(`/api/v1/admin/users/${managedUserId}`)).status).toBe(200);
    expect((await administrator.get(`/api/v1/admin/users/${managedUserId}`)).status).toBe(404);

    const createdInnovation = await administrator.post('/api/v1/admin/innovations').send({
      ownerId: innovatorUserId,
      title: 'Administrator Created Draft',
      summary: 'Created for lifecycle verification.'
    });
    expect(createdInnovation.status).toBe(201);
    const managedInnovationId = createdInnovation.body.data.id;
    const updatedInnovation = await administrator.patch(`/api/v1/innovations/${managedInnovationId}`).send({ title: 'Administrator Updated Draft' });
    expect(updatedInnovation.status).toBe(200);
    expect(updatedInnovation.body.data.title).toBe('Administrator Updated Draft');
    expect((await administrator.delete(`/api/v1/admin/innovations/${managedInnovationId}`)).status).toBe(200);
  });
});

afterAll(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL session_replication_role = 'replica'");
    const users = await tx.user.findMany({ where: { email: { in: [innovatorEmail, expertEmail, partnerEmail, managedEmail] } }, select: { id: true } });
    const userIds = users.map((user) => user.id);
    const innovations = await tx.innovation.findMany({ where: { ownerId: { in: userIds } }, select: { id: true } });
    const innovationIds = innovations.map((innovation) => innovation.id);
    const versions = await tx.innovationVersion.findMany({ where: { innovationId: { in: innovationIds } }, select: { id: true } });
    const versionIds = versions.map((version) => version.id);
    const assignments = await tx.expertAssignment.findMany({ where: { versionId: { in: versionIds } }, select: { id: true } });
    const assignmentIds = assignments.map((item) => item.id);
    const reviews = await tx.review.findMany({ where: { assignmentId: { in: assignmentIds } }, select: { id: true } });
    const reviewIds = reviews.map((item) => item.id);
    const engagements = await tx.engagement.findMany({ where: { OR: [{ innovationId: { in: innovationIds } }, { partnerId: { in: userIds } }] }, select: { id: true } });
    const engagementIds = engagements.map((item) => item.id);
    await tx.engagementConsent.deleteMany({ where: { engagementId: { in: engagementIds } } });
    await tx.engagement.deleteMany({ where: { id: { in: engagementIds } } });
    await tx.reviewCriterionScore.deleteMany({ where: { reviewId: { in: reviewIds } } });
    await tx.revisionRequest.deleteMany({ where: { OR: [{ reviewId: { in: reviewIds } }, { versionId: { in: versionIds } }] } });
    await tx.review.deleteMany({ where: { id: { in: reviewIds } } });
    await tx.expertAssignment.deleteMany({ where: { id: { in: assignmentIds } } });
    await tx.evidenceFile.deleteMany({ where: { OR: [{ innovationVersionId: { in: versionIds } }, { uploadedById: { in: userIds } }] } });
    await tx.milestone.deleteMany({ where: { innovationId: { in: innovationIds } } });
    await tx.verificationRequest.deleteMany({ where: { userId: { in: userIds } } });
    await tx.notification.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { entityId: { in: [...userIds, ...innovationIds] } }] } });
    await tx.session.deleteMany({ where: { userId: { in: userIds } } });
    await tx.innovation.updateMany({ where: { id: { in: innovationIds } }, data: { publishedVersionId: null } });
    await tx.innovationVersion.deleteMany({ where: { id: { in: versionIds } } });
    await tx.innovation.deleteMany({ where: { id: { in: innovationIds } } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });
  await Promise.all(evidenceStorageKeys.map((storageKey) => unlink(path.resolve(process.env.UPLOAD_DIR ?? 'api/uploads', storageKey)).catch(() => {})));
});
