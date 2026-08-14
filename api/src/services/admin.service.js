import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { prisma } from '../config/database.js';
import { AppError } from '../lib/http.js';
import { hashPassword, serializeUser } from './auth.service.js';
import { createNotification } from './notification.service.js';
import { createInnovationAsAdministrator, serializeWorkspaceInnovation } from './innovations.service.js';
import { uploadDirectory } from '../middleware/upload.js';

const innovationInclude = {
  owner: { include: { profile: true } },
  expertAssignment: { include: { expert: { include: { profile: true } } } },
  versions: { orderBy: { versionNumber: 'desc' }, include: { evidenceFiles: true, revisionRequests: true } },
  milestones: { orderBy: { createdAt: 'desc' } },
  publishedVersion: true
};

const codeFor = (value) => value.toUpperCase().replace(/&/g, 'AND').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
const humanRole = (code) => ({ EXPERT: 'Expert', INVESTOR_PARTNER: 'Investor / Industry Partner', INNOVATOR: 'Innovator' }[code] ?? code);
const userInclude = { role: true, profile: true };
const expertAssignableStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'];

function serializeAdminUser(user) {
  return {
    ...serializeUser(user),
    identificationType: user.profile?.identificationType ?? '',
    identificationNumber: user.profile?.identificationNumber ?? '',
    phoneNumber: user.profile?.privatePhone ?? '',
    educationLevel: user.profile?.educationLevel ?? '',
    province: user.profile?.province ?? '',
    administrativeSector: user.profile?.administrativeSector ?? '',
    occupation: user.profile?.occupation ?? '',
    yearsOfExperience: user.profile?.yearsOfExperience ?? 0,
    preferredLanguage: user.profile?.preferredLanguage ?? 'en',
    publicProfile: user.profile?.publicProfile ?? false,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? ''
  };
}

function profileData(input) {
  return {
    displayName: input.displayName,
    organization: input.organization || null,
    identificationType: input.identificationType || null,
    identificationNumber: input.identificationNumber || null,
    privatePhone: input.phoneNumber || null,
    educationLevel: input.educationLevel || null,
    province: input.province || null,
    district: input.district || null,
    administrativeSector: input.administrativeSector || null,
    occupation: input.occupation || null,
    yearsOfExperience: input.yearsOfExperience ?? null,
    preferredLanguage: input.preferredLanguage ?? 'en',
    publicProfile: input.publicProfile ?? false
  };
}

async function assertAdministratorCanBeChanged(target, nextRole, nextStatus) {
  if (target.role.code !== 'SYSTEM_ADMINISTRATOR') return;
  if (nextRole === 'SYSTEM_ADMINISTRATOR' && nextStatus === 'ACTIVE') return;
  const activeAdministrators = await prisma.user.count({
    where: { deletedAt: null, status: 'ACTIVE', role: { code: 'SYSTEM_ADMINISTRATOR' } }
  });
  if (activeAdministrators <= 1) {
    throw new AppError(409, 'LAST_ADMINISTRATOR_REQUIRED', 'The last active System Administrator cannot be changed or deleted.');
  }
}

export async function getDashboard() {
  const [users, pendingVerifications, innovations, submitted, published] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.verificationRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.innovation.count(),
    prisma.innovation.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] } } }),
    prisma.innovation.count({ where: { status: 'PUBLISHED' } })
  ]);
  return { counts: { users, pendingVerifications, innovations, submitted, published } };
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null }, include: userInclude, orderBy: { createdAt: 'desc' }
  });
  return users.map(serializeAdminUser);
}

export async function getUser(id) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, include: userInclude });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
  return serializeAdminUser(user);
}

export async function createUser(admin, input, requestId) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account already exists for this email.');
  const role = await prisma.role.findUnique({ where: { code: input.role } });
  if (!role?.isActive) throw new AppError(422, 'ROLE_UNAVAILABLE', 'The selected account type is unavailable.');
  const passwordHash = await hashPassword(input.password);
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        roleId: role.id,
        status: input.status,
        emailVerifiedAt: new Date(),
        mustChangePassword: true,
        profile: { create: profileData(input) }
      },
      include: userInclude
    });
    return user;
  });
  return serializeAdminUser(created);
}

