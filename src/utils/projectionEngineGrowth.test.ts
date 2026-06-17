import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateLifetimeProjection, type ProjectionEngineInput } from './projectionEngine';
import { TAX_YEAR_CONSTANTS } from '../constants/taxConstants';

describe('calculateLifetimeProjection Growth Rates', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const dobP1 = new Date('1980-01-01T00:00:00.000Z').getTime();

  const baseInput: ProjectionEngineInput = {
    currentBalances: 0,
    realGrowthRate: 10, // 10% for easy math
    profile: {
      partner1Dob: dobP1,
    },
    incomes: [],
    budgets: [],
    properties: [],
    propertyOwnership: [],
    taxRules: TAX_YEAR_CONSTANTS,
  };

  it('verifies pot-specific growth rates and timing', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      assetPots: {
        taxable: 1000,
        taxFree: 1000,
        pensions: 1000,
      },
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): Baseline, no growth applied yet
    const year0 = results[0];
    expect(year0.potBalances.taxable).toBe(1000);
    expect(year0.potBalances.taxFree).toBe(1000);
    expect(year0.potBalances.pensions).toBe(1000);

    // Year 1 (2026): Growth from Year 0 applied at the end of Year 0 loop
    // Expected with new logic:
    // Taxable rate: 10 * 0.4 = 4% -> 1000 * 1.04 = 1040
    // Tax-Free rate: 10 * 0.5 = 5% -> 1000 * 1.05 = 1050
    // Pensions rate: 10 * 1.5 = 15% -> 1000 * 1.15 = 1150
    const year1 = results[1];
    expect(year1.potBalances.taxable).toBeCloseTo(1040, 2);
    expect(year1.potBalances.taxFree).toBeCloseTo(1050, 2);
    expect(year1.potBalances.pensions).toBeCloseTo(1150, 2);
  });
});
