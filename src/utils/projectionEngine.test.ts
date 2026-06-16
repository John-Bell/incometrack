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
});
