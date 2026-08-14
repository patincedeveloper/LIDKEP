import { z } from 'zod';

const request = ({ body = z.unknown().optional(), params = z.object({}).strict(), query = z.object({}).strict() } = {}) =>
  z.object({ body, params, query });
const engagementParams = z.object({ engagementId: z.string().uuid() }).strict();

export const engagementEmptySchema = request();
export const engagementSchema = request({ params: engagementParams });
export const createEngagementSchema = request({
  body: z.object({
    innovationId: z.string().uuid(),
    type: z.enum(['CONTACT', 'FUNDING_OFFER', 'PARTNERSHIP_REQUEST']),
    summary: z.string().trim().min(10).max(3000),
    termsSummary: z.string().trim().max(5000).optional(),
    nonBindingAccepted: z.literal(true)
  }).strict()
});
export const respondEngagementSchema = request({
  params: engagementParams,
  body: z.object({
    status: z.enum(['ACCEPTED', 'DECLINED', 'CLARIFICATION_REQUESTED']),
    shareEmail: z.boolean().default(false),
    sharePhone: z.boolean().default(false)
  }).strict()
});
