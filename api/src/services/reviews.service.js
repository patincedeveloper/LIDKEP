import { prisma } from '../config/database.js';
import { AppError } from '../lib/http.js';
import { createNotification, notifySystemAdministrators } from './notification.service.js';

const reviewInclude = {
  scores: true,
  revisionRequests: true,
  version: true,
  criteriaVersion: { include: { criteria: { orderBy: { sortOrder: 'asc' } } } }
};

const includeAssignment = {
  expert: { include: { profile: true } },
  version: {
    include: {
      innovation: {
        include: {
          owner: { include: { profile: true } },
          versions: {
            include: {
              evidenceFiles: {
                where: { visibility: { in: ['PUBLIC', 'AUTHENTICATED', 'REVIEW_TEAM'] }, scanStatus: 'CLEAN' },
                orderBy: { createdAt: 'desc' }
              }
            },
            orderBy: { versionNumber: 'desc' }
          }
        }
      },
      evidenceFiles: {
        where: { visibility: { in: ['PUBLIC', 'AUTHENTICATED', 'REVIEW_TEAM'] }, scanStatus: 'CLEAN' },
        orderBy: { createdAt: 'desc' }
      }
    }
  },
  reviews: { include: reviewInclude, orderBy: { createdAt: 'desc' } }
};

function serializeReview(review) {
  return {
    id: review.id,
    versionId: review.versionId,
    version: review.version?.versionNumber ?? 0,
    status: review.status,
    recommendation: review.recommendation ?? '',
    totalScore: review.totalScore === null ? null : Number(review.totalScore),
    rationale: review.rationale ?? '',
    scores: review.scores.map((score) => ({
      criterionKey: score.criterionKey,
      criterionName: score.criterionName,
      weight: Number(score.weight),
      score: Number(score.score),
      comment: score.comment ?? ''
    })),
    revisionRequests: review.revisionRequests.map((revision) => ({
      id: revision.id,
      fieldKey: revision.fieldKey,
      instruction: revision.instruction,
      response: revision.response ?? '',
      dueAt: revision.dueAt?.toISOString() ?? '',
      status: revision.status
    })),
    submittedAt: review.submittedAt?.toISOString() ?? ''
  };
}

export function serializeAssignment(item) {
  const version = item.version;
  const innovation = version.innovation;
  const evidenceFiles = Array.from(new Map(
    innovation.versions.flatMap((item) => item.evidenceFiles).map((file) => [file.id, file])
  ).values());
  const currentReview = item.reviews.find((review) => review.versionId === item.versionId) ?? null;
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
    supportingLinks: Array.isArray(version.supportingLinks) ? version.supportingLinks : [],
    evidence: evidenceFiles.map((file) => ({ id: file.id, name: file.originalName, mimeType: file.mimeType, sizeBytes: String(file.sizeBytes) })),
    criteria: currentReview?.criteriaVersion.criteria.map((criterion) => ({ key: criterion.key, name: criterion.name, guidance: criterion.guidance ?? '', weight: Number(criterion.weight) })) ?? [],
    review: currentReview ? serializeReview(currentReview) : null,
    reviewHistory: item.reviews.filter((review) => review.status === 'SUBMITTED').map(serializeReview)
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

export async function saveReview(expert, assignmentId, input, requestId) {
  const assignment = await assignedTo(expert.id, assignmentId);
  if (!['ASSIGNED', 'IN_PROGRESS'].includes(assignment.status)) {
    throw new AppError(409, 'ASSIGNMENT_NOT_EDITABLE', 'This assignment is not open for evaluation.');
  }
  const currentReview = assignment.reviews.find((review) => review.versionId === assignment.versionId);
  if (currentReview?.status === 'SUBMITTED') throw new AppError(409, 'REVIEW_ALREADY_SUBMITTED', 'A submitted evaluation cannot be edited.');
  const criteriaVersion = currentReview?.criteriaVersion ?? await prisma.evaluationCriteriaVersion.findFirst({
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
      where: { assignmentId_versionId: { assignmentId, versionId: assignment.versionId } },
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
    await tx.expertAssignment.update({ where: { id: assignmentId }, data: { status: 'IN_PROGRESS', completedAt: null } });
  });
  return getAssignment(expert, assignmentId);
}

export async function submitReview(expert, assignmentId, requestId) {
  const assignment = await assignedTo(expert.id, assignmentId);
  if (!['ASSIGNED', 'IN_PROGRESS'].includes(assignment.status)) {
    throw new AppError(409, 'ASSIGNMENT_NOT_SUBMITTABLE', 'This assignment is not open for submission.');
  }
  const review = assignment.reviews.find((item) => item.versionId === assignment.versionId);
  if (!review || review.status === 'SUBMITTED' || !['APPROVE', 'REVISION_REQUIRED'].includes(review.recommendation) || !review.rationale?.trim()) {
    throw new AppError(422, 'REVIEW_INCOMPLETE', 'Save all scores, a recommendation, and a rationale before submitting.');
  }
  if (review.scores.length !== review.criteriaVersion.criteria.length) throw new AppError(422, 'ALL_CRITERIA_REQUIRED', 'Every criterion must be scored.');
  if (review.recommendation === 'REVISION_REQUIRED' && review.revisionRequests.length === 0) throw new AppError(422, 'REVISION_REQUEST_REQUIRED', 'Add at least one revision request.');
  const innovation = assignment.version.innovation;
  const approved = review.recommendation === 'APPROVE';
  await prisma.$transaction(async (tx) => {
    const completedAt = new Date();
    await tx.review.update({ where: { id: review.id }, data: { status: 'SUBMITTED', submittedAt: completedAt } });
    await tx.expertAssignment.update({
      where: { id: assignmentId },
      data: { status: approved ? 'COMPLETED' : 'REVISION_REQUESTED', completedAt }
    });
    await tx.innovation.update({
      where: { id: innovation.id },
      data: approved
        ? { status: 'PUBLISHED', publishedVersionId: assignment.versionId, publishedAt: completedAt, archivedAt: null }
        : { status: 'REVISION_REQUIRED' }
    });
    await createNotification({
      userId: innovation.ownerId,
      type: approved ? 'INNOVATION_PUBLISHED' : 'INNOVATION_REVISION_REQUESTED',
      title: approved ? 'Innovation published' : 'Innovation revisions requested',
      message: approved
        ? `${assignment.version.title} was recommended for approval and is now public.`
        : `${assignment.version.title} needs improvements based on the Expert feedback.`,
      entityType: 'Innovation',
      entityId: innovation.id
    }, tx);
    await notifySystemAdministrators({
      type: approved ? 'INNOVATION_PUBLISHED' : 'EXPERT_REVISION_REQUESTED',
      title: approved ? 'Expert-approved innovation published' : 'Expert requested innovation revisions',
      message: approved
        ? `${assignment.version.title} was published automatically after the Expert recommendation.`
        : `${assignment.version.title} was returned to the Innovator for improvements.`,
      entityType: 'Innovation',
      entityId: innovation.id
    }, tx);
  });
  return getAssignment(expert, assignmentId);
}
