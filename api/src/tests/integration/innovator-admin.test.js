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
const criteriaVersionLabel = `test-${suffix.slice(0, 8)}`;
const password = 'ValidPassword@123';
const narrative = (topic, count = 30) => Array.from(
  { length: count },
  (_, index) => `${topic}${index + 1}`
).join(' ');
const evidenceStorageKeys = [];
let originalCriteriaId;
let testCriteriaId;

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
  let reviewEvidenceId;
  let publicEvidenceId;

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

    const underWordLimit = await innovator.patch(`/api/v1/innovations/${innovationId}`).send({
      problem: narrative('problem', 29)
    });
    expect(underWordLimit.status).toBe(422);
    expect(underWordLimit.body.error.fieldErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'body.problem', message: 'Use at least 30 words.' })
    ]));
    const overWordLimit = await innovator.patch(`/api/v1/innovations/${innovationId}`).send({
      problem: narrative('problem', 1001)
    });
    expect(overWordLimit.status).toBe(422);
    expect(overWordLimit.body.error.fieldErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'body.problem', message: 'Use 1,000 words or fewer.' })
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
    reviewEvidenceId = evidenceUpload.body.data.id;
    evidenceStorageKeys.push((await prisma.evidenceFile.findUnique({ where: { id: evidenceUpload.body.data.id } })).storageKey);

    const publicEvidenceUpload = await innovator.post(`/api/v1/innovations/${innovationId}/evidence`)
      .field('visibility', 'PUBLIC')
      .attach('file', Buffer.from('%PDF-1.4 public prototype summary'), { filename: 'public-prototype-summary.pdf', contentType: 'application/pdf' });
    expect(publicEvidenceUpload.status).toBe(201);
    publicEvidenceId = publicEvidenceUpload.body.data.id;
    evidenceStorageKeys.push((await prisma.evidenceFile.findUnique({ where: { id: publicEvidenceId } })).storageKey);

    const videoUpload = await innovator.post(`/api/v1/innovations/${innovationId}/evidence`)
      .attach('file', Buffer.from('prototype video'), { filename: 'prototype.mp4', contentType: 'video/mp4' });
    expect(videoUpload.status).toBe(422);
    expect(videoUpload.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');

    const updated = await innovator.patch(`/api/v1/innovations/${innovationId}`).send({
      title: 'Phase One Water Monitor',
      summary: narrative('summary'),
      problem: narrative('problem'),
      solution: narrative('solution'),
      beneficiaries: narrative('beneficiary'),
      sector: 'Water & Sanitation',
      category: 'Product innovation',
      district: 'District',
      maturity: 'M3 Prototype',
      impactArea: 'Health access',
      impact: narrative('impact'),
      novelty: narrative('novelty'),
      currentEvidence: narrative('evidence'),
      implementationPlan: narrative('implementation'),
      scalability: narrative('scalability'),
      sustainability: narrative('sustainability'),
      supportNeeded: narrative('support'),
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
  }, 30000);

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

  it('allows the System Administrator to create and switch the active criteria version', async () => {
    const before = await administrator.get('/api/v1/admin/criteria');
    expect(before.status).toBe(200);
    originalCriteriaId = before.body.data.find((item) => item.status === 'ACTIVE')?.id;
    expect(originalCriteriaId).toBeTruthy();

    const created = await administrator.post('/api/v1/admin/criteria').send({
      version: criteriaVersionLabel,
      name: 'Lifecycle test evaluation',
      criteria: [
        { name: 'Need and relevance', guidance: 'Assess the evidenced need.', weight: 40 },
        { name: 'Delivery feasibility', guidance: 'Assess delivery readiness.', weight: 35 },
        { name: 'Expected impact', guidance: 'Assess likely beneficiary outcomes.', weight: 25 }
      ]
    });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('DRAFT');
    expect(created.body.data.criteria).toHaveLength(3);
    testCriteriaId = created.body.data.id;

    const activated = await administrator.post(`/api/v1/admin/criteria/${testCriteriaId}/activate`).send({});
    expect(activated.status).toBe(200);
    expect(activated.body.data.status).toBe('ACTIVE');
    expect((await prisma.evaluationCriteriaVersion.findUnique({ where: { id: originalCriteriaId } })).status).toBe('RETIRED');
    expect(await prisma.evaluationCriteriaVersion.count({ where: { status: 'ACTIVE' } })).toBe(1);
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
    const prematureAssignment = await administrator.post(`/api/v1/admin/innovations/${innovationId}/assignments`).send({ expertId: expertUser.id });
    expect(prematureAssignment.status).toBe(409);
    expect(prematureAssignment.body.error.code).toBe('INNOVATION_REVIEW_REQUIRED');

    const reviewedInnovation = await administrator.get(`/api/v1/admin/innovations/${innovationId}`);
    expect(reviewedInnovation.status).toBe(200);
    expect(reviewedInnovation.body.data.administratorReviewedAt).not.toBe('');
    const assigned = await administrator.post(`/api/v1/admin/innovations/${innovationId}/assignments`).send({ expertId: expertUser.id });
    expect(assigned.status).toBe(201);
    assignmentId = assigned.body.data.id;
    expect((await prisma.innovation.findUnique({ where: { id: innovationId } })).status).toBe('UNDER_REVIEW');
    expect((await prisma.review.findFirst({ where: { assignmentId } })).criteriaVersionId).toBe(testCriteriaId);

    const switched = await administrator.post(`/api/v1/admin/criteria/${originalCriteriaId}/activate`).send({});
    expect(switched.status).toBe(200);
    expect(switched.body.data.status).toBe('ACTIVE');
    expect(await prisma.evaluationCriteriaVersion.count({ where: { status: 'ACTIVE' } })).toBe(1);

    const notification = await prisma.notification.findFirst({
      where: { userId: expertUser.id, type: 'EXPERT_ASSIGNMENT_CREATED', entityId: assignmentId }
    });
    expect(notification?.title).toBe('New innovation review assigned');

    const expertWorkspace = await expert.get('/api/v1/auth/bootstrap');
    expect(expertWorkspace.status).toBe(200);
    expect(expertWorkspace.body.data.assignments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: assignmentId, innovation: 'Phase One Water Monitor', status: 'ASSIGNED' })
    ]));
    expect(expertWorkspace.body.data.assignments.find((item) => item.id === assignmentId).criteria).toHaveLength(3);
    const expertAssignment = expertWorkspace.body.data.assignments.find((item) => item.id === assignmentId);
    expect(expertAssignment.supportingLinks).toEqual([
      { title: 'Prototype notes', url: 'https://example.com/water-monitor' }
    ]);
    expect(expertAssignment.evidence.map((file) => file.id)).toEqual(expect.arrayContaining([reviewEvidenceId, publicEvidenceId]));
    expect((await expert.get(`/api/v1/innovations/${innovationId}/evidence/${reviewEvidenceId}/download`)).status).toBe(200);
    expect(expertWorkspace.body.data.notifications).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'EXPERT_ASSIGNMENT_CREATED', actionPath: `/expert/assignments/${assignmentId}` })
    ]));
    const assignmentNotification = expertWorkspace.body.data.notifications.find((item) => item.type === 'EXPERT_ASSIGNMENT_CREATED');
    expect((await expert.post(`/api/v1/users/me/notifications/${assignmentNotification.id}/read`).send({})).status).toBe(200);
    expect((await expert.get('/api/v1/auth/bootstrap')).body.data.notifications.find((item) => item.id === assignmentNotification.id).read).toBe(true);

    const duplicate = await administrator.post(`/api/v1/admin/innovations/${innovationId}/assignments`).send({ expertId: expertUser.id });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('INNOVATION_ALREADY_ASSIGNED');
    expect(await prisma.expertAssignment.count({ where: { innovationId } })).toBe(1);
  });

  it('supports revision and approval rounds without assignment acceptance or an administrator publication decision', async () => {
    expect((await expert.post(`/api/v1/reviews/assignments/${assignmentId}/accept`).send({})).status).toBe(404);
    const opened = await expert.get(`/api/v1/reviews/assignments/${assignmentId}`);
    expect(opened.status).toBe(200);
    const criteria = opened.body.data.criteria;
    expect(criteria.length).toBeGreaterThan(1);
    const rejected = await expert.put(`/api/v1/reviews/assignments/${assignmentId}`).send({
      scores: criteria.map((criterion) => ({ criterionKey: criterion.key, score: 2, comment: 'More evidence is needed.' })),
      rationale: 'This legacy rejection choice must not be accepted.',
      recommendation: 'REJECT',
      revisionRequests: []
    });
    expect(rejected.status).toBe(422);

    const savedRevision = await expert.put(`/api/v1/reviews/assignments/${assignmentId}`).send({
      scores: criteria.map((criterion) => ({ criterionKey: criterion.key, score: 3, comment: 'Improve the implementation evidence.' })),
      rationale: 'The solution is promising but the implementation plan needs a clearer pilot sequence.',
      recommendation: 'REVISION_REQUIRED',
      revisionRequests: [{ fieldKey: 'implementationPlan', instruction: 'Describe the pilot sequence and measurement checkpoints.' }]
    });
    expect(savedRevision.status).toBe(200);
    expect(savedRevision.body.data.review.totalScore).toBe(60);
    const submittedRevision = await expert.post(`/api/v1/reviews/assignments/${assignmentId}/submit`).send({});
    expect(submittedRevision.status).toBe(200);
    expect(submittedRevision.body.data.status).toBe('REVISION_REQUESTED');
    expect((await prisma.innovation.findUnique({ where: { id: innovationId } })).status).toBe('REVISION_REQUIRED');

    const feedback = await innovator.get('/api/v1/innovations/feedback');
    expect(feedback.status).toBe(200);
    expect(feedback.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ innovationId, rounds: [expect.objectContaining({ recommendation: 'REVISION_REQUIRED', version: 1 })] })
    ]));

    expect((await innovator.patch(`/api/v1/innovations/${innovationId}`).send({
      implementationPlan: narrative('revised-implementation')
    })).status).toBe(200);
    const resubmitted = await innovator.post(`/api/v1/innovations/${innovationId}/submit`).send({});
    expect(resubmitted.status).toBe(200);
    expect(resubmitted.body.data.status).toBe('UNDER_REVIEW');
    expect(resubmitted.body.data.version).toBe(2);
    expect(await prisma.expertAssignment.count({ where: { innovationId } })).toBe(1);
    expect(await prisma.review.count({ where: { assignmentId } })).toBe(2);
    expect(new Set((await prisma.review.findMany({ where: { assignmentId } })).map((review) => review.criteriaVersionId))).toEqual(new Set([testCriteriaId]));
    expect(await prisma.revisionRequest.count({ where: { review: { assignmentId }, status: 'RESOLVED' } })).toBe(1);

    const reopened = await expert.get(`/api/v1/reviews/assignments/${assignmentId}`);
    expect(reopened.body.data.status).toBe('ASSIGNED');
    expect(reopened.body.data.version).toBe(2);
    expect(reopened.body.data.reviewHistory).toHaveLength(1);
    const revisedCriteria = reopened.body.data.criteria;
    const saved = await expert.put(`/api/v1/reviews/assignments/${assignmentId}`).send({
      scores: revisedCriteria.map((criterion) => ({ criterionKey: criterion.key, score: 4, comment: 'The revised evidence supports this criterion.' })),
      rationale: 'The submitted evidence and implementation plan support a positive recommendation.',
      recommendation: 'APPROVE',
      revisionRequests: []
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.review.totalScore).toBe(80);
    const submittedReview = await expert.post(`/api/v1/reviews/assignments/${assignmentId}/submit`).send({});
    expect(submittedReview.status).toBe(200);
    expect(submittedReview.body.data.status).toBe('COMPLETED');
    const published = await prisma.innovation.findUnique({ where: { id: innovationId }, include: { publishedVersion: true } });
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedVersion.versionNumber).toBe(2);
    expect((await administrator.post(`/api/v1/admin/innovations/${innovationId}/decision`).send({ status: 'PUBLISHED' })).status).toBe(404);
    const publicRecord = await request(app).get(`/api/v1/public/innovations/${published.slug}`);
    expect(publicRecord.status).toBe(200);
    expect(publicRecord.body.data.title).toBe('Phase One Water Monitor');
    expect(publicRecord.body.data.supportingLinks).toEqual([
      { title: 'Prototype notes', url: 'https://example.com/water-monitor' }
    ]);
    expect(publicRecord.body.data.evidence.map((file) => file.id)).toEqual([publicEvidenceId]);
    expect((await request(app).get(`/api/v1/public/innovations/${published.slug}/evidence/${publicEvidenceId}/download`)).status).toBe(200);
    expect((await request(app).get(`/api/v1/public/innovations/${published.slug}/evidence/${reviewEvidenceId}/download`)).status).toBe(404);
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

    const partnerWorkspace = await partner.get('/api/v1/auth/bootstrap');
    const partnerInnovation = partnerWorkspace.body.data.innovations.find((item) => item.id === innovationId);
    expect(partnerInnovation.supportingLinks).toEqual([
      { title: 'Prototype notes', url: 'https://example.com/water-monitor' }
    ]);
    expect(partnerInnovation.evidence.map((file) => file.id)).toEqual([publicEvidenceId]);

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

    const response = await innovator.post(`/api/v1/engagements/${engagementId}/respond`).send({ status: 'ACCEPTED' });
    expect(response.status).toBe(200);
    const opportunities = await partner.get('/api/v1/engagements');
    expect(opportunities.status).toBe(200);
    const accepted = opportunities.body.data.find((item) => item.id === engagementId);
    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.contact.email).toBe(innovatorEmail);
    expect(accepted.contact.phone).toBe('+250788123456');

    const repeatedAfterAcceptance = await partner.post('/api/v1/engagements').send({
      innovationId,
      type: 'CONTACT',
      summary: 'This second request must remain blocked after acceptance.',
      nonBindingAccepted: true
    });
    expect(repeatedAfterAcceptance.status).toBe(409);
    expect(repeatedAfterAcceptance.body.error.code).toBe('ENGAGEMENT_ALREADY_REQUESTED');

    await prisma.engagement.update({ where: { id: engagementId }, data: { status: 'DECLINED' } });
    const repeatedAfterDecline = await partner.post('/api/v1/engagements').send({
      innovationId,
      type: 'PARTNERSHIP_REQUEST',
      summary: 'This second request must remain blocked after a decline.',
      nonBindingAccepted: true
    });
    expect(repeatedAfterDecline.status).toBe(409);
    expect(repeatedAfterDecline.body.error.code).toBe('ENGAGEMENT_ALREADY_REQUESTED');
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
      summary: narrative('admin-summary')
    });
    expect(createdInnovation.status).toBe(201);
    const managedInnovationId = createdInnovation.body.data.id;
    const updatedInnovation = await administrator.patch(`/api/v1/innovations/${managedInnovationId}`).send({ title: 'Administrator Updated Draft' });
    expect(updatedInnovation.status).toBe(200);
    expect(updatedInnovation.body.data.title).toBe('Administrator Updated Draft');

    await prisma.innovationVersion.update({
      where: { id: createdInnovation.body.data.versionId },
      data: { submittedAt: new Date(), immutableAt: new Date() }
    });
    await prisma.innovation.update({ where: { id: managedInnovationId }, data: { status: 'SUBMITTED' } });

    await expect(prisma.innovationVersion.delete({
      where: { id: createdInnovation.body.data.versionId }
    })).rejects.toThrow('submitted innovation versions are immutable');

    expect((await administrator.delete(`/api/v1/admin/innovations/${managedInnovationId}`)).status).toBe(200);
    expect(await prisma.innovation.findUnique({ where: { id: managedInnovationId } })).toBeNull();
    expect(await prisma.innovationVersion.findUnique({ where: { id: createdInnovation.body.data.versionId } })).toBeNull();
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
    if (originalCriteriaId) {
      await tx.evaluationCriteriaVersion.updateMany({
        where: { status: 'ACTIVE', id: { not: originalCriteriaId } },
        data: { status: 'RETIRED', retiredAt: new Date() }
      });
      await tx.evaluationCriteriaVersion.update({
        where: { id: originalCriteriaId },
        data: { status: 'ACTIVE', activatedAt: new Date(), retiredAt: null }
      });
    }
    if (testCriteriaId) await tx.evaluationCriteriaVersion.deleteMany({ where: { id: testCriteriaId } });
    await tx.evidenceFile.deleteMany({ where: { OR: [{ innovationVersionId: { in: versionIds } }, { uploadedById: { in: userIds } }] } });
    await tx.milestone.deleteMany({ where: { innovationId: { in: innovationIds } } });
    await tx.verificationRequest.deleteMany({ where: { userId: { in: userIds } } });
    await tx.notification.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { entityId: { in: [...userIds, ...innovationIds] } }] } });
    await tx.session.deleteMany({ where: { userId: { in: userIds } } });
    await tx.innovationAdministratorReview.deleteMany({ where: { OR: [{ innovationId: { in: innovationIds } }, { versionId: { in: versionIds } }] } });
    await tx.innovation.updateMany({ where: { id: { in: innovationIds } }, data: { publishedVersionId: null } });
    await tx.innovationVersion.deleteMany({ where: { id: { in: versionIds } } });
    await tx.innovation.deleteMany({ where: { id: { in: innovationIds } } });
    await tx.userProfile.deleteMany({ where: { userId: { in: userIds } } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });
  await Promise.all(evidenceStorageKeys.map((storageKey) => unlink(path.resolve(process.env.UPLOAD_DIR ?? 'api/uploads', storageKey)).catch(() => {})));
});
