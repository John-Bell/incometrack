import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateLifetimeProjection, type ProjectionEngineInput } from './projectionEngine';
import { TAX_YEAR_CONSTANTS } from '../constants/taxConstants';

describe('calculateLifetimeProjection', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    // Set system time to Jan 1, 2025
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // Helper mock DOBs
  // Partner 1 exactly 59 years old on Jan 1, 2025 -> Jan 1, 1966
  const dobP1 = new Date('1966-01-01T00:00:00.000Z').getTime();
  // Partner 2 exactly 58 years old on Jan 1, 2025 -> Jan 1, 1967
  const dobP2 = new Date('1967-01-01T00:00:00.000Z').getTime();

  const baseInput: ProjectionEngineInput = {
    currentBalances: 0,
    realGrowthRate: 0,
    profile: {
      partner1Dob: dobP1,
      partner2Dob: dobP2,
    },
    incomes: [],
    budgets: [],
    properties: [],
    propertyOwnership: [],
    taxRules: TAX_YEAR_CONSTANTS,
  };

  it('TEST CASE 1: Core Timeline Skeleton and Age Progression', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 500000,
    };

    const results = calculateLifetimeProjection(input);

    // Assert starts at yearIndex 0 with the current calendar year
    expect(results[0].yearIndex).toBe(0);
    expect(results[0].calendarYear).toBe(2025);

    // Assert final record has ageP1 equal to 100
    const finalResult = results[results.length - 1];
    expect(finalResult.ageP1).toBe(100);

    // Verify liquidAssets remain exactly £500,000 across all years
    results.forEach((r) => {
      expect(r.liquidAssets).toBe(500000);
    });
  });

  it('TEST CASE 2: Bounded Regular Income and Mid-Year Pro-Rating', () => {
    // Second calendar year is 2026
    const year2026Start = new Date('2026-01-01T00:00:00.000Z').getTime();
    const year2026End = new Date('2026-12-31T23:59:59.999Z').getTime();
    const midYear2026 = year2026Start + (year2026End - year2026Start) / 2;

    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 100000,
      incomes: [
        {
          id: 'inc-1',
          ownerId: 'person1',
          name: 'Pension',
          amount: 2000,
          frequency: 'monthly',
          type: 'pension',
          taxCategory: 'Taxable',
          startDate: midYear2026,
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): Pension hasn't started
    const year0Delta = results[0].liquidAssets - input.currentBalances;
    expect(year0Delta).toBe(0);

    // Year 1 (2026): Mid-year pro-rating (~£12,000)
    // Since £12k is under the £12,570 personal allowance, tax is £0. Net equals gross.
    const year1Delta = results[1].liquidAssets - results[0].liquidAssets;
    expect(year1Delta).toBeCloseTo(12000, 2);

    // Year 2 (2027): Full annualized value (£24,000)
    // £24,000 gross incurs basic rate tax above the £12,570 allowance:
    // Tax = (£24,000 - £12,570) * 0.20 = £2,286
    // Net added = £24,000 - £2,286 = £21,714
    const year2Delta = results[2].liquidAssets - results[1].liquidAssets;
    expect(year2Delta).toBeCloseTo(21714, 2);
  });

  it('TEST CASE 3: Property Escalation and Ownership Split', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 100000,
      properties: [
        {
          id: 'prop-1',
          name: 'Rental Prop',
          expectedMonthlyIncome: 1000, // £12k / year
          annualGrowthRate: 10,
          updatedAt: Date.now(),
        },
      ],
      propertyOwnership: [
        {
          id: 'own-1',
          propertyId: 'prop-1',
          startDate: 0,
          person1Percent: 70, // £8,400 (under PA)
          person2Percent: 30, // £3,600 (under PA)
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): £12,000 gross. Apportioned 70/30, both under PA, zero tax.
    const year0Delta = results[0].liquidAssets - input.currentBalances;
    expect(year0Delta).toBeCloseTo(12000, 2);

    // Year 1 (2026): 10% growth -> £13,200 gross. Apportioned £9,240 / £3,960. Still zero tax.
    const year1Delta = results[1].liquidAssets - results[0].liquidAssets;
    expect(year1Delta).toBeCloseTo(13200, 2);
  });

  it('TEST CASE 4: Budget Drawdown, Portfolio Growth, and Runway Crash', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 100000,
      realGrowthRate: 0,
      budgets: [
        {
          id: 'budg-1',
          accountId: 'acc-1',
          name: 'Aggressive Budget',
          amount: 50000,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): 100k - 50k = 50k
    expect(results[0].liquidAssets).toBeCloseTo(50000, 2);
    expect(results[0].isRunwayBroken).toBe(false);

    // Year 1 (2026): 50k - 50k = 0
    expect(results[1].liquidAssets).toBe(0);
    expect(results[1].isRunwayBroken).toBe(true);

    // Year 2 (2027): Starts at 0, budget 50k. Drops to 0, broken is true.
    expect(results[2].liquidAssets).toBe(0);
    expect(results[2].isRunwayBroken).toBe(true);

    // Assert the balance never drops below 0 into negative numbers
    results.forEach((r) => {
      expect(r.liquidAssets).toBeGreaterThanOrEqual(0);
    });
  });

  it('TEST CASE 5: Property Sale - Income Termination and Cash Injection', () => {
    // Sale on July 1st, 2026 (approx 50% through the year)
    const saleDate = new Date('2026-07-01T00:00:00.000Z').getTime();

    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 100000,
      properties: [
        {
          id: 'prop-1',
          name: 'Rental Prop',
          expectedMonthlyIncome: 1000, // £12k / year
          annualGrowthRate: 0,
          estimatedSaleDate: saleDate,
          estimatedNetCashOnSale: 200000,
          updatedAt: Date.now(),
        },
      ],
      propertyOwnership: [
        {
          id: 'own-1',
          propertyId: 'prop-1',
          startDate: 0,
          person1Percent: 50,
          person2Percent: 50,
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): Full rental income (£12,000)
    const year0Delta = results[0].liquidAssets - input.currentBalances;
    expect(year0Delta).toBeCloseTo(12000, 2);

    // Year 1 (2026): Pro-rated rent (~£6,000) + Cash Injection (£200,000)
    // Rent is for Jan-June inclusive (approx 181 days out of 365)
    // 181/365 * 12000 = 5950.68
    const year1Delta = results[1].liquidAssets - results[0].liquidAssets;
    expect(year1Delta).toBeGreaterThan(205900);
    expect(year1Delta).toBeLessThan(206100);

    // Year 2 (2027): No rental income, no more cash injection
    const year2Delta = results[2].liquidAssets - results[1].liquidAssets;
    expect(year2Delta).toBe(0);
  });

  it('TEST CASE 6: Asset Pot Breakdown and Drawdown Strategy (taxable_first)', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 300000,
      assetPots: {
        taxable: 100000,
        taxFree: 100000,
        pensions: 100000,
      },
      drawdownStrategy: 'taxable_first',
      realGrowthRate: 0,
      budgets: [
        {
          id: 'budg-1',
          accountId: 'acc-1',
          name: 'Budget',
          amount: 50000,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): 300k - 50k = 250k total.
    // strategy: taxable_first. Taxable should be 100k - 50k = 50k. others 100k.
    expect(results[0].liquidAssets).toBe(250000);
    expect(results[0].potBalances.taxable).toBe(50000);
    expect(results[0].potBalances.taxFree).toBe(100000);
    expect(results[0].potBalances.pensions).toBe(100000);
    expect(results[0].potBalances.total).toBe(250000);

    // Year 1 (2026): 250k - 50k = 200k total.
    // Taxable was 50k. 50k - 50k = 0k. others 100k.
    expect(results[1].liquidAssets).toBe(200000);
    expect(results[1].potBalances.taxable).toBe(0);
    expect(results[1].potBalances.taxFree).toBe(100000);
    expect(results[1].potBalances.pensions).toBe(100000);

    // Year 2 (2027): 200k - 50k = 150k total.
    // Taxable was 0k. Deficit 50k comes from taxFree (next in order).
    // taxFree: 100k - 50k = 50k. pensions: 100k.
    expect(results[2].liquidAssets).toBe(150000);
    expect(results[2].potBalances.taxable).toBe(0);
    expect(results[2].potBalances.taxFree).toBe(50000);
    expect(results[2].potBalances.pensions).toBe(100000);

    // Year 3 (2028): 150k - 50k = 100k total.
    // taxFree was 50k. 50k - 50k = 0k. pensions: 100k.
    expect(results[3].potBalances.taxFree).toBe(0);
    expect(results[3].potBalances.pensions).toBe(100000);

    // Year 4 (2029): 100k - 50k (net) = ?
    // pensions: 100k - (50k / 0.85) = 100k - 58823.53 = 41176.47
    expect(results[4].potBalances.pensions).toBeCloseTo(41176.47, 1);
    expect(results[4].liquidAssets).toBeCloseTo(41176.47, 1);
  });

  it('TEST CASE 7: Proportional Drawdown Strategy', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 300000,
      assetPots: {
        taxable: 150000,
        taxFree: 50000,
        pensions: 100000,
      },
      drawdownStrategy: 'proportional',
      realGrowthRate: 0,
      budgets: [
        {
          id: 'budg-1',
          accountId: 'acc-1',
          name: 'Budget',
          amount: 30000,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Total = 300k. Deficit = 30k (10%).
    // Each pot should be reduced by its proportional share of the deficit.
    // taxable share: 15k. New = 135k
    // taxFree share: 5k. New = 45k
    // pensions share: 10k net.
    // To get 10k net from pensions, we need to draw 10k / 0.85 = 11,764.71 gross.
    // pensions: 100k - 11764.71 = 88235.29
    expect(results[0].liquidAssets).toBeCloseTo(268235.29, 1);
    expect(results[0].potBalances.taxable).toBe(135000);
    expect(results[0].potBalances.taxFree).toBe(45000);
    expect(results[0].potBalances.pensions).toBeCloseTo(88235.29, 1);
  });

  it('TEST CASE 8: Bed & ISA Sweep - 2027 Start, No Emergency Floor, and Fixed £20,000 Allowance', () => {
    // Partner 1: Born Jan 1 1966 -> Age 59 in 2025.
    // Allowance is £20,000 per partner regardless of age.
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 200000,
      assetPots: {
        taxable: 150000,
        taxFree: 50000,
        pensions: 0,
      },
      realGrowthRate: 0, // Disable growth for easy math
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025): No sweep yet
    expect(results[0].calendarYear).toBe(2025);
    expect(results[0].potBalances.taxable).toBe(150000);
    expect(results[0].potBalances.taxFree).toBe(50000);
    expect(results[0].milestones).toHaveLength(0);

    // Year 1 (2026): No sweep yet
    expect(results[1].calendarYear).toBe(2026);
    expect(results[1].potBalances.taxable).toBe(150000);
    expect(results[1].potBalances.taxFree).toBe(50000);

    // Year 2 (2027): Sweep starts.
    // Taxable = 150k. Floor = 0k. Available = 150k.
    // P1 + P2 Household Allowance = £20,000 + £20,000 = £40,000.
    // Sweep 40k. New Taxable = 110k. New TaxFree = 90k.
    expect(results[2].calendarYear).toBe(2027);
    expect(results[2].potBalances.taxable).toBe(110000);
    expect(results[2].potBalances.taxFree).toBe(90000);
    expect(results[2].milestones[0]).toContain('Bed & ISA sweep: £40,000 moved');

    // Year 3 (2028): Sweep continues.
    // Taxable = 110k. Floor = 0k. Available = 110k.
    // Household Allowance = 40k.
    // Sweep 40k. New Taxable = 70k. New TaxFree = 130k.
    expect(results[3].calendarYear).toBe(2028);
    expect(results[3].potBalances.taxable).toBe(70000);
    expect(results[3].potBalances.taxFree).toBe(130000);
    expect(results[3].milestones[0]).toContain('Bed & ISA sweep: £40,000 moved');

    // Year 4 (2029): Sweep NOT blocked by floor.
    // Taxable = 70k. Floor = 0k. Available = 70k.
    // Sweep 40k. New Taxable = 30k. New TaxFree = 170k.
    expect(results[4].calendarYear).toBe(2029);
    expect(results[4].potBalances.taxable).toBe(30000);
    expect(results[4].potBalances.taxFree).toBe(170000);
    expect(results[4].milestones[0]).toContain('Bed & ISA sweep: £40,000 moved');

    // Fast forward to 2032 when both are >= 65.
    const result2032 = results.find(r => r.calendarYear === 2032);
    expect(result2032?.ageP1).toBe(66);
    expect(result2032?.ageP2).toBe(65);
  });

  it('TEST CASE 9: Bed & ISA Sweep - Single Partner £20,000 Allowance Regardless of Age', () => {
    // Single partner born 1966. Allowance is £20,000 regardless of age (< 65 or >= 65).
    const input: ProjectionEngineInput = {
      ...baseInput,
      profile: {
        partner1Dob: new Date('1966-01-01T00:00:00.000Z').getTime(),
        // No Partner 2
      },
      currentBalances: 200000,
      assetPots: {
        taxable: 200000,
        taxFree: 0,
        pensions: 0,
      },
      realGrowthRate: 0,
    };

    const results = calculateLifetimeProjection(input);

    // 2027: Age 61. Allowance £20,000. Taxable 200k -> 180k. TaxFree 0 -> 20k.
    const r2027 = results.find(r => r.calendarYear === 2027);
    expect(r2027?.potBalances.taxable).toBe(180000);
    expect(r2027?.potBalances.taxFree).toBe(20000);
    expect(r2027?.milestones[0]).toContain('£20,000 moved');

    // 2030: Age 64. Allowance £20,000.
    // 2027: 180k
    // 2028: 160k
    // 2029: 140k
    // 2030: 120k
    const r2030 = results.find(r => r.calendarYear === 2030);
    expect(r2030?.potBalances.taxable).toBe(120000);
    expect(r2030?.ageP1).toBe(64);

    // 2031: Age 65. Allowance £20,000.
    // Taxable 120k -> 100k.
    const r2031 = results.find(r => r.calendarYear === 2031);
    expect(r2031?.ageP1).toBe(65);
    expect(r2031?.potBalances.taxable).toBe(100000);
    expect(r2031?.milestones[0]).toContain('£20,000 moved');
  });

  it('TEST CASE 10: Cash Protection Floor (Sequential)', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 150000,
      assetPots: {
        taxable: 50000,
        taxFree: 50000,
        pensions: 50000,
      },
      protectionFloor: 60000,
      drawdownStrategy: 'taxable_first',
      realGrowthRate: 0,
      budgets: [
        {
          id: 'budg-1',
          accountId: 'acc-1',
          name: 'Budget',
          amount: 50000,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Initial: taxable 50k, taxFree 50k, pensions 50k. Total 150k.
    // Floor: 60k.
    // Available Cash (Taxable + TaxFree) = (50k + 50k) - 60k = 40k.
    // Deficit = 50k.
    // Order: taxable, taxFree, pensions.
    // Draw from taxable: min(50k, 40k, 50k) = 40k. Remaining deficit = 10k. Available Cash = 0.
    // Draw from taxFree: min(50k, 0k, 10k) = 0k. Remaining deficit = 10k.
    // Draw from pensions: net 10k needed. Gross = 10k / 0.85 = 11764.71.
    // New Taxable = 50k - 40k = 10k.
    // New TaxFree = 50k.
    // New Pensions = 50k - 11764.71 = 38235.29.
    // Combined Cash = 10k + 50k = 60k (Hits floor exactly).
    expect(results[0].potBalances.taxable).toBe(10000);
    expect(results[0].potBalances.taxFree).toBe(50000);
    expect(results[0].potBalances.pensions).toBeCloseTo(38235.29, 1);
  });

  it('TEST CASE 11: Cash Protection Floor (Proportional)', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 120000,
      assetPots: {
        taxable: 40000,
        taxFree: 40000,
        pensions: 40000,
      },
      protectionFloor: 40000,
      drawdownStrategy: 'proportional',
      realGrowthRate: 0,
      budgets: [
        {
          id: 'budg-1',
          accountId: 'acc-1',
          name: 'Budget',
          amount: 20000,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Initial: Taxable 40k, taxFree 40k, pensions 40k. Total = 120k.
    // Floor = 40k.
    // AvailableCash = (40k + 40k) - 40k = 40k.
    // TotalAvailable = 40k (cash) + 40k (pensions) = 80k.
    // Deficit = 20k.
    // Cash ratio: 40k / 80k = 0.5. Cash draw needed = 20k * 0.5 = 10k.
    // Pension ratio: 40k / 80k = 0.5. Pension net draw needed = 20k * 0.5 = 10k.
    // Cash draw split (taxable vs taxFree):
    // TotalCash = 80k. taxable: 40k (50%), taxFree: 40k (50%).
    // New Taxable = 40k - (10k * 0.5) = 35k.
    // New TaxFree = 40k - (10k * 0.5) = 35k.
    // Pension gross draw = 10k / 0.85 = 11764.71.
    // New Pensions = 40k - 11764.71 = 28235.29.
    // Combined Cash = 35k + 35k = 70k.
    expect(results[0].potBalances.taxable).toBe(35000);
    expect(results[0].potBalances.taxFree).toBe(35000);
    expect(results[0].potBalances.pensions).toBeCloseTo(28235.29, 1);
  });

  it('TEST CASE 12: Bed & ISA Sweep and Protection Floor Interaction', () => {
    // Verifies that sweeping from taxable to taxFree does not prevent drawing from taxFree
    // when the combined balance is above the floor.
    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 100000,
      assetPots: {
        taxable: 100000,
        taxFree: 0,
        pensions: 50000,
      },
      protectionFloor: 20000,
      drawdownStrategy: 'tax_free_first',
      realGrowthRate: 0,
      budgets: [
        {
          id: 'budg-1',
          accountId: 'acc-1',
          name: 'Budget',
          amount: 10000,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // 2025: Taxable 100k -> 90k. taxFree 0. floor 20k.
    expect(results[0].calendarYear).toBe(2025);
    expect(results[0].potBalances.taxable).toBe(90000);
    expect(results[0].potBalances.taxFree).toBe(0);

    // 2026: Taxable 90k -> 80k. taxFree 0.
    expect(results[1].calendarYear).toBe(2026);
    expect(results[1].potBalances.taxable).toBe(80000);

    // 2027: Bed & ISA Sweep occurs.
    // P1 age 61, P2 age 60. Household Allowance 40k.
    // Surplus/Deficit check first: Taxable 80k -> 70k.
    // Then Sweep 40k: Taxable 70k -> 30k. taxFree 0 -> 40k.
    expect(results[2].calendarYear).toBe(2027);
    expect(results[2].potBalances.taxable).toBe(30000);
    expect(results[2].potBalances.taxFree).toBe(40000);

    // 2028: tax_free_first strategy.
    // Initial: Taxable 30k, taxFree 40k. Combined 70k. Floor 20k. Available 50k.
    // Deficit 10k.
    // Draw from taxFree: min(40k, 50k, 10k) = 10k.
    // New taxFree = 40k - 10k = 30k.
    // Then Sweep (Household Allowance 40k, Taxable has 30k): Taxable 30k -> 0k. taxFree 30k -> 60k.
    expect(results[3].calendarYear).toBe(2028);
    expect(results[3].potBalances.taxable).toBe(0);
    expect(results[3].potBalances.taxFree).toBe(60000);
  });

  it('TEST CASE 13: Milestones - Cash Injection and Labeling', () => {
    const year2030Start = new Date('2030-01-01T00:00:00.000Z').getTime();

    const input: ProjectionEngineInput = {
      ...baseInput,
      currentBalances: 100000,
      milestones: [
        {
          id: 'm-1',
          name: 'Inheritance',
          date: year2030Start,
          amount: 50000,
          updatedAt: Date.now(),
        },
      ],
      realGrowthRate: 0,
    };

    const results = calculateLifetimeProjection(input);

    // Year 2029 (yearIndex 4)
    const r2029 = results.find(r => r.calendarYear === 2029);
    expect(r2029?.liquidAssets).toBe(100000);
    expect(r2029?.milestones).not.toContain('Inheritance');

    // Year 2030 (yearIndex 5)
    const r2030 = results.find(r => r.calendarYear === 2030);
    expect(r2030?.liquidAssets).toBe(150000);
    expect(r2030?.milestones).toContain('Inheritance');
  });
});
