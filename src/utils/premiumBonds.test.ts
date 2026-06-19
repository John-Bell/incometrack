import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateLifetimeProjection, type ProjectionEngineInput } from './projectionEngine';
import { TAX_YEAR_CONSTANTS } from '../constants/taxConstants';

describe('calculateLifetimeProjection Premium Bonds', () => {
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

  it('verifies Premium Bonds no compounding and winnings payout to taxable pot', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      assetPots: {
        taxable: 1000,
        taxFree: 0,
        premiumBonds: 50000,
        pensions: 0,
      },
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): Baseline
    const year0 = results[0];
    expect(year0.potBalances.premiumBonds).toBe(50000);
    expect(year0.potBalances.taxable).toBe(1000);

    // Year 1 (2026):
    // Taxable growth: 10 * 0.4 = 4% -> 1000 * 0.04 = 40
    // PB "winnings": 10 * 0.5 = 5% -> 50000 * 0.05 = 2500
    // New Taxable = 1000 + 40 + 2500 = 3540
    // PB Balance should remain 50000
    const year1 = results[1];
    expect(year1.potBalances.premiumBonds).toBe(50000);
    expect(year1.potBalances.taxable).toBeCloseTo(3540, 2);
  });

  it('verifies Premium Bonds drawdown in sequential strategy (tax_free_first)', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      realGrowthRate: 0,
      assetPots: {
        taxable: 10000,
        taxFree: 10000,
        premiumBonds: 10000,
        pensions: 0,
      },
      drawdownStrategy: 'tax_free_first',
      budgets: [
        {
          id: 'b1',
          name: 'Budget',
          amount: 15000,
          frequency: 'annually',
          updatedAt: 0,
        }
      ]
    };

    const results = calculateLifetimeProjection(input);

    // Year 0: Deficit 15000.
    // Strategy tax_free_first order: premiumBonds, taxFree, taxable, pensions
    // 1. Draw from PB: min(10000, 15000) = 10000. PB -> 0. Deficit -> 5000.
    // 2. Draw from taxFree: min(10000, 5000) = 5000. taxFree -> 5000. Deficit -> 0.
    const year0 = results[0];
    expect(year0.potBalances.premiumBonds).toBe(0);
    expect(year0.potBalances.taxFree).toBe(5000);
    expect(year0.potBalances.taxable).toBe(10000);
  });

  it('verifies Premium Bonds drawdown in proportional strategy', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      realGrowthRate: 0,
      assetPots: {
        taxable: 10000,
        taxFree: 10000,
        premiumBonds: 20000,
        pensions: 0,
      },
      drawdownStrategy: 'proportional',
      budgets: [
        {
          id: 'b1',
          name: 'Budget',
          amount: 4000,
          frequency: 'annually',
          updatedAt: 0,
        }
      ]
    };

    const results = calculateLifetimeProjection(input);

    // Total cash = 10k + 10k + 20k = 40k. Deficit 4k (10%).
    // Proportional shares:
    // Taxable: 10k * 0.1 = 1k -> 9k
    // TaxFree: 10k * 0.1 = 1k -> 9k
    // PremiumBonds: 20k * 0.1 = 2k -> 18k
    const year0 = results[0];
    expect(year0.potBalances.taxable).toBe(9000);
    expect(year0.potBalances.taxFree).toBe(9000);
    expect(year0.potBalances.premiumBonds).toBe(18000);
  });
});
