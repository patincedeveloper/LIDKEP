import { z } from 'zod';
import {
  addIdentificationIssues,
  fullNameSchema,
  optionalNarrative,
  projectCoverageSchema,
  rwandaPhoneSchema
} from './common.validator.js';

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
const optionalIdentificationType = z.union([
  z.enum(['NATIONAL_ID', 'PASSPORT', 'OTHER_GOVERNMENT_ID']),
  z.literal('')
]).optional();
const optionalPhone = z.union([rwandaPhoneSchema, z.literal('')]).optional();
const profileFields = {
  displayName: fullNameSchema,
  organization: z.string().trim().max(160).optional(),
  identificationType: optionalIdentificationType,
  identificationNumber: z.string().trim().max(30).optional(),
  phoneNumber: optionalPhone,
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
  }).strict().superRefine((value, context) => addIdentificationIssues(value, context, { optional: true }))
});

export const updateUserSchema = request({
  params: idParams,
  body: z.object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    role: managedRole,
    status: accountStatus,
    ...profileFields
  }).strict().superRefine((value, context) => addIdentificationIssues(value, context, { optional: true }))
});

export const updateUserStatusSchema = request({
  params: idParams,
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']),
    reason: z.string().trim().min(3).max(1000).optional()
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
    supportNeeded: optionalNarrative()
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
  body: z.object({
    isActive: z.boolean().optional(),
    label: z.string().trim().min(2).max(120).optional()
  }).strict().refine((value) => value.isActive !== undefined || value.label !== undefined, {
    message: 'Provide isActive or label to update.'
  })
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
