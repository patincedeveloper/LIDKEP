import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../config/database.js';
import { AppError } from '../lib/http.js';
import { createNotification, notifySystemAdministrators } from './notification.service.js';
import { uploadDirectory } from '../middleware/upload.js';
import { isProfileComplete } from './auth.service.js';

const editableStatuses = ['DRAFT', 'REVISION_REQUIRED'];
const versionFields = [
  'title', 'summary', 'problem', 'solution', 'beneficiaries', 'sector', 'category',
  'district', 'maturity', 'impactArea', 'impact', 'novelty', 'currentEvidence',
  'implementationPlan', 'scalability', 'sustainability', 'supportNeeded'
];
const requiredVersionFields = versionFields.filter((field) => field !== 'currentEvidence');
const submissionFieldLabels = {
  title: 'Innovation title', summary: 'Short summary', problem: 'Problem or need',
  solution: 'Proposed solution', beneficiaries: 'Main beneficiaries', sector: 'Innovation sector',
  category: 'Innovation type', district: 'Project district', maturity: 'Maturity level',
  impactArea: 'Primary impact area', impact: 'Expected impact', novelty: 'What is new or different',
  implementationPlan: 'Implementation plan', scalability: 'Potential to scale',
  sustainability: 'Sustainability', supportNeeded: 'Support requested'
};

const includeInnovation = {
  owner: { include: { profile: true } },
  expertAssignment: { include: { expert: { include: { profile: true } } } },
  versions: {
    orderBy: { versionNumber: 'desc' },
    include: { evidenceFiles: { orderBy: { createdAt: 'desc' } }, revisionRequests: true }
  },
  milestones: { orderBy: { createdAt: 'desc' } },
  publishedVersion: true
};

function codeFor(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'innovation';
}

