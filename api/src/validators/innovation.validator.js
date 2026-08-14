import { z } from 'zod';

const request = ({ body = z.unknown().optional(), params = z.object({}).strict(), query = z.object({}).strict() } = {}) =>
  z.object({ body, params, query });

const idParams = z.object({ id: z.string().uuid() }).strict();
const optionalText = (maximum) => z.string().trim().max(maximum).optional();
const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;
const optionalNarrative = (maximum) => optionalText(maximum).refine(
  (value) => value === undefined || countWords(value) <= 50,
  'Use 50 words or fewer.'
);
const supportingLink = z.object({
  title: z.string().trim().min(2).max(120),
  url: z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), 'Use an http:// or https:// link.')
}).strict();

export const createInnovationSchema = request({
  body: z.object({
    title: z.string().trim().min(3).max(180),
    summary: optionalNarrative(600),
    problem: optionalNarrative(5000),
    solution: optionalNarrative(5000),
    beneficiaries: optionalNarrative(3000),
    sector: optionalText(120),
    category: optionalText(120),
    district: optionalText(120),
    maturity: optionalText(120),
    impactArea: optionalText(120),
    impact: optionalNarrative(3000),
    novelty: optionalNarrative(3000),
    currentEvidence: optionalNarrative(3000),
    implementationPlan: optionalNarrative(3000),
    scalability: optionalNarrative(3000),
    sustainability: optionalNarrative(3000),
    supportNeeded: optionalNarrative(2000),
    supportingLinks: z.array(supportingLink).max(10).optional(),
    ownershipDeclared: z.boolean().optional(),
    accuracyDeclared: z.boolean().optional()
  }).strict()
});

export const updateInnovationSchema = request({
  params: idParams,
  body: z.object({
    title: optionalText(180), summary: optionalNarrative(600), problem: optionalNarrative(5000),
    solution: optionalNarrative(5000), beneficiaries: optionalNarrative(3000), sector: optionalText(120),
    category: optionalText(120), district: optionalText(120), maturity: optionalText(120),
    impactArea: optionalText(120), impact: optionalNarrative(3000), novelty: optionalNarrative(3000),
    currentEvidence: optionalNarrative(3000), implementationPlan: optionalNarrative(3000),
    scalability: optionalNarrative(3000), sustainability: optionalNarrative(3000), supportNeeded: optionalNarrative(2000),
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
