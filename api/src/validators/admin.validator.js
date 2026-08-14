import { z } from 'zod';

const request = ({ body = z.unknown().optional(), params = z.object({}).strict(), query = z.object({}).strict() } = {}) =>
  z.object({ body, params, query });
const idParams = z.object({ id: z.string().uuid() }).strict();
const password = z.string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character.');
const managedRole = z.enum(['SYSTEM_ADMINISTRATOR', 'INNOVATOR', 'EXPERT', 'INVESTOR_PARTNER']);
const accountStatus = z.enum(['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'DISABLED']);
const profileFields = {
  displayName: z.string().trim().min(2).max(120),
  organization: z.string().trim().max(160).optional(),
  identificationType: z.string().trim().max(60).optional(),
  identificationNumber: z.string().trim().max(30).optional(),
  phoneNumber: z.string().trim().max(30).optional(),
  educationLevel: z.string().trim().max(120).optional(),
  province: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  administrativeSector: z.string().trim().max(100).optional(),
  occupation: z.string().trim().max(160).optional(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  preferredLanguage: z.enum(['en', 'rw']).optional(),
  publicProfile: z.boolean().optional()
};

export const adminEmptySchema = request();
export const adminIdSchema = request({ params: idParams });

export const decideVerificationSchema = request({
  params: idParams,
  body: z.object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().trim().min(3).max(1000).optional()
  }).strict()
});

export const createUserSchema = request({
  body: z.object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    password,
    role: managedRole,
    status: accountStatus.default('ACTIVE'),
    ...profileFields
  }).strict()
});

export const updateUserSchema = request({
  params: idParams,
  body: z.object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    role: managedRole,
    status: accountStatus,
    ...profileFields
  }).strict()
});

export const updateUserStatusSchema = request({
  params: idParams,
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']),
    reason: z.string().trim().min(3).max(1000).optional()
  }).strict()
});

export const decideInnovationSchema = request({
  params: idParams,
  body: z.object({
    status: z.enum(['UNDER_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED']),
    reason: z.string().trim().min(3).max(2000).optional()
  }).strict()
});

export const assignExpertSchema = request({
  params: idParams,
  body: z.object({
    expertId: z.string().uuid(),
    dueAt: z.string().date().optional()
  }).strict()
});

const optionalText = (maximum) => z.string().trim().max(maximum).optional();
export const createAdminInnovationSchema = request({
  body: z.object({
    ownerId: z.string().uuid(),
    title: z.string().trim().min(3).max(180),
    summary: optionalText(600),
    problem: optionalText(5000),
    solution: optionalText(5000),
    beneficiaries: optionalText(3000),
    sector: optionalText(120),
    category: optionalText(120),
    district: optionalText(120),
    maturity: optionalText(120),
    impactArea: optionalText(120),
    impact: optionalText(3000),
    novelty: optionalText(3000),
    currentEvidence: optionalText(3000),
    implementationPlan: optionalText(3000),
    scalability: optionalText(3000),
    sustainability: optionalText(3000),
    supportNeeded: optionalText(2000)
  }).strict()
});

export const createTaxonomySchema = request({
  body: z.object({
    type: z.enum(['SECTOR', 'CATEGORY', 'DISTRICT', 'MATURITY_LEVEL', 'IMPACT_AREA', 'INNOVATION_TYPE']),
    label: z.string().trim().min(2).max(120)
  }).strict()
});

export const updateTaxonomySchema = request({
  params: idParams,
  body: z.object({ isActive: z.boolean() }).strict()
});

const criterion = z.object({
  name: z.string().trim().min(2).max(160),
  guidance: z.string().trim().max(1000).optional(),
  weight: z.number().positive().max(100)
}).strict();

export const createCriteriaSchema = request({
  body: z.object({
    version: z.string().trim().min(2).max(30),
    name: z.string().trim().min(3).max(180),
    criteria: z.array(criterion).min(2).max(12)
  }).strict().refine((value) => Math.abs(value.criteria.reduce((sum, item) => sum + item.weight, 0) - 100) < 0.001, {
    message: 'Evaluation criteria weights must total 100%.',
    path: ['criteria']
  })
});

export const updateSettingsSchema = request({
  body: z.object({
    publicStatistics: z.boolean(),
    allowComments: z.boolean(),
    maintenanceMode: z.boolean(),
    maxFileSizeMb: z.number().int().min(1).max(100)
  }).strict()
});
