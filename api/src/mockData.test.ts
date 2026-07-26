import { describe, expect, it } from 'vitest';
import fixture from '../../lidkep_mock_data.json';

describe('Phase 0 mock fixture', () => {
  it('contains exactly the five authoritative roles', () => {
    expect(fixture.roles).toEqual(['SYSTEM_ADMINISTRATOR', 'INNOVATOR', 'EXPERT', 'INVESTOR_PARTNER', 'PUBLIC_USER']);
  });
  it('contains published innovations and a 100% evaluation criteria version', () => {
    expect(fixture.innovations.some((item) => item.status === 'PUBLISHED')).toBe(true);
    expect(Object.values(fixture.criteria[0].weights).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  });
  it('contains complete demo coverage for every authoritative actor journey', () => {
    expect(new Set(fixture.demoAccounts.map((account) => account.role))).toEqual(new Set(fixture.roles));
    expect(fixture.innovations.some((item) => item.status === 'DRAFT')).toBe(true);
    expect(fixture.innovations.some((item) => item.status === 'UNDER_REVIEW')).toBe(true);
    expect(fixture.innovations.some((item) => item.status === 'REVISION_REQUIRED')).toBe(true);
    expect(fixture.assignments.length).toBeGreaterThan(0);
    expect(fixture.engagements.length).toBeGreaterThan(0);
    expect(fixture.verifications.length).toBeGreaterThan(0);
    expect(fixture.auditLogs.length).toBeGreaterThan(0);
  });
});
