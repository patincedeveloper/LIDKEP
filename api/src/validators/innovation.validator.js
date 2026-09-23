import { z } from 'zod';
import { optionalNarrative, projectCoverageSchema } from './common.validator.js';

const request = ({ body = z.unknown().optional(), params = z.object({}).strict(), query = z.object({}).strict() } = {}) =>
  z.object({ body, params, query });

const idParams = z.object({ id: z.string().uuid() }).strict();
const optionalText = (maximum) => z.string().trim().max(maximum).optional();
const supportingLink = z.object({
  title: z.string().trim().min(2).max(120),
  url: z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), 'Use an http:// or https:// link.')
}).strict();

export const createInnovationSchema = request({
  body: z.object({
    title: z.string().trim().min(3).max(180),
    summary: optionalNarrative(),
    problem: optionalNarrative(),
    solution: optionalNarrative(),
    beneficiaries: optionalNarrative(),
    sector: optionalText(120),
    category: optionalText(120),
    district: projectCoverageSchema.optional(),
    maturity: optionalText(120),
    impactArea: optionalText(120),
    impact: optionalNarrative(),
    novelty: optionalNarrative(),
    currentEvidence: optionalNarrative(),
    implementationPlan: optionalNarrative(),
    scalability: optionalNarrative(),
    sustainability: optionalNarrative(),
    supportNeeded: optionalNarrative(),
    supportingLinks: z.array(supportingLink).max(10).optional(),
    ownershipDeclared: z.boolean().optional(),
    accuracyDeclared: z.boolean().optional()
  }).strict()
});

export const updateInnovationSchema = request({
  params: idParams,
  body: z.object({
    title: optionalText(180), summary: optionalNarrative(), problem: optionalNarrative(),
    solution: optionalNarrative(), beneficiaries: optionalNarrative(), sector: optionalText(120),
    category: optionalText(120), district: projectCoverageSchema.optional(), maturity: optionalText(120),
    impactArea: optionalText(120), impact: optionalNarrative(), novelty: optionalNarrative(),
    currentEvidence: optionalNarrative(), implementationPlan: optionalNarrative(),
    scalability: optionalNarrative(), sustainability: optionalNarrative(), supportNeeded: optionalNarrative(),
    supportingLinks: z.array(supportingLink).max(10).optional(),
    ownershipDeclared: z.boolean().optional(), accuracyDeclared: z.boolean().optional()
  }).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.')
});

export const innovationIdSchema = request({ params: idParams });

export const createMilestoneSchema = request({
  params: idParams,
  body: z.object({
    title: z.string().trim().min(3).max(180),
    description: optionalText(2000),
    targetDate: z.string().date().optional(),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
    visibility: z.enum(['PUBLIC', 'AUTHENTICATED', 'REVIEW_TEAM', 'ADMIN_ONLY']).default('REVIEW_TEAM')
  }).strict()
});

export const respondRevisionSchema = request({
  params: z.object({ id: z.string().uuid(), revisionId: z.string().uuid() }).strict(),
  body: z.object({ response: z.string().trim().min(2).max(5000) }).strict()
});
