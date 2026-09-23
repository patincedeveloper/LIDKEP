import { z } from 'zod';

export const PROJECT_COVERAGE_LEVELS = [
  'District',
  'Province',
  'National',
  'East Africa',
  'Africa',
  'International'
];

export const fullNameSchema = z.string()
  .trim()
  .min(2, 'Enter at least 2 characters for the full name.')
  .max(120, 'Use 120 characters or fewer for the full name.')
  .regex(
    /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u,
    'Names may contain letters, spaces, apostrophes, and hyphens only.'
  );

export const rwandaPhoneSchema = z.string()
  .trim()
  .regex(
    /^(?:07\d{8}|\+?2507\d{8})$/,
    'Use a valid Rwanda mobile number: 07 followed by 8 digits.'
  );

export function normalizeIdentificationNumber(type, value) {
  const normalized = value.trim();
  return type === 'NATIONAL_ID' ? normalized : normalized.toUpperCase();
}

export function normalizeRwandaPhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('0') ? `+250${digits.slice(1)}` : `+${digits}`;
}

export const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;

export const optionalNarrative = (maximumCharacters = 20000) => z.string()
  .trim()
  .max(maximumCharacters, `Use ${maximumCharacters.toLocaleString('en-US')} characters or fewer.`)
  .optional()
  .superRefine((value, context) => {
    if (value === undefined || value.length === 0) return;
    const words = countWords(value);
    if (words < 30) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use at least 30 words.'
      });
    } else if (words > 1000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use 1,000 words or fewer.'
      });
    }
  });

export const projectCoverageSchema = z.enum(PROJECT_COVERAGE_LEVELS, {
  errorMap: () => ({ message: 'Select a valid project coverage level.' })
});

export function addIdentificationIssues(value, context, { optional = false } = {}) {
  const type = value.identificationType;
  const number = value.identificationNumber?.trim() ?? '';
  if (optional && !type && !number) return;

  if (!type) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['identificationType'],
      message: 'Select an identification type.'
    });
    return;
  }

  if (type === 'NATIONAL_ID' && !/^\d{16}$/.test(number)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['identificationNumber'],
      message: 'Rwanda National ID must contain exactly 16 digits.'
    });
  } else if (type === 'PASSPORT' && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/.test(number)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['identificationNumber'],
      message: 'Passport number must contain both letters and numbers (6 to 20 characters).'
    });
  } else if (type === 'OTHER_GOVERNMENT_ID' && !/^[A-Za-z\d][A-Za-z\d /-]{4,29}$/.test(number)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['identificationNumber'],
      message: 'Government ID number must contain 5 to 30 letters or numbers.'
    });
  }
}