async function uniqueSlug(title) {
  const base = codeFor(title);
  let slug = base;
  let suffix = 1;
  while (await prisma.innovation.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${++suffix}`;
  return slug;
}

function completionFor(version) {
  const completedFields = requiredVersionFields.filter((field) => String(version[field] ?? '').trim()).length;
  const declarations = Number(Boolean(version.ownershipDeclaredAt)) + Number(Boolean(version.accuracyDeclaredAt));
  return Math.round(((completedFields + declarations) / (requiredVersionFields.length + 2)) * 100);
}

export function serializeEvidence(file) {
  return {
    id: file.id,
    name: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: String(file.sizeBytes),
    visibility: file.visibility,
    scanStatus: file.scanStatus,
    createdAt: file.createdAt.toISOString()
  };
}

export function serializeWorkspaceInnovation(innovation) {
  const version = innovation.versions?.[0] ?? innovation.publishedVersion;
  if (!version) return null;
  const assignment = innovation.expertAssignment;
  return {
    id: innovation.id,
    slug: innovation.slug,
    title: version.title,
    summary: version.summary,
    problem: version.problem,
    solution: version.solution,
    beneficiaries: version.beneficiaries,
    sector: version.sector,
    category: version.category,
    district: version.district,
    maturity: version.maturity,
    impactArea: version.impactArea,
    status: innovation.status,
    impact: version.impact,
    novelty: version.novelty,
    currentEvidence: version.currentEvidence,
    implementationPlan: version.implementationPlan,
    scalability: version.scalability,
    sustainability: version.sustainability,
    supportNeeded: version.supportNeeded,
    supportingLinks: Array.isArray(version.supportingLinks) ? version.supportingLinks : [],
    owner: innovation.owner?.profile?.displayName ?? version.ownerDisplaySnapshot ?? 'LIDKEP innovator',
    ownerId: innovation.ownerId,
    organization: innovation.owner?.profile?.organization ?? version.organizationSnapshot ?? '',
    publishedAt: innovation.publishedAt?.toISOString() ?? '',
    createdAt: innovation.createdAt.toISOString(),
    updatedAt: innovation.updatedAt.toISOString(),
    submittedAt: version.submittedAt?.toISOString() ?? '',
    version: version.versionNumber,
    versionId: version.id,
    completion: version.completionPercent,
    ownershipDeclared: Boolean(version.ownershipDeclaredAt),
    accuracyDeclared: Boolean(version.accuracyDeclaredAt),
    views: 0,
    saves: 0,
    imageTone: 'mint',
    evidence: (version.evidenceFiles ?? []).map(serializeEvidence),
    metrics: Array.isArray(version.metrics) ? version.metrics : [],
    milestones: (innovation.milestones ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description ?? '',
      date: item.completedAt?.toISOString() ?? item.targetDate?.toISOString() ?? '',
      status: item.status,
      visibility: item.visibility
    })),
    revisions: (version.revisionRequests ?? []).map((item) => ({
      id: item.id,
      field: item.fieldKey,
      instruction: item.instruction,
      response: item.response ?? '',
      dueAt: item.dueAt?.toISOString() ?? '',
      status: item.status
    })),
    assignment: assignment ? {
      id: assignment.id,
      expertId: assignment.expertId,
      expert: assignment.expert?.profile?.displayName ?? assignment.expert?.email ?? 'Assigned Expert',
      status: assignment.status,
      dueAt: assignment.dueAt?.toISOString() ?? '',
      createdAt: assignment.createdAt.toISOString()
    } : null
  };
}

async function findAccessibleInnovation(id, user) {
  const innovation = await prisma.innovation.findFirst({
    where: { id, ...(user.role.code === 'SYSTEM_ADMINISTRATOR' ? {} : { ownerId: user.id }) },
    include: includeInnovation
  });
  if (!innovation) throw new AppError(404, 'INNOVATION_NOT_FOUND', 'The innovation was not found.');
  return innovation;
}

async function ensureEditableVersion(innovation, tx = prisma) {
  const latest = innovation.versions[0];
  if (!latest) throw new AppError(409, 'INNOVATION_VERSION_MISSING', 'The innovation has no editable version.');
  if (!latest.immutableAt) return latest;
  const copy = Object.fromEntries(versionFields.map((field) => [field, latest[field]]));
  return tx.innovationVersion.create({
    data: {
      innovationId: innovation.id,
      versionNumber: latest.versionNumber + 1,
      ...copy,
      organizationSnapshot: latest.organizationSnapshot,
      ownerDisplaySnapshot: latest.ownerDisplaySnapshot,
      metrics: latest.metrics,
      supportingLinks: latest.supportingLinks,
      completionPercent: latest.completionPercent
    }
  });
}

async function createInnovationRecord(owner, actor, input, requestId) {
  if (!isProfileComplete(owner.profile) && actor.role.code !== 'SYSTEM_ADMINISTRATOR') {
    throw new AppError(422, 'INNOVATOR_PROFILE_INCOMPLETE', 'Complete your Innovator profile before creating an innovation.');
  }
  const slug = await uniqueSlug(input.title);
  const base = Object.fromEntries(versionFields.map((field) => [field, input[field] ?? '']));
  const innovation = await prisma.$transaction(async (tx) => {
    const created = await tx.innovation.create({
      data: {
        ownerId: owner.id,
        slug,
        versions: {
          create: {
            versionNumber: 1,
            ...base,
            ownerDisplaySnapshot: owner.profile?.displayName ?? owner.email,
            organizationSnapshot: owner.profile?.organization ?? '',
            supportingLinks: input.supportingLinks ?? [],
            ownershipDeclaredAt: input.ownershipDeclared ? new Date() : null,
            accuracyDeclaredAt: input.accuracyDeclared ? new Date() : null,
            completionPercent: completionFor({
              ...base,
              ownershipDeclaredAt: input.ownershipDeclared ? new Date() : null,
              accuracyDeclaredAt: input.accuracyDeclared ? new Date() : null
            })
          }
        }
      },
      include: includeInnovation
    });
    return created;
  });
  return serializeWorkspaceInnovation(innovation);
}

export async function createInnovation(user, input, requestId) {
  if (user.role.code !== 'INNOVATOR') throw new AppError(403, 'FORBIDDEN', 'Only Innovators can create innovations.');
  return createInnovationRecord(user, user, input, requestId);
}

export async function createInnovationAsAdministrator(admin, input, requestId) {
  const owner = await prisma.user.findFirst({
    where: { id: input.ownerId, deletedAt: null, role: { code: 'INNOVATOR' } },
    include: { role: true, profile: true }
  });
  if (!owner) throw new AppError(422, 'INNOVATION_OWNER_INVALID', 'Choose an active Innovator account as the owner.');
  const { ownerId: _ownerId, ...innovationInput } = input;
  return createInnovationRecord(owner, admin, innovationInput, requestId);
}

export async function updateInnovation(user, id, input, requestId) {
  const innovation = await findAccessibleInnovation(id, user);
  const administrator = user.role.code === 'SYSTEM_ADMINISTRATOR';
  if (!administrator && (user.role.code !== 'INNOVATOR' || !editableStatuses.includes(innovation.status))) {
    throw new AppError(409, 'INNOVATION_NOT_EDITABLE', 'Only a draft or revision-required innovation can be edited.');
  }
  await prisma.$transaction(async (tx) => {
    const version = await ensureEditableVersion(innovation, tx);
    const data = Object.fromEntries(versionFields.filter((field) => input[field] !== undefined).map((field) => [field, input[field]]));
    if (input.supportingLinks !== undefined) data.supportingLinks = input.supportingLinks;
    if (input.ownershipDeclared !== undefined) data.ownershipDeclaredAt = input.ownershipDeclared ? new Date() : null;
    if (input.accuracyDeclared !== undefined) data.accuracyDeclaredAt = input.accuracyDeclared ? new Date() : null;
    const candidate = { ...version, ...data };
    data.completionPercent = completionFor(candidate);
    await tx.innovationVersion.update({ where: { id: version.id }, data });
  });
  return serializeWorkspaceInnovation(await findAccessibleInnovation(id, user));
}

export async function submitInnovation(user, id, requestId) {
  const innovation = await findAccessibleInnovation(id, user);
  if (user.role.code !== 'INNOVATOR' || !editableStatuses.includes(innovation.status)) {
    throw new AppError(409, 'INNOVATION_NOT_SUBMITTABLE', 'This innovation cannot be submitted from its current status.');
  }
  if (!isProfileComplete(user.profile)) {
    throw new AppError(422, 'INNOVATOR_PROFILE_INCOMPLETE', 'Complete your Innovator profile before submitting an innovation.');
  }
  const version = innovation.versions[0];
  const completion = completionFor(version);
  if (completion < 100) {
    const fieldErrors = requiredVersionFields
      .filter((field) => !String(version[field] ?? '').trim())
      .map((field) => ({ field, message: `${submissionFieldLabels[field]} is required before submission.`, code: 'required' }));
    if (!version.ownershipDeclaredAt) fieldErrors.push({ field: 'ownershipDeclared', message: 'Confirm that you own or are authorized to submit this innovation.', code: 'required' });
    if (!version.accuracyDeclaredAt) fieldErrors.push({ field: 'accuracyDeclared', message: 'Confirm that the information is accurate.', code: 'required' });
    throw new AppError(422, 'INNOVATION_INCOMPLETE', 'Correct the highlighted fields before submitting.', { fieldErrors });
  }
  await prisma.$transaction(async (tx) => {
    await tx.innovationVersion.update({ where: { id: version.id }, data: { completionPercent: 100, submittedAt: new Date(), immutableAt: new Date() } });
    await tx.innovation.update({ where: { id }, data: { status: 'SUBMITTED' } });
    await notifySystemAdministrators({
      type: 'INNOVATION_SUBMITTED', title: 'Innovation submitted',
      message: `${version.title} is ready for administrator review.`, entityType: 'Innovation', entityId: id
    }, tx);
  });
  return serializeWorkspaceInnovation(await findAccessibleInnovation(id, user));
}

export async function addMilestone(user, id, input, requestId) {
  const innovation = await findAccessibleInnovation(id, user);
  if (user.role.code !== 'INNOVATOR') throw new AppError(403, 'FORBIDDEN', 'Only the Innovator can update project progress.');
  await prisma.$transaction(async (tx) => {
    await tx.milestone.create({
      data: {
        innovationId: innovation.id,
        title: input.title,
        description: input.description || null,
        targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null,
        completedAt: input.status === 'COMPLETED' ? new Date() : null,
        status: input.status,
        visibility: input.visibility
      }
    });
  });
  return serializeWorkspaceInnovation(await findAccessibleInnovation(id, user));
}

export async function addEvidence(user, id, file, visibility, requestId) {
  if (!file) throw new AppError(422, 'FILE_REQUIRED', 'Choose one supported file to upload.');
  try {
    const innovation = await findAccessibleInnovation(id, user);
    if (user.role.code !== 'INNOVATOR' || !editableStatuses.includes(innovation.status)) {
      throw new AppError(409, 'INNOVATION_NOT_EDITABLE', 'Evidence can only be added to a draft or revision-required innovation.');
    }
    const version = await ensureEditableVersion(innovation);
    const checksumSha256 = createHash('sha256').update(await readFile(file.path)).digest('hex');
    const evidence = await prisma.$transaction(async (tx) => {
      const created = await tx.evidenceFile.create({
        data: {
          uploadedById: user.id,
          innovationVersionId: version.id,
          originalName: file.originalname.slice(0, 255),
          storageKey: file.filename,
          mimeType: file.mimetype,
          sizeBytes: BigInt(file.size),
          checksumSha256,
          visibility: ['PUBLIC', 'AUTHENTICATED', 'REVIEW_TEAM', 'ADMIN_ONLY'].includes(visibility) ? visibility : 'REVIEW_TEAM',
          scanStatus: 'CLEAN'
        }
      });
      return created;
    });
    return serializeEvidence(evidence);
  } catch (error) {
    if (file?.path) await unlink(file.path).catch(() => {});
    throw error;
  }
}

export async function getEvidenceDownload(user, id, evidenceId) {
  await findAccessibleInnovation(id, user);
  const evidence = await prisma.evidenceFile.findFirst({
    where: { id: evidenceId, innovationVersion: { innovationId: id } }
  });
  if (!evidence) throw new AppError(404, 'EVIDENCE_NOT_FOUND', 'The evidence file was not found.');
  const filePath = path.join(uploadDirectory, evidence.storageKey);
  return { evidence, stream: createReadStream(filePath), filePath };
}

export async function respondToRevision(user, id, revisionId, response, requestId) {
  const innovation = await findAccessibleInnovation(id, user);
  const revision = innovation.versions.flatMap((version) => version.revisionRequests).find((item) => item.id === revisionId);
  if (!revision) throw new AppError(404, 'REVISION_NOT_FOUND', 'The revision request was not found.');
  await prisma.$transaction(async (tx) => {
    await tx.revisionRequest.update({ where: { id: revisionId }, data: { response, respondedAt: new Date(), status: 'RESPONDED' } });
    await createNotification({
      userId: user.id, type: 'REVISION_RESPONSE_RECORDED', title: 'Revision response saved',
      message: 'Your response was recorded and is visible to the review team.', entityType: 'Innovation', entityId: id
    }, tx);
  });
}

export async function getInnovation(user, id) {
  return serializeWorkspaceInnovation(await findAccessibleInnovation(id, user));
}

export async function listInnovations(user) {
  const records = await prisma.innovation.findMany({
    where: user.role.code === 'SYSTEM_ADMINISTRATOR' ? {} : { ownerId: user.id },
    include: includeInnovation,
    orderBy: { updatedAt: 'desc' }
  });
  return records.map(serializeWorkspaceInnovation).filter(Boolean);
}
