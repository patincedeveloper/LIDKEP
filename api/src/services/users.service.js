import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../config/database.js';
import { serializeUser } from './auth.service.js';
import { getPublicBootstrap, serializeInnovation } from './public.service.js';
import { usersRepository } from '../repositories/users.repository.js';
import { serializeWorkspaceInnovation } from './innovations.service.js';
import { AppError } from '../lib/http.js';
import { isProfileComplete } from './auth.service.js';
import { listAssignments } from './reviews.service.js';
import { listEngagements } from './engagements.service.js';
import { serializeNotification } from './notification.service.js';
import { uploadDirectory } from '../middleware/upload.js';

export const serializeProfileEvidence = (file) => ({
  id: file.id,
  name: file.originalName,
  mimeType: file.mimeType,
  sizeBytes: String(file.sizeBytes),
  createdAt: file.createdAt.toISOString()
});

export async function addProfileEvidence(user, file) {
  if (!file) throw new AppError(422, 'FILE_REQUIRED', 'Choose one supported identification document to upload.');
  try {
    const verification = await prisma.verificationRequest.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { evidenceFiles: { select: { id: true } } }
    });
    if (!verification) throw new AppError(404, 'VERIFICATION_NOT_FOUND', 'The account approval request was not found.');
    if (!['DRAFT', 'REJECTED'].includes(verification.status)) {
      throw new AppError(409, 'PROFILE_NOT_EDITABLE', 'Identification documents cannot be changed while the profile is under review or already approved.');
    }
    if (verification.evidenceFiles.length >= 5) {
      throw new AppError(422, 'PROFILE_EVIDENCE_LIMIT', 'A maximum of 5 identification documents can be uploaded.');
    }
    const checksumSha256 = createHash('sha256').update(await readFile(file.path)).digest('hex');
    const evidence = await prisma.evidenceFile.create({
      data: {
        uploadedById: user.id,
        verificationRequestId: verification.id,
        originalName: file.originalname.slice(0, 255),
        storageKey: file.filename,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        checksumSha256,
        visibility: 'ADMIN_ONLY',
        scanStatus: 'CLEAN'
      }
    });
    return serializeProfileEvidence(evidence);
  } catch (error) {
    await unlink(file.path).catch(() => {});
    throw error;
  }
}

export async function getProfileEvidenceDownload(user, evidenceId) {
  const evidence = await prisma.evidenceFile.findFirst({
    where: { id: evidenceId, verificationRequestId: { not: null } },
    include: { verificationRequest: { select: { userId: true } } }
  });
  const allowed = evidence && (
    evidence.verificationRequest?.userId === user.id || user.role.code === 'SYSTEM_ADMINISTRATOR'
  );
  if (!allowed) throw new AppError(404, 'PROFILE_EVIDENCE_NOT_FOUND', 'The identification document was not found.');
  const filePath = path.join(uploadDirectory, evidence.storageKey);
  return { evidence, stream: createReadStream(filePath), filePath };
}

export async function submitProfileForReview(user, requestId) {
  const current = await usersRepository.findById(user.id);
  if (!current || !isProfileComplete(current.profile)) {
    throw new AppError(422, 'PROFILE_INCOMPLETE', 'Complete all required profile information before submitting it for review.');
  }
  const verification = current.verificationRequests?.[0];
  if (!verification) throw new AppError(404, 'VERIFICATION_NOT_FOUND', 'The account approval request was not found.');
  if (current.profile.identificationType === 'OTHER_GOVERNMENT_ID') {
    const evidenceCount = await prisma.evidenceFile.count({ where: { verificationRequestId: verification.id } });
    if (!evidenceCount) {
      throw new AppError(422, 'IDENTIFICATION_DOCUMENT_REQUIRED', 'Upload the selected government-issued identification document before submitting your profile.', {
        fieldErrors: [{ field: 'identificationDocument', message: 'Upload the selected government-issued identification document.', code: 'required' }]
      });
    }
  }
  if (verification.status === 'PENDING_APPROVAL') {
    throw new AppError(409, 'PROFILE_ALREADY_UNDER_REVIEW', 'Your profile is already under review.');
  }
  if (verification.status === 'APPROVED') {
    throw new AppError(409, 'PROFILE_ALREADY_APPROVED', 'Your profile is already approved.');
  }
  await prisma.$transaction(async (tx) => {
    await tx.verificationRequest.update({
      where: { id: verification.id },
      data: {
        status: 'PENDING_APPROVAL', submittedAt: new Date(), reviewedAt: null, reviewedById: null,
        decidedAt: null, decidedById: null, decisionReason: null
      }
    });
    await tx.user.update({ where: { id: user.id }, data: { status: 'PENDING_APPROVAL' } });
    const administrators = await tx.user.findMany({
      where: { role: { code: 'SYSTEM_ADMINISTRATOR' }, status: 'ACTIVE', deletedAt: null },
      select: { id: true }
    });
    if (administrators.length) {
      await tx.notification.createMany({
        data: administrators.map(({ id }) => ({
          userId: id,
          type: 'ACCOUNT_APPROVAL_REQUESTED',
          title: 'Profile approval requested',
          message: `${current.profile.displayName} submitted a ${current.role.code.replaceAll('_', ' ')} profile for review.`,
          entityType: 'VerificationRequest',
          entityId: verification.id
        }))
      });
    }
  });
  return serializeUser(await usersRepository.findById(user.id));
}

