import { describe, it, expect } from 'vitest';
import { calculateSpendingGraphData } from './spendingUtils';
import type { Budget, Transaction } from '@/lib/db';
import type { TargetMonth } from './budgetUtils';

describe('spendingUtils', () => {
  const targetMonths: TargetMonth[] = [
    { year: 2026, monthIndex: 0, label: 'Jan' },
    { year: 2026, monthIndex: 1, label: 'Feb' },
    { year: 2026, monthIndex: 2, label: 'Mar' },
  ];

  const budgets: Budget[] = [
    { id: 'b1', accountId: 'acc1', name: 'Groceries', amount: 500 },
    { id: 'b2', accountId: 'acc2', name: 'Utilities', amount: 200 },
  ];

  it('calculates total, average, and peak spending correctly across all accounts and budgets', () => {
    const transactions: Transaction[] = [
      // Jan: £100 + £50 = £150
      { id: 't1', date: new Date(2026, 0, 5).getTime(), amount: 100, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
      { id: 't2', date: new Date(2026, 0, 10).getTime(), amount: 50, type: 'expense', budgetId: 'b2', accountId: 'acc2' },
      // Feb: £300 (peak)
      { id: 't3', date: new Date(2026, 1, 15).getTime(), amount: 300, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
      // Mar: £0
      // Income should be ignored
      { id: 't4', date: new Date(2026, 1, 1).getTime(), amount: 1000, type: 'income', accountId: 'acc1' },
    ];

    const result = calculateSpendingGraphData(targetMonths, transactions);

    expect(result.totalSpend).toBe(450);
    expect(result.avgMonthlySpend).toBe(150);
    expect(result.peakMonth).toBe('Feb');
    expect(result.peakAmount).toBe(300);
    expect(result.barData.length).toBe(3);

    // Jan
    expect(result.barData[0].month).toBe('Jan');
    expect(result.barData[0].rawAmount).toBe(150);
    expect(result.barData[0].amount).toBe('£150');
    expect(result.barData[0].heightPct).toBe(50); // 150 / 300 = 50%

    // Feb
    expect(result.barData[1].month).toBe('Feb');
    expect(result.barData[1].rawAmount).toBe(300);
    expect(result.barData[1].amount).toBe('£300');
    expect(result.barData[1].heightPct).toBe(100);

    // Mar
    expect(result.barData[2].month).toBe('Mar');
    expect(result.barData[2].rawAmount).toBe(0);
    expect(result.barData[2].amount).toBe('£0');
    expect(result.barData[2].heightPct).toBe(0);
  });

  it('filters spending by account ID', () => {
    const transactions: Transaction[] = [
      { id: 't1', date: new Date(2026, 0, 5).getTime(), amount: 100, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
      { id: 't2', date: new Date(2026, 0, 10).getTime(), amount: 200, type: 'expense', budgetId: 'b2', accountId: 'acc2' },
    ];

    const scopedBudgetsForAcc1 = budgets.filter((b) => b.accountId === 'acc1');
    const result = calculateSpendingGraphData(
      targetMonths,
      transactions,
      'acc1',
      undefined,
      scopedBudgetsForAcc1
    );

    expect(result.totalSpend).toBe(100);
    expect(result.barData[0].rawAmount).toBe(100);
  });

  it('filters spending by budget ID', () => {
    const transactions: Transaction[] = [
      { id: 't1', date: new Date(2026, 0, 5).getTime(), amount: 100, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
      { id: 't2', date: new Date(2026, 0, 10).getTime(), amount: 200, type: 'expense', budgetId: 'b2', accountId: 'acc2' },
    ];

    const result = calculateSpendingGraphData(
      targetMonths,
      transactions,
      undefined,
      'b2'
    );

    expect(result.totalSpend).toBe(200);
    expect(result.barData[0].rawAmount).toBe(200);
  });

  it('formats amounts >= £1000 with k suffix', () => {
    const transactions: Transaction[] = [
      { id: 't1', date: new Date(2026, 0, 5).getTime(), amount: 2500, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
    ];

    const result = calculateSpendingGraphData(targetMonths, transactions);
    expect(result.barData[0].amount).toBe('£2.50k');
  });

  it('handles empty transactions without division by zero', () => {
    const result = calculateSpendingGraphData(targetMonths, []);
    expect(result.totalSpend).toBe(0);
    expect(result.avgMonthlySpend).toBe(0);
    expect(result.peakAmount).toBe(0);
    expect(result.barData.every((b) => b.heightPct === 0)).toBe(true);
  });

  it('excludes one-off budgets from totals unless a one-off budget is explicitly selected', () => {
    const mixedBudgets: Budget[] = [
      { id: 'b_regular', accountId: 'acc1', name: 'Groceries', amount: 500, oneOffBudget: false },
      { id: 'b_oneoff', accountId: 'acc1', name: 'Holiday', amount: 1500, oneOffBudget: true },
    ];

    const transactions: Transaction[] = [
      { id: 't1', date: new Date(2026, 0, 5).getTime(), amount: 200, type: 'expense', budgetId: 'b_regular', accountId: 'acc1' },
      { id: 't2', date: new Date(2026, 0, 10).getTime(), amount: 1200, type: 'expense', budgetId: 'b_oneoff', accountId: 'acc1' },
      { id: 't3', date: new Date(2026, 1, 15).getTime(), amount: 100, type: 'expense', budgetId: 'b_regular', accountId: 'acc1' },
      { id: 't4', date: new Date(2026, 1, 20).getTime(), amount: 50, type: 'expense', accountId: 'acc1' }, // unbudgeted expense
    ];

    // Case 1: All budgets (no selectedBudgetId) -> exclude b_oneoff
    const allBudgetsResult = calculateSpendingGraphData(
      targetMonths,
      transactions,
      undefined,
      undefined,
      mixedBudgets
    );

    // Jan should have t1 (200), excluding t2 (1200) -> 200
    // Feb should have t3 (100) + t4 (50) -> 150
    // Total should be 200 + 150 = 350
    expect(allBudgetsResult.totalSpend).toBe(350);
    expect(allBudgetsResult.avgMonthlySpend).toBe(350 / 3);
    expect(allBudgetsResult.barData[0].rawAmount).toBe(200);
    expect(allBudgetsResult.barData[1].rawAmount).toBe(150);
    expect(allBudgetsResult.peakMonth).toBe('Jan');
    expect(allBudgetsResult.peakAmount).toBe(200);

    // Case 2: One-off budget explicitly selected -> include b_oneoff transactions
    const oneOffBudgetResult = calculateSpendingGraphData(
      targetMonths,
      transactions,
      undefined,
      'b_oneoff',
      mixedBudgets
    );

    // Only t2 (1200) in Jan
    expect(oneOffBudgetResult.totalSpend).toBe(1200);
    expect(oneOffBudgetResult.barData[0].rawAmount).toBe(1200);
    expect(oneOffBudgetResult.barData[1].rawAmount).toBe(0);
    expect(oneOffBudgetResult.peakMonth).toBe('Jan');
    expect(oneOffBudgetResult.peakAmount).toBe(1200);
  });
});
