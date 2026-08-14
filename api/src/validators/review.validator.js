import { z } from 'zod';

const request = ({ body = z.unknown().optional(), params = z.object({}).strict(), query = z.object({}).strict() } = {}) =>
  z.object({ body, params, query });
const assignmentParams = z.object({ assignmentId: z.string().uuid() }).strict();
const score = z.object({ criterionKey: z.string().trim().min(1).max(120), score: z.number().min(0).max(5), comment: z.string().trim().max(2000).optional() }).strict();
const revision = z.object({ fieldKey: z.string().trim().min(1).max(120), instruction: z.string().trim().min(3).max(3000), dueAt: z.string().date().optional() }).strict();

export const reviewEmptySchema = request();
export const assignmentSchema = request({ params: assignmentParams });
export const saveReviewSchema = request({
  params: assignmentParams,
  body: z.object({
    scores: z.array(score).min(1).max(20),
    rationale: z.string().trim().max(5000).optional(),
    recommendation: z.enum(['APPROVE', 'REVISION_REQUIRED', 'REJECT']).optional(),
    revisionRequests: z.array(revision).max(20).default([])
  }).strict()
});
export const submitReviewSchema = request({ params: assignmentParams });