export async function getWorkspaceBootstrap(user) {
  const publicData = await getPublicBootstrap();
  const approved = user.status === 'ACTIVE';
  const innovationWhere = user.role.code === 'SYSTEM_ADMINISTRATOR'
    ? {}
    : user.role.code === 'INNOVATOR'
      ? { ownerId: user.id }
      : { status: 'PUBLISHED' };
  const innovations = approved ? await prisma.innovation.findMany({
    where: innovationWhere,
    include: {
      owner: { include: { profile: true } },
      publishedVersion: user.role.code === 'INNOVATOR' || user.role.code === 'SYSTEM_ADMINISTRATOR'
        ? true
        : { include: { evidenceFiles: { where: { visibility: 'PUBLIC', scanStatus: 'CLEAN' }, orderBy: { createdAt: 'desc' } } } },
      versions: user.role.code === 'INNOVATOR' || user.role.code === 'SYSTEM_ADMINISTRATOR'
        ? { orderBy: { versionNumber: 'desc' }, include: { evidenceFiles: true, revisionRequests: true } }
        : {
            where: { immutableAt: { not: null } },
            orderBy: { versionNumber: 'desc' },
            include: {
              evidenceFiles: { where: { visibility: 'PUBLIC', scanStatus: 'CLEAN' }, orderBy: { createdAt: 'desc' } },
              revisionRequests: false
            }
          },
      milestones: { orderBy: { createdAt: 'desc' } }
    }
  }) : [];
  const users = user.role.code === 'SYSTEM_ADMINISTRATOR'
    ? (await usersRepository.listSafe()).map(serializeUser)
    : [];
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100
  });
  const verificationRecords = user.role.code === 'SYSTEM_ADMINISTRATOR'
    ? await prisma.verificationRequest.findMany({
        where: { status: { not: 'DRAFT' } },
        include: { user: { include: { role: true, profile: true } }, evidenceFiles: true },
        orderBy: { createdAt: 'desc' }
      })
    : [];
  const criteriaRecords = user.role.code === 'SYSTEM_ADMINISTRATOR'
    ? await prisma.evaluationCriteriaVersion.findMany({ include: { criteria: true }, orderBy: { createdAt: 'desc' } })
    : [];
  const assignments = approved && user.role.code === 'EXPERT' ? await listAssignments(user) : [];
  const engagements = approved && ['INNOVATOR', 'INVESTOR_PARTNER'].includes(user.role.code) ? await listEngagements(user) : [];
  return {
    ...publicData,
    innovations: innovations.map((item) => user.role.code === 'INNOVATOR' || user.role.code === 'SYSTEM_ADMINISTRATOR' ? serializeWorkspaceInnovation(item) : serializeInnovation(item)).filter(Boolean),
    users,
    assignments,
    reviews: assignments.filter((item) => item.review).map((item) => ({ assignmentId: item.id, innovation: item.innovation, ...item.review })),
    revisions: innovations.flatMap((item) => (item.versions?.[0]?.revisionRequests ?? []).map((revision) => ({
      id: revision.id,
      innovationId: item.id,
      innovation: item.versions[0].title,
      field: revision.fieldKey,
      instruction: revision.instruction,
      response: revision.response ?? '',
      dueAt: revision.dueAt?.toISOString() ?? '',
      status: revision.status
    }))),
    engagements,
    notifications: notifications.map((item) => serializeNotification(item, user.role.code)),
    verifications: verificationRecords.filter((item) => item.user).map((item) => ({ id: item.id, name: item.user.profile?.displayName ?? item.user.email, organization: item.user.profile?.organization ?? '', role: item.requestedRole, status: item.status, evidence: item.evidenceFiles.length })),
    criteria: criteriaRecords.map((item) => ({ id: item.id, version: item.version, name: item.name, status: item.status, criteria: item.criteria.map((criterion) => ({ name: criterion.name, weight: Number(criterion.weight), guidance: criterion.guidance ?? '' })), weights: Object.fromEntries(item.criteria.map((criterion) => [criterion.name, Number(criterion.weight)])) }))
  };
}