export async function updateUser(admin, id, input, requestId) {
  const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, include: userInclude });
  if (!target) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
  if (admin.id === id && input.role !== 'SYSTEM_ADMINISTRATOR') {
    throw new AppError(409, 'SELF_ROLE_CHANGE_NOT_ALLOWED', 'You cannot remove your own System Administrator role.');
  }
  if (admin.id === id && input.status !== 'ACTIVE') {
    throw new AppError(409, 'SELF_STATUS_CHANGE_NOT_ALLOWED', 'You cannot suspend or disable your own account.');
  }
  await assertAdministratorCanBeChanged(target, input.role, input.status);
  const duplicate = await prisma.user.findFirst({ where: { email: input.email, id: { not: id } }, select: { id: true } });
  if (duplicate) throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account already exists for this email.');
  const role = await prisma.role.findUnique({ where: { code: input.role } });
  if (!role?.isActive) throw new AppError(422, 'ROLE_UNAVAILABLE', 'The selected account type is unavailable.');
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: {
        email: input.email,
        roleId: role.id,
        status: input.status,
        profile: { upsert: { create: profileData(input), update: profileData(input) } }
      },
      include: userInclude
    });
    if (target.status !== input.status && input.status !== 'ACTIVE') {
      await tx.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: `ACCOUNT_${input.status}` }
      });
    }
    return user;
  });
  return serializeAdminUser(updated);
}

export async function updateUserStatus(admin, id, input, requestId) {
  if (admin.id === id && input.status !== 'ACTIVE') throw new AppError(409, 'SELF_STATUS_CHANGE_NOT_ALLOWED', 'You cannot suspend or disable your own account.');
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true, profile: true } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
  await assertAdministratorCanBeChanged(user, user.role.code, input.status);
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({ where: { id }, data: { status: input.status }, include: { role: true, profile: true } });
    if (input.status !== 'ACTIVE') await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: `ACCOUNT_${input.status}` } });
    return result;
  });
  return serializeAdminUser(updated);
}

export async function deleteUser(admin, id, requestId) {
  if (admin.id === id) throw new AppError(409, 'SELF_DELETE_NOT_ALLOWED', 'You cannot delete your own account.');
  const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, include: userInclude });
  if (!target) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
  await assertAdministratorCanBeChanged(target, target.role.code, 'DISABLED');
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'DISABLED' } });
    await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: 'ACCOUNT_DELETED' } });
  });
}

export async function listVerifications() {
  const records = await prisma.verificationRequest.findMany({
    where: { status: { not: 'DRAFT' } },
    include: { user: { include: { role: true, profile: true } }, evidenceFiles: true },
    orderBy: [{ status: 'asc' }, { submittedAt: 'asc' }]
  });
  return records.map((item) => ({
    id: item.id, userId: item.userId, name: item.user.profile?.displayName ?? item.user.email,
    email: item.user.email, organization: item.user.profile?.organization ?? '', role: item.requestedRole,
    status: item.status, evidence: item.evidenceFiles.length, submittedAt: item.submittedAt?.toISOString() ?? '',
    decisionReason: item.decisionReason ?? ''
  }));
}

function serializeVerification(item) {
  return {
    id: item.id,
    userId: item.userId,
    name: item.user.profile?.displayName ?? item.user.email,
    email: item.user.email,
    organization: item.user.profile?.organization ?? '',
    role: item.requestedRole,
    status: item.status,
    evidence: item.evidenceFiles.length,
    submittedAt: item.submittedAt?.toISOString() ?? '',
    decidedAt: item.decidedAt?.toISOString() ?? '',
    decisionReason: item.decisionReason ?? '',
    identificationType: item.user.profile?.identificationType ?? '',
    identificationNumber: item.user.profile?.identificationNumber ?? '',
    phoneNumber: item.user.profile?.privatePhone ?? '',
    educationLevel: item.user.profile?.educationLevel ?? '',
    province: item.user.profile?.province ?? '',
    district: item.user.profile?.district ?? '',
    administrativeSector: item.user.profile?.administrativeSector ?? '',
    occupation: item.user.profile?.occupation ?? '',
    yearsOfExperience: item.user.profile?.yearsOfExperience ?? 0,
    preferredLanguage: item.user.profile?.preferredLanguage ?? 'en',
    publicProfile: item.user.profile?.publicProfile ?? false,
    evidenceFiles: item.evidenceFiles.map((file) => ({ id: file.id, name: file.originalName, mimeType: file.mimeType, sizeBytes: String(file.sizeBytes) }))
  };
}

