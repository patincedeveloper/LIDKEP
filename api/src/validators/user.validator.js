import { z } from 'zod';
import { educationLevels, locationIsValid } from '../data/rwanda-locations.js';
import { addIdentificationIssues, fullNameSchema, rwandaPhoneSchema } from './common.validator.js';

const request = (body = z.unknown().optional()) => z.object({
  body, params: z.object({}).strict(), query: z.object({}).strict()
});

export const emptyUserSchema = request();
export const notificationIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ id: z.string().uuid() }).strict(),
  query: z.object({}).strict()
});
export const profileEvidenceIdSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({ id: z.string().uuid() }).strict(),
  query: z.object({}).strict()
});
export const updateProfileSchema = request(z.object({
  displayName: fullNameSchema,
  identificationType: z.enum(['NATIONAL_ID', 'PASSPORT', 'OTHER_GOVERNMENT_ID']),
  identificationNumber: z.string().trim().max(30),
  phoneNumber: rwandaPhoneSchema,
  educationLevel: z.enum(educationLevels),
  province: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  administrativeSector: z.string().trim().min(2).max(100),
  occupation: z.string().trim().min(2).max(160),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  organization: z.string().trim().max(160).optional(),
  preferredLanguage: z.enum(['en', 'rw']).default('en'),
  publicProfile: z.boolean().default(false)
}).strict().superRefine((value, context) => {
  addIdentificationIssues(value, context);
  if (!locationIsValid(value.province, value.district, value.administrativeSector)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a valid Province, District, and Sector combination.',
      path: ['administrativeSector']
    });
  }
}));
