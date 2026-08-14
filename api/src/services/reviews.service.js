import { prisma } from '../config/database.js';
import { AppError } from '../lib/http.js';
import { createNotification, notifySystemAdministrators } from './notification.service.js';

const includeAssignment = {
  expert: { include: { profile: true } },
  version: {
    include: {
      innovation: { include: { owner: { include: { profile: true } } } },
      evidenceFiles: { orderBy: { createdAt: 'desc' } }
    }
  },
  review: { include: { scores: true, revisionRequests: true, criteriaVersion: { include: { criteria: { orderBy: { sortOrder: 'asc' } } } } } }
};

export function serializeAssignment(item) {
  const version = item.version;
  const innovation = version.innovation;
  return {
    id: item.id,
    innovationId: innovation.id,
    innovation: version.title,
    version: version.versionNumber,
    expert: item.expert.profile?.displayName ?? item.expert.email,
    sector: version.sector,
    district: version.district,
    status: item.status,
    dueAt: item.dueAt?.toISOString() ?? '',
    acceptedAt: item.acceptedAt?.toISOString() ?? '',
    completedAt: item.completedAt?.toISOString() ?? '',
    summary: version.summary,
    problem: version.problem,
    solution: version.solution,
    beneficiaries: version.beneficiaries,
    impact: version.impact,
    novelty: version.novelty,
    currentEvidence: version.currentEvidence,
    implementationPlan: version.implementationPlan,
    scalability: version.scalability,
    sustainability: version.sustainability,
    supportNeeded: version.supportNeeded,
    evidence: version.evidenceFiles.map((file) => ({ id: file.id, name: file.originalName, mimeType: file.mimeType, sizeBytes: String(file.sizeBytes) })),
    criteria: item.review?.criteriaVersion.criteria.map((criterion) => ({ key: criterion.key, name: criterion.name, guidance: criterion.guidance ?? '', weight: Number(criterion.weight) })) ?? [],
    review: item.review ? {
      id: item.review.id,
      status: item.review.status,
      recommendation: item.review.recommendation ?? '',
      totalScore: item.review.totalScore === null ? null : Number(item.review.totalScore),
      rationale: item.review.rationale ?? '',
      scores: item.review.scores.map((score) => ({ criterionKey: score.criterionKey, score: Number(score.score), comment: score.comment ?? '' })),
      revisionRequests: item.review.revisionRequests.map((revision) => ({ fieldKey: revision.fieldKey, instruction: revision.instruction, dueAt: revision.dueAt?.toISOString() ?? '', status: revision.status })),
      submittedAt: item.review.submittedAt?.toISOString() ?? ''
    } : null
  };
}

async function assignedTo(expertId, assignmentId) {
  const assignment = await prisma.expertAssignment.findFirst({ where: { id: assignmentId, expertId }, include: includeAssignment });
  if (!assignment) throw new AppError(404, 'ASSIGNMENT_NOT_FOUND', 'The review assignment was not found.');
  return assignment;
}

export async function listAssignments(expert) {
  const records = await prisma.expertAssignment.findMany({ where: { expertId: expert.id }, include: includeAssignment, orderBy: { createdAt: 'desc' } });
  return records.map(serializeAssignment);
}

export async function getAssignment(expert, assignmentId) {
  return serializeAssignment(await assignedTo(expert.id, assignmentId));
}

export async function acceptAssignment(expert, assignmentId, requestId) {
  const assignment = await assignedTo(expert.id, assignmentId);
  if (assignment.status !== 'ASSIGNED') throw new AppError(409, 'ASSIGNMENT_NOT_AVAILABLE', 'Only a new assignment can be accepted.');
  const criteriaVersion = await prisma.evaluationCriteriaVersion.findFirst({ where: { status: 'ACTIVE' }, orderBy: { activatedAt: 'desc' } });
  if (!criteriaVersion) throw new AppError(409, 'ACTIVE_CRITERIA_REQUIRED', 'No active evaluation criteria are configured.');
  await prisma.$transaction(async (tx) => {
    await tx.expertAssignment.update({ where: { id: assignmentId }, data: { status: 'ACCEPTED', acceptedAt: new Date() } });
    await tx.review.create({ data: { assignmentId, versionId: assignment.versionId, reviewerId: expert.id, criteriaVersionId: criteriaVersion.id } });
  });
  return getAssignment(expert, assignmentId);
}