export async function getVerification(admin, id, requestId) {
  const verification = await prisma.verificationRequest.findFirst({
    where: { id, status: { not: 'DRAFT' } },
    include: { user: { include: userInclude }, evidenceFiles: true }
  });
  if (!verification) throw new AppError(404, 'VERIFICATION_NOT_FOUND', 'The account approval request was not found.');
  const reviewed = await prisma.verificationRequest.update({
    where: { id },
    data: { reviewedAt: new Date(), reviewedById: admin.id },
    include: { user: { include: userInclude }, evidenceFiles: true }
  });
  return serializeVerification(reviewed);
}

export async function decideVerification(admin, id, input, requestId) {
  const verification = await prisma.verificationRequest.findUnique({ where: { id }, include: { user: true } });
  if (!verification || verification.status !== 'PENDING_APPROVAL') throw new AppError(409, 'VERIFICATION_NOT_PENDING', 'Only a pending verification can be decided.');
  if (!verification.reviewedAt || verification.reviewedById !== admin.id) {
    throw new AppError(409, 'VERIFICATION_REVIEW_REQUIRED', 'View the user information before approving or rejecting this account.');
  }
  const approved = input.decision === 'APPROVE';
  await prisma.$transaction(async (tx) => {
    await tx.verificationRequest.update({
      where: { id }, data: { status: approved ? 'APPROVED' : 'REJECTED', decidedAt: new Date(), decidedById: admin.id, decisionReason: input.reason ?? null }
    });
    await tx.user.update({ where: { id: verification.userId }, data: { status: approved ? 'ACTIVE' : 'PENDING_APPROVAL' } });
    await createNotification({
      userId: verification.userId, type: 'ACCOUNT_VERIFICATION_DECIDED',
      title: approved ? 'Account approved' : 'Account not approved',
      message: approved ? `Your ${humanRole(verification.requestedRole)} account is now active.` : `Your profile needs changes before it can be approved.${input.reason ? ` ${input.reason}` : ''}`,
      entityType: 'VerificationRequest', entityId: id
    }, tx);
  });
}

export async function listInnovations() {
  const records = await prisma.innovation.findMany({ include: innovationInclude, orderBy: { updatedAt: 'desc' } });
  return records.map(serializeWorkspaceInnovation).filter(Boolean);
}

export async function createInnovation(admin, input, requestId) {
  return createInnovationAsAdministrator(admin, input, requestId);
}

export async function decideInnovation(admin, id, input, requestId) {
  const innovation = await prisma.innovation.findUnique({ where: { id }, include: innovationInclude });
  if (!innovation) throw new AppError(404, 'INNOVATION_NOT_FOUND', 'The innovation was not found.');
  const latest = innovation.versions[0];
  if (!latest) throw new AppError(409, 'INNOVATION_VERSION_MISSING', 'The innovation has no version to decide.');
  const transitions = {
    SUBMITTED: ['UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED'],
    UNDER_REVIEW: ['REVISION_REQUIRED', 'APPROVED', 'REJECTED'],
    REVISION_REQUIRED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    RECOMMENDED: ['REVISION_REQUIRED', 'APPROVED', 'REJECTED'],
    APPROVED: ['PUBLISHED', 'ARCHIVED'],
    PUBLISHED: ['ARCHIVED'],
    REJECTED: ['ARCHIVED'],
    DRAFT: ['ARCHIVED']
  };
  if (!(transitions[innovation.status] ?? []).includes(input.status)) {
    throw new AppError(409, 'INVALID_INNOVATION_TRANSITION', `An innovation cannot move from ${innovation.status} to ${input.status}.`);
  }
  await prisma.$transaction(async (tx) => {
    await tx.innovation.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.status === 'PUBLISHED' ? { publishedVersionId: latest.id, publishedAt: new Date() } : {}),
        ...(input.status === 'ARCHIVED' ? { archivedAt: new Date() } : {})
      }
    });
    await createNotification({
      userId: innovation.ownerId, type: 'INNOVATION_STATUS_CHANGED', title: 'Innovation status updated',
      message: `${latest.title} is now ${input.status.replaceAll('_', ' ').toLowerCase()}.`,
      entityType: 'Innovation', entityId: id
    }, tx);
  });
  const updated = await prisma.innovation.findUnique({ where: { id }, include: innovationInclude });
  return serializeWorkspaceInnovation(updated);
}

