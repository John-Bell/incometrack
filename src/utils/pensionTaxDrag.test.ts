import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { calculateLifetimeProjection, type ProjectionEngineInput } from './projectionEngine';
import { TAX_YEAR_CONSTANTS } from '../constants/taxConstants';

describe('calculateLifetimeProjection Pension Tax Drag', () => {
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
    realGrowthRate: 0, // Disable growth for simple verification
    profile: {
      partner1Dob: dobP1,
    },
    incomes: [],
    budgets: [],
    properties: [],
    propertyOwnership: [],
    taxRules: TAX_YEAR_CONSTANTS,
  };

  it('applies 15% tax drag on ordered pension drawdown', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      assetPots: {
        taxable: 0,
        taxFree: 0,
        pensions: 100000,
      },
      drawdownStrategy: 'pensions_first',
      budgets: [
        {
          id: 'budg-1',
          accountId: 'acc-1',
          name: 'Budget',
          amount: 8500,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Year 0 (2025):
    // Deficit = 8500.
    // effectiveTaxRate = 0.15.
    // grossPensionWithdrawal = 8500 / (1 - 0.15) = 8500 / 0.85 = 10000.
    // New pension balance should be 100000 - 10000 = 90000.

    expect(results[0].potBalances.pensions).toBe(90000);
    expect(results[0].liquidAssets).toBe(90000);
  });

  it('applies 15% tax drag on proportional pension drawdown', () => {
    const input: ProjectionEngineInput = {
      ...baseInput,
      assetPots: {
        taxable: 0,
        taxFree: 0,
        pensions: 100000,
      },
      drawdownStrategy: 'proportional',
      budgets: [
        {
          id: 'budg-1',
          accountId: 'acc-1',
          name: 'Budget',
          amount: 8500,
          frequency: 'annually',
          updatedAt: Date.now(),
        },
      ],
    };

    const results = calculateLifetimeProjection(input);

    // Even with proportional, if ONLY pensions have balance, it should behave same as pensions_first.
    // Deficit = 8500.
    // Should draw 10000 gross to get 8500 net.
    expect(results[0].potBalances.pensions).toBe(90000);
  });
});