export async function saveReview(expert, assignmentId, input, requestId) {
  const assignment = await assignedTo(expert.id, assignmentId);
  if (!['ACCEPTED', 'IN_PROGRESS'].includes(assignment.status)) throw new AppError(409, 'ASSIGNMENT_NOT_EDITABLE', 'Accept the assignment before starting the evaluation.');
  if (assignment.review?.status === 'SUBMITTED') throw new AppError(409, 'REVIEW_ALREADY_SUBMITTED', 'A submitted evaluation cannot be edited.');
  const criteriaVersion = assignment.review?.criteriaVersion ?? await prisma.evaluationCriteriaVersion.findFirst({
    where: { status: 'ACTIVE' }, include: { criteria: { orderBy: { sortOrder: 'asc' } } }, orderBy: { activatedAt: 'desc' }
  });
  if (!criteriaVersion) throw new AppError(409, 'ACTIVE_CRITERIA_REQUIRED', 'No active evaluation criteria are configured.');
  const criterionByKey = new Map(criteriaVersion.criteria.map((criterion) => [criterion.key, criterion]));
  const uniqueKeys = new Set(input.scores.map((score) => score.criterionKey));
  if (uniqueKeys.size !== criteriaVersion.criteria.length || input.scores.some((score) => !criterionByKey.has(score.criterionKey))) {
    throw new AppError(422, 'ALL_CRITERIA_REQUIRED', 'Provide one score for every active evaluation criterion.');
  }
  if (input.recommendation === 'REVISION_REQUIRED' && input.revisionRequests.length === 0) {
    throw new AppError(422, 'REVISION_REQUEST_REQUIRED', 'Add at least one clear revision request for this recommendation.');
  }
  const totalScore = input.scores.reduce((total, item) => total + (item.score / 5) * Number(criterionByKey.get(item.criterionKey).weight), 0);
  await prisma.$transaction(async (tx) => {
    const review = await tx.review.upsert({
      where: { assignmentId },
      update: { rationale: input.rationale || null, recommendation: input.recommendation ?? null, totalScore },
      create: { assignmentId, versionId: assignment.versionId, reviewerId: expert.id, criteriaVersionId: criteriaVersion.id, rationale: input.rationale || null, recommendation: input.recommendation ?? null, totalScore }
    });
    await tx.reviewCriterionScore.deleteMany({ where: { reviewId: review.id } });
    await tx.reviewCriterionScore.createMany({ data: input.scores.map((item) => ({
      reviewId: review.id,
      criterionKey: item.criterionKey,
      criterionName: criterionByKey.get(item.criterionKey).name,
      weight: criterionByKey.get(item.criterionKey).weight,
      score: item.score,
      comment: item.comment || null
    })) });
    await tx.revisionRequest.deleteMany({ where: { reviewId: review.id, status: 'OPEN' } });
    if (input.revisionRequests.length) {
      await tx.revisionRequest.createMany({ data: input.revisionRequests.map((item) => ({
        reviewId: review.id,
        versionId: assignment.versionId,
        fieldKey: item.fieldKey,
        instruction: item.instruction,
        dueAt: item.dueAt ? new Date(`${item.dueAt}T23:59:59.999Z`) : null
      })) });
    }
    await tx.expertAssignment.update({ where: { id: assignmentId }, data: { status: 'IN_PROGRESS' } });
  });
  return getAssignment(expert, assignmentId);
}

export async function submitReview(expert, assignmentId, requestId) {
  const assignment = await assignedTo(expert.id, assignmentId);
  const review = assignment.review;
  if (!review || review.status === 'SUBMITTED' || !review.recommendation || !review.rationale?.trim()) {
    throw new AppError(422, 'REVIEW_INCOMPLETE', 'Save all scores, a recommendation, and a rationale before submitting.');
  }
  if (review.scores.length !== review.criteriaVersion.criteria.length) throw new AppError(422, 'ALL_CRITERIA_REQUIRED', 'Every criterion must be scored.');
  if (review.recommendation === 'REVISION_REQUIRED' && review.revisionRequests.length === 0) throw new AppError(422, 'REVISION_REQUEST_REQUIRED', 'Add at least one revision request.');
  const innovation = assignment.version.innovation;
  await prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id: review.id }, data: { status: 'SUBMITTED', submittedAt: new Date() } });
    await tx.expertAssignment.update({ where: { id: assignmentId }, data: { status: review.recommendation === 'REVISION_REQUIRED' ? 'REVISION_REQUESTED' : 'COMPLETED', completedAt: new Date() } });
    await tx.innovation.update({ where: { id: innovation.id }, data: { status: review.recommendation === 'REVISION_REQUIRED' ? 'REVISION_REQUIRED' : 'RECOMMENDED' } });
    await createNotification({
      userId: innovation.ownerId,
      type: 'EXPERT_REVIEW_SUBMITTED',
      title: review.recommendation === 'REVISION_REQUIRED' ? 'Innovation revisions requested' : 'Expert evaluation completed',
      message: review.recommendation === 'REVISION_REQUIRED' ? `${assignment.version.title} needs updates from the Expert review.` : `${assignment.version.title} has received an Expert recommendation.`,
      entityType: 'Innovation', entityId: innovation.id
    }, tx);
    await notifySystemAdministrators({ type: 'EXPERT_REVIEW_SUBMITTED', title: 'Expert recommendation submitted', message: `${assignment.version.title} is ready for the final administrator decision.`, entityType: 'Review', entityId: review.id }, tx);
  });
  return getAssignment(expert, assignmentId);
}