export async function assignExpert(admin, innovationId, input, requestId) {
  const innovation = await prisma.innovation.findUnique({
    where: { id: innovationId },
    include: {
      expertAssignment: { include: { expert: { include: { profile: true } } } },
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
    }
  });
  if (!innovation) throw new AppError(404, 'INNOVATION_NOT_FOUND', 'The innovation was not found.');
  if (innovation.expertAssignment) {
    const assignedName = innovation.expertAssignment.expert.profile?.displayName ?? innovation.expertAssignment.expert.email;
    throw new AppError(409, 'INNOVATION_ALREADY_ASSIGNED', `This innovation is already assigned to ${assignedName} and cannot be reassigned.`);
  }
  const version = innovation.versions[0];
  if (!version?.immutableAt) throw new AppError(409, 'IMMUTABLE_VERSION_REQUIRED', 'Submit and freeze the innovation before assigning an Expert.');
  if (!expertAssignableStatuses.includes(innovation.status)) {
    throw new AppError(409, 'INNOVATION_NOT_ASSIGNABLE', 'Only a submitted, under-review, approved, or published innovation can be assigned for Expert review.');
  }
  const expert = await prisma.user.findFirst({
    where: { id: input.expertId, status: 'ACTIVE', deletedAt: null, role: { code: 'EXPERT' } },
    include: { profile: true }
  });
  if (!expert) throw new AppError(422, 'APPROVED_EXPERT_REQUIRED', 'Select an approved active Expert.');
  let assignment;
  try {
    assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.expertAssignment.create({
        data: {
          innovationId,
          versionId: version.id,
          expertId: expert.id,
          assignedById: admin.id,
          dueAt: input.dueAt ? new Date(`${input.dueAt}T23:59:59.999Z`) : null
        }
      });
      if (innovation.status === 'SUBMITTED') {
        await tx.innovation.update({ where: { id: innovationId }, data: { status: 'UNDER_REVIEW' } });
      }
      await createNotification({
        userId: expert.id,
        type: 'EXPERT_ASSIGNMENT_CREATED',
        title: 'New innovation review assigned',
        message: `${version.title} is ready for your evaluation.`,
        entityType: 'ExpertAssignment',
        entityId: created.id
      }, tx);
      return created;
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error?.code === 'P2002' || error?.code === 'P2034') {
      throw new AppError(409, 'INNOVATION_ALREADY_ASSIGNED', 'This innovation has already been assigned and cannot be reassigned.');
    }
    throw error;
  }
  return { id: assignment.id, expert: expert.profile?.displayName ?? expert.email, status: assignment.status };
}

