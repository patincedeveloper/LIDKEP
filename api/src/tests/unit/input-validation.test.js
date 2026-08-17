import { describe, expect, it } from 'vitest';
import { registerSchema } from '../../validators/auth.validator.js';
import { updateInnovationSchema } from '../../validators/innovation.validator.js';
import { updateProfileSchema } from '../../validators/user.validator.js';

const requestFor = (body, params = {}) => ({ body, params, query: {} });
const validProfile = {
  displayName: 'Aline Uwase',
  identificationType: 'NATIONAL_ID',
  identificationNumber: '1199880012345001',
  phoneNumber: '0788123456',
  educationLevel: "Bachelor's degree",
  province: 'City of Kigali',
  district: 'Gasabo',
  administrativeSector: 'Kimironko',
  occupation: 'Engineer',
  yearsOfExperience: 4,
  organization: '',
  preferredLanguage: 'en',
  publicProfile: true
};
const words = (count) => Array.from({ length: count }, (_, index) => `word${index + 1}`).join(' ');

describe('identity input validation', () => {
  it('accepts human names and rejects numbers or symbols in names', () => {
    const valid = registerSchema.safeParse(requestFor({
      email: 'aline@example.rw', password: 'ValidPassword@123', displayName: 'Aline Uwase', role: 'INNOVATOR'
    }));
    const invalid = registerSchema.safeParse(requestFor({
      email: 'aline@example.rw', password: 'ValidPassword@123', displayName: 'Aline123', role: 'INNOVATOR'
    }));
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('requires a 16-digit National ID and a numeric Rwanda phone number', () => {
    expect(updateProfileSchema.safeParse(requestFor(validProfile)).success).toBe(true);
    expect(updateProfileSchema.safeParse(requestFor({
      ...validProfile, identificationNumber: '1234A', phoneNumber: '0788ABC456'
    })).success).toBe(false);
  });

  it('requires passport numbers to contain both letters and numbers', () => {
    expect(updateProfileSchema.safeParse(requestFor({
      ...validProfile, identificationType: 'PASSPORT', identificationNumber: 'PC123456'
    })).success).toBe(true);
    expect(updateProfileSchema.safeParse(requestFor({
      ...validProfile, identificationType: 'PASSPORT', identificationNumber: '12345678'
    })).success).toBe(false);
  });
});

describe('innovation input validation', () => {
  const params = { id: '11111111-1111-4111-8111-111111111111' };

  it('accepts narratives from 30 through 1,000 words', () => {
    expect(updateInnovationSchema.safeParse(requestFor({ problem: words(30) }, params)).success).toBe(true);
    expect(updateInnovationSchema.safeParse(requestFor({ problem: words(1000) }, params)).success).toBe(true);
  });

  it('rejects narratives outside the word range', () => {
    expect(updateInnovationSchema.safeParse(requestFor({ problem: words(29) }, params)).success).toBe(false);
    expect(updateInnovationSchema.safeParse(requestFor({ problem: words(1001) }, params)).success).toBe(false);
  });

  it('allows only the six project coverage levels', () => {
    expect(updateInnovationSchema.safeParse(requestFor({ district: 'East Africa' }, params)).success).toBe(true);
    expect(updateInnovationSchema.safeParse(requestFor({ district: 'Gasabo' }, params)).success).toBe(false);
  });
});
