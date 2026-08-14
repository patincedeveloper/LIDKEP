import { z } from 'zod';
import { educationLevels, locationIsValid } from '../data/rwanda-locations.js';

const request = (body = z.unknown().optional()) => z.object({
  body, params: z.object({}).strict(), query: z.object({}).strict()
});

export const emptyUserSchema = request();
export const updateProfileSchema = request(z.object({
  displayName: z.string().trim().min(2).max(120),
  identificationType: z.enum(['NATIONAL_ID', 'PASSPORT', 'OTHER_GOVERNMENT_ID']),
  identificationNumber: z.string().trim().min(5).max(30),
  phoneNumber: z.string().trim().regex(/^(?:\+2507\d{8}|07\d{8})$/, 'Use a Rwanda mobile number such as +250 7XX XXX XXX.'),
  educationLevel: z.enum(educationLevels),
  province: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  administrativeSector: z.string().trim().min(2).max(100),
  occupation: z.string().trim().min(2).max(160),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  organization: z.string().trim().max(160).optional(),
  preferredLanguage: z.enum(['en', 'rw']).default('en'),
  publicProfile: z.boolean().default(false)
}).strict().refine((value) => locationIsValid(value.province, value.district, value.administrativeSector), {
  message: 'Select a valid Province, District, and Sector combination.',
  path: ['administrativeSector']
}));
