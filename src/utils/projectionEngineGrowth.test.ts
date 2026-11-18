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

  it('compounds Shares ISA at the 1.5x equity rate while Cash ISA compounds at 0.5x', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      assetPots: {
        taxable: 0,
        taxFree: 2000, // 1000 Cash ISA + 1000 Shares ISA
        sharesIsa: 1000,
        pensions: 0,
      },
    };

    const results = calculateLifetimeProjection(input);

    // Year 1 (2026):
    // Cash ISA (1000) grows at 10 * 0.5 = 5% -> 1050
    // Shares ISA (1000) grows at 10 * 1.5 = 15% -> 1150
    // Total taxFree = 2200
    expect(results[1].potBalances.taxFree).toBeCloseTo(2200, 2);
  });

  it('discounts nominal property rental growth by realGrowthRate to reflect real purchasing power', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      realGrowthRate: 1.75,
      currentBalances: 100000,
      assetPots: {
        taxable: 100000,
        taxFree: 0,
        pensions: 0,
      },
      properties: [
        {
          id: 'prop-static',
          name: 'Static Rent Property',
          expectedMonthlyIncome: 1000, // £12,000 / year
          annualGrowthRate: 0.1, // 0.1% nominal -> 0.1 - 1.75 = -1.65% real
          updatedAt: Date.now(),
        },
      ],
      propertyOwnership: [
        {
          id: 'own-1',
          propertyId: 'prop-static',
          startDate: 0,
          person1Percent: 100,
          person2Percent: 0,
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): £12,000 rent (under PA, zero tax)
    expect(results[0].netCashFlow).toBeCloseTo(12000, 2);

    // Year 1 (2026): £12,000 * (1 + (0.1 - 1.75) / 100) = £12,000 * 0.9835 = £11,802
    expect(results[1].netCashFlow).toBeCloseTo(11802, 2);
  });
});
