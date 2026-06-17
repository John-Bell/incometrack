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

  it('verifies pot-specific growth rates', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      assetPots: {
        taxable: 1000,
        taxFree: 1000,
        pensions: 1000,
      },
    };

    const results = calculateLifetimeProjection(input);

    // After 1 year (2025)
    // Expected with new logic:
    // Taxable rate: 10 * 0.4 = 4% -> 1000 * 1.04 = 1040
    // Tax-Free rate: 10 * 0.5 = 5% -> 1000 * 1.05 = 1050
    // Pensions rate: 10 * 2.2 = 22% -> 1000 * 1.22 = 1220

    // Note: If the code is NOT yet updated, they will all be 10% -> 1100

    const year0 = results[0];

    // We expect these to fail initially if we want to see them fail,
    // but I'll write them as what we WANT.
    expect(year0.potBalances.taxable).toBeCloseTo(1040, 2);
    expect(year0.potBalances.taxFree).toBeCloseTo(1050, 2);
    expect(year0.potBalances.pensions).toBeCloseTo(1220, 2);
  });
});