export async function deleteInnovation(admin, id, requestId) {
  const innovation = await prisma.innovation.findUnique({
    where: { id },
    include: {
      versions: { include: { evidenceFiles: true, assignments: { select: { id: true } } } },
      engagements: { select: { id: true } }
    }
  });
  if (!innovation) throw new AppError(404, 'INNOVATION_NOT_FOUND', 'The innovation was not found.');
  const hasWorkflowHistory = innovation.engagements.length > 0 || innovation.versions.some((version) => version.assignments.length > 0);
  if (hasWorkflowHistory) {
    throw new AppError(409, 'INNOVATION_DELETE_RESTRICTED', 'This innovation has review or engagement history and must be archived instead of deleted.');
  }
  const storageKeys = innovation.versions.flatMap((version) => version.evidenceFiles.map((file) => file.storageKey));
  await prisma.$transaction(async (tx) => {
    if (innovation.publishedVersionId) await tx.innovation.update({ where: { id }, data: { publishedVersionId: null } });
    await tx.innovation.delete({ where: { id } });
  });
  await Promise.all(storageKeys.map((storageKey) => unlink(path.join(uploadDirectory, storageKey)).catch(() => {})));
}

export async function listTaxonomies() {
  return prisma.taxonomy.findMany({ orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] });
}

export async function createTaxonomy(admin, input, requestId) {
  const code = codeFor(input.label);
  const record = await prisma.$transaction(async (tx) => {
    const max = await tx.taxonomy.aggregate({ where: { type: input.type }, _max: { sortOrder: true } });
    const created = await tx.taxonomy.create({ data: { type: input.type, code, label: input.label, sortOrder: (max._max.sortOrder ?? -1) + 1 } });
    return created;
  });
  return record;
}

export async function updateTaxonomy(admin, id, input, requestId) {
  const record = await prisma.$transaction(async (tx) => {
    const updated = await tx.taxonomy.update({ where: { id }, data: { isActive: input.isActive } });
    return updated;
  });
  return record;
}

export async function listCriteria() {
  const records = await prisma.evaluationCriteriaVersion.findMany({ include: { criteria: { orderBy: { sortOrder: 'asc' } } }, orderBy: { createdAt: 'desc' } });
  return records.map((item) => ({
    id: item.id, version: item.version, name: item.name, status: item.status,
    criteria: item.criteria.map((criterion) => ({ id: criterion.id, name: criterion.name, guidance: criterion.guidance ?? '', weight: Number(criterion.weight) }))
  }));
}

export async function createCriteria(admin, input, requestId) {
  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.evaluationCriteriaVersion.create({
      data: {
        version: input.version, name: input.name, status: 'DRAFT', createdById: admin.id,
        criteria: { create: input.criteria.map((item, index) => ({ ...item, key: codeFor(item.name), sortOrder: index })) }
      }, include: { criteria: true }
    });
    return created;
  });
  return record;
}

export async function getSettings() {
  const records = await prisma.platformSetting.findMany();
  const defaults = { publicStatistics: true, allowComments: true, maintenanceMode: false, maxFileSizeMb: 25 };
  for (const record of records) defaults[record.key] = record.value;
  return defaults;
}

export async function updateSettings(admin, input, requestId) {
  await prisma.$transaction(async (tx) => {
    for (const [key, value] of Object.entries(input)) {
      await tx.platformSetting.upsert({ where: { key }, update: { value, updatedById: admin.id }, create: { key, value, updatedById: admin.id } });
    }
  });
  return getSettings();
}

export async function getReport() {
  const [usersByRole, usersByStatus, innovationsByStatus, innovationsBySector] = await Promise.all([
    prisma.user.groupBy({ by: ['roleId'], _count: { _all: true } }),
    prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.innovation.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.innovationVersion.groupBy({ by: ['sector'], where: { innovation: { status: 'PUBLISHED' } }, _count: { _all: true } })
  ]);
  const roles = await prisma.role.findMany({ select: { id: true, code: true } });
  const roleMap = Object.fromEntries(roles.map((role) => [role.id, role.code]));
  return {
    generatedAt: new Date().toISOString(),
    usersByRole: usersByRole.map((item) => ({ label: roleMap[item.roleId], value: item._count._all })),
    usersByStatus: usersByStatus.map((item) => ({ label: item.status, value: item._count._all })),
    innovationsByStatus: innovationsByStatus.map((item) => ({ label: item.status, value: item._count._all })),
    publishedBySector: innovationsBySector.map((item) => ({ label: item.sector, value: item._count._all }))
  };
}
