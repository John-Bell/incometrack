import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateLifetimeProjection, type ProjectionEngineInput } from './projectionEngine';
import { TAX_YEAR_CONSTANTS } from '../constants/taxConstants';

describe('calculateLifetimeProjection - protectionFloor bug', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    // Set system time to Jan 1, 2025
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // Partner 1 DOB
  const dobP1 = new Date('1970-01-01T00:00:00.000Z').getTime();

  it('should breach the protection floor to cover deficits when all other assets are exhausted', () => {
    const input: ProjectionEngineInput = {
      currentBalances: 60000,
      realGrowthRate: 0,
      profile: {
        partner1Dob: dobP1,
      },
      incomes: [],
      budgets: [
        {
          id: 'b1',
          accountId: 'a1',
          name: 'Main Budget',
          amount: 30000,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
      properties: [],
      propertyOwnership: [],
      taxRules: TAX_YEAR_CONSTANTS,
      drawdownStrategy: 'pensions_first',
      protectionFloor: 50000,
      assetPots: {
        taxable: 0,
        taxFree: 50000,
        premiumBonds: 0,
        pensions: 0,
      },
      pensionPots: [
        {
          id: 'p1',
          ownerId: 'person1',
          balance: 10000,
          category: 'DC Pension (Post-Drawdown)',
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    /**
     * EXPECTED LOGIC:
     * Year 0 (2025):
     * - Budget: 30,000
     * - Pension Pot: 10,000 (Crystallised)
     * - Net from pension: 10,000 * (1 - 0.15 tax drag) = 8,500
     * - Remaining deficit: 30,000 - 8,500 = 21,500
     * - The engine MUST breach the 50,000 protection floor to cover this 21,500 deficit
     *   because there are no other assets.
     * - Resulting taxFree balance should be: 50,000 - 21,500 = 28,500
     *
     * THE BUG:
     * The current engine uses `availableCash = Math.max(0, totalCash - floor)`.
     * Since totalCash (taxable + taxFree + premiumBonds) is 50,000 and floor is 50,000,
     * availableCash becomes 0. The engine will fail to draw the remaining 21,500
     * and the taxFree balance will remain stuck at 50,000.
     */

    // This assertion is expected to FAIL against the current buggy engine
    expect(results[0].potBalances.taxFree).toBeLessThan(50000);
    expect(results[0].potBalances.taxFree).toBeCloseTo(28500, 0);

    // Year 1 (2026):
    // - Deficit: 30,000
    // - Starting taxFree: 28,500
    // - taxFree should hit 0
    expect(results[1].potBalances.taxFree).toBe(0);

    // Runway should be broken once all balances are 0
    const runwayBrokenYear = results.find(r => r.isRunwayBroken);
    expect(runwayBrokenYear).toBeDefined();
    expect(runwayBrokenYear?.liquidAssets).toBe(0);
  });
});
