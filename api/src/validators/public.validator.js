import { z } from 'zod';

const emptyObject = z.object({}).strict();

export const emptyRequestSchema = z.object({
  body: z.unknown().optional(),
  params: emptyObject,
  query: emptyObject
});

export const publicInnovationListSchema = z.object({
  body: z.unknown().optional(),
  params: emptyObject,
  query: z.object({
    q: z.string().trim().max(200).default(''),
    sector: z.string().trim().max(100).default(''),
    district: z.string().trim().max(100).default(''),
    maturity: z.string().trim().max(100).default(''),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(12)
  }).strict()
});

export const publicInnovationDetailSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }),
  query: emptyObject
});

export const demoActionSchema = z.object({
  body: z.object({
    action: z.string().trim().min(2).max(100),
    entityId: z.string().trim().min(1).max(160),
    note: z.string().trim().max(1000).optional()
  }).strict(),
  params: emptyObject,
  query: emptyObject
});
