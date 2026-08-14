import { prisma } from '../config/database.js';
import { serializeUser } from './auth.service.js';
import { getPublicBootstrap, serializeInnovation } from './public.service.js';
import { usersRepository } from '../repositories/users.repository.js';
import { serializeWorkspaceInnovation } from './innovations.service.js';
import { AppError } from '../lib/http.js';
import { isProfileComplete } from './auth.service.js';
import { listAssignments } from './reviews.service.js';
import { listEngagements } from './engagements.service.js';

export async function submitProfileForReview(user, requestId) {
  const current = await usersRepository.findById(user.id);
  if (!current || !isProfileComplete(current.profile)) {
    throw new AppError(422, 'PROFILE_INCOMPLETE', 'Complete all required profile information before submitting it for review.');
  }
  const verification = current.verificationRequests?.[0];
  if (!verification) throw new AppError(404, 'VERIFICATION_NOT_FOUND', 'The account approval request was not found.');
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
      publishedVersion: true,
      versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { evidenceFiles: true, revisionRequests: true } },
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
    notifications: notifications.map((item) => ({
      id: item.id, title: item.title, message: item.message, time: item.createdAt.toISOString(), read: Boolean(item.readAt), type: item.type
    })),
    verifications: verificationRecords.filter((item) => item.user).map((item) => ({ id: item.id, name: item.user.profile?.displayName ?? item.user.email, organization: item.user.profile?.organization ?? '', role: item.requestedRole, status: item.status, evidence: item.evidenceFiles.length })),
    criteria: criteriaRecords.map((item) => ({ id: item.id, version: item.version, name: item.name, status: item.status, criteria: item.criteria.map((criterion) => ({ name: criterion.name, weight: Number(criterion.weight), guidance: criterion.guidance ?? '' })), weights: Object.fromEntries(item.criteria.map((criterion) => [criterion.name, Number(criterion.weight)])) }))
  };
}
