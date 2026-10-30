import { describe, it, expect } from 'vitest';
import {
  getTargetMonths,
  calculateGraphData,
  calculateBudgetAlerts,
  calculateCategoryTuningItems,
  filterAndSortBudgets,
  getBudgetAccounts,
  calculateBudgetItemDetails,
} from './budgetUtils';
import type { Account, Budget, Transaction } from '@/lib/db';

describe('budgetUtils', () => {
  describe('getTargetMonths', () => {
    it('returns months from Jan to current month for YTD timeframe', () => {
      // Fixed date: May 15, 2025 (month index 4)
      const baseDate = new Date(2025, 4, 15);
      const months = getTargetMonths('ytd', false, baseDate);

      expect(months.length).toBe(5);
      expect(months[0]).toEqual({ year: 2025, monthIndex: 0, label: 'Jan' });
      expect(months[4]).toEqual({ year: 2025, monthIndex: 4, label: 'May' });
    });

    it('returns last 3 months for 3m timeframe when no annual budget exists', () => {
      const baseDate = new Date(2025, 4, 15); // May 2025
      const months = getTargetMonths('3m', false, baseDate);

      expect(months.length).toBe(3);
      expect(months[0]).toEqual({ year: 2025, monthIndex: 2, label: 'Mar' });
      expect(months[1]).toEqual({ year: 2025, monthIndex: 3, label: 'Apr' });
      expect(months[2]).toEqual({ year: 2025, monthIndex: 4, label: 'May' });
    });

    it('forces YTD timeframe when hasAnnualBudget is true', () => {
      const baseDate = new Date(2025, 4, 15);
      const months = getTargetMonths('6m', true, baseDate);

      expect(months.length).toBe(5); // Jan to May
      expect(months[0].label).toBe('Jan');
      expect(months[4].label).toBe('May');
    });
  });

  describe('calculateGraphData', () => {
    const targetMonths = [
      { year: 2025, monthIndex: 2, label: 'Mar' },
      { year: 2025, monthIndex: 3, label: 'Apr' },
    ];

    const monthlyBudget: Budget = {
      id: 'b1',
      accountId: 'acc1',
      name: 'Dining',
      amount: 100,
      frequency: 'monthly',
    };

    it('returns empty result if no budget is selected or budget is not monthly', () => {
      const res = calculateGraphData(false, monthlyBudget, targetMonths, []);
      expect(res.barData).toEqual([]);
      expect(res.cap).toBe(0);
    });

    it('calculates monthly spend and exceeded status correctly', () => {
      const transactions: Transaction[] = [
        {
          id: 't1',
          date: new Date(2025, 2, 10).getTime(), // Mar
          payee: 'Rest 1',
          amount: 80,
          type: 'expense',
          budgetId: 'b1',
          accountId: 'acc1',
        },
        {
          id: 't2',
          date: new Date(2025, 3, 10).getTime(), // Apr
          payee: 'Rest 2',
          amount: 150,
          type: 'expense',
          budgetId: 'b1',
          accountId: 'acc1',
        },
      ];

      const res = calculateGraphData(true, monthlyBudget, targetMonths, transactions);

      expect(res.cap).toBe(100);
      expect(res.underCount).toBe(1);
      expect(res.exceededCount).toBe(1);
      expect(res.barData.length).toBe(2);

      // Mar: £80 (under cap)
      expect(res.barData[0].month).toBe('Mar');
      expect(res.barData[0].amount).toBe('£80');
      expect(res.barData[0].exceeded).toBe(false);

      // Apr: £150 (exceeded cap)
      expect(res.barData[1].month).toBe('Apr');
      expect(res.barData[1].amount).toBe('£150');
      expect(res.barData[1].exceeded).toBe(true);
    });
  });

  describe('calculateBudgetAlerts', () => {
    const targetMonths = [
      { year: 2025, monthIndex: 0, label: 'Jan' },
      { year: 2025, monthIndex: 1, label: 'Feb' },
    ];

    it('triggers overspend alert when breached in >35% of periods', () => {
      const budgets: Budget[] = [
        { id: 'b_over', accountId: 'acc1', name: 'Overspend Cat', amount: 100, frequency: 'monthly', budgetStartDate: new Date(2025, 0, 1).getTime() },
      ];

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2025, 0, 10).getTime(), payee: 'P1', amount: 150, type: 'expense', budgetId: 'b_over', accountId: 'acc1' },
        { id: 't2', date: new Date(2025, 1, 10).getTime(), payee: 'P2', amount: 150, type: 'expense', budgetId: 'b_over', accountId: 'acc1' },
      ];

      const alerts = calculateBudgetAlerts(targetMonths, budgets, transactions, '');

      expect(alerts.overspendAlerts.length).toBe(1);
      expect(alerts.overspendAlerts[0].budgetName).toBe('Overspend Cat');
      expect(alerts.overspendAlerts[0].breachedCount).toBe(2);
      expect(alerts.overspendAlerts[0].avgExcess).toBe(50);
    });

    it('excludes months before budgetStartDate when calculating alert averages and active periods', () => {
      const fourMonths = [
        { year: 2026, monthIndex: 0, label: 'Jan' },
        { year: 2026, monthIndex: 1, label: 'Feb' },
        { year: 2026, monthIndex: 2, label: 'Mar' },
        { year: 2026, monthIndex: 3, label: 'Apr' },
      ];

      // Budget started March 1, 2026 -> Active months are Mar and Apr (2 active months)
      const lateBudget: Budget = {
        id: 'b_late_alert',
        accountId: 'acc1',
        name: 'Late Alert Cat',
        amount: 100,
        frequency: 'monthly',
        budgetStartDate: new Date(2026, 2, 1).getTime(),
      };

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2026, 2, 10).getTime(), payee: 'P1', amount: 200, type: 'expense', budgetId: 'b_late_alert', accountId: 'acc1' },
        { id: 't2', date: new Date(2026, 3, 10).getTime(), payee: 'P2', amount: 200, type: 'expense', budgetId: 'b_late_alert', accountId: 'acc1' },
      ];

      const alerts = calculateBudgetAlerts(fourMonths, [lateBudget], transactions, '');

      expect(alerts.overspendAlerts.length).toBe(1);
      expect(alerts.overspendAlerts[0].breachedCount).toBe(2);
      expect(alerts.overspendAlerts[0].totalPeriods).toBe(2);
      // Total spent = 400 across 2 active months = £200 avg spend. Cap = 100, so avgExcess = £100
      expect(alerts.overspendAlerts[0].avgExcess).toBe(100);
    });

    it('does NOT trigger excess slack alert if any months are breached', () => {
      const threeMonths = [
        { year: 2026, monthIndex: 0, label: 'Jan' },
        { year: 2026, monthIndex: 1, label: 'Feb' },
        { year: 2026, monthIndex: 2, label: 'Mar' },
      ];

      // Cap = 100
      // Jan: £20 (low spend, slack)
      // Feb: £20 (low spend, slack) -> 2/3 = 66% slack months (>35%)
      // Mar: £150 (breached)
      const budget: Budget = {
        id: 'b_breached_slack',
        accountId: 'acc1',
        name: 'Breached Slack Cat',
        amount: 100,
        frequency: 'monthly',
        budgetStartDate: new Date(2026, 0, 1).getTime(),
      };

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2026, 0, 10).getTime(), payee: 'P1', amount: 20, type: 'expense', budgetId: 'b_breached_slack', accountId: 'acc1' },
        { id: 't2', date: new Date(2026, 1, 10).getTime(), payee: 'P2', amount: 20, type: 'expense', budgetId: 'b_breached_slack', accountId: 'acc1' },
        { id: 't3', date: new Date(2026, 2, 10).getTime(), payee: 'P3', amount: 150, type: 'expense', budgetId: 'b_breached_slack', accountId: 'acc1' },
      ];

      const alerts = calculateBudgetAlerts(threeMonths, [budget], transactions, '');

      // Because Mar is breached, Excess Slack should NOT be generated
      expect(alerts.slackAlerts.length).toBe(0);
    });

    it('triggers slack alert when spend is <30% of cap in >35% of periods', () => {
      const budgets: Budget[] = [
        { id: 'b_slack', accountId: 'acc1', name: 'Slack Cat', amount: 500, frequency: 'monthly', budgetStartDate: new Date(2025, 0, 1).getTime() },
      ];

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2025, 0, 10).getTime(), payee: 'P1', amount: 50, type: 'expense', budgetId: 'b_slack', accountId: 'acc1' },
        { id: 't2', date: new Date(2025, 1, 10).getTime(), payee: 'P2', amount: 50, type: 'expense', budgetId: 'b_slack', accountId: 'acc1' },
      ];

      const alerts = calculateBudgetAlerts(targetMonths, budgets, transactions, '');

      expect(alerts.slackAlerts.length).toBe(1);
      expect(alerts.slackAlerts[0].budgetName).toBe('Slack Cat');
      expect(alerts.slackAlerts[0].slackCount).toBe(2);
      expect(alerts.slackAlerts[0].avgUnspent).toBe(450);
    });
  });

  describe('calculateCategoryTuningItems', () => {
    const targetMonths = [
      { year: 2025, monthIndex: 0, label: 'Jan' },
      { year: 2025, monthIndex: 1, label: 'Feb' },
    ];

    it('handles monthly budget calculations and proposal generation', () => {
      const sortedBudgets: Budget[] = [
        { id: 'b1', accountId: 'acc1', name: 'Groceries', amount: 200, frequency: 'monthly', budgetStartDate: new Date(2025, 0, 1).getTime() },
      ];

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2025, 0, 10).getTime(), payee: 'Supermarket', amount: 250, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
        { id: 't2', date: new Date(2025, 1, 10).getTime(), payee: 'Supermarket', amount: 250, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
      ];

      const tuning = calculateCategoryTuningItems(sortedBudgets, targetMonths, transactions);

      expect(tuning.length).toBe(1);
      const item = tuning[0];
      expect(item.name).toBe('Groceries');
      expect(item.isMonthly).toBe(true);
      expect(item.isError).toBe(true);
      expect(item.proposalText).toContain('Under-budgeted by £50/mo');
      expect(item.actionLabel).toBe('Tune');
    });

    it('calculates average monthly spend using budgetStartDate to filter active months', () => {
      // 4 target months: Jan, Feb, Mar, Apr 2026
      const fourMonths = [
        { year: 2026, monthIndex: 0, label: 'Jan' },
        { year: 2026, monthIndex: 1, label: 'Feb' },
        { year: 2026, monthIndex: 2, label: 'Mar' },
        { year: 2026, monthIndex: 3, label: 'Apr' },
      ];

      // Budget started on April 1, 2026 -> only 1 active month in targetMonths (Apr 2026)
      const lateBudget: Budget = {
        id: 'b_late',
        accountId: 'acc1',
        name: 'Late Subscription',
        amount: 100,
        frequency: 'monthly',
        budgetStartDate: new Date(2026, 3, 1).getTime(),
      };

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2026, 3, 10).getTime(), payee: 'Sub Co', amount: 100, type: 'expense', budgetId: 'b_late', accountId: 'acc1' },
      ];

      const tuning = calculateCategoryTuningItems([lateBudget], fourMonths, transactions);

      expect(tuning.length).toBe(1);
      const item = tuning[0];
      // Avg spend is £100 / 1 active month = £100/mo (NOT £100 / 4 months = £25/mo)
      expect(item.avgSpend).toBe('£100/mo');
      expect(item.proposalText).toContain('On target');
    });

    it('hides unused cushion proposal if any months are breached even when overall avg spend is under monthly cap', () => {
      // 3 months target
      const threeMonths = [
        { year: 2026, monthIndex: 0, label: 'Jan' },
        { year: 2026, monthIndex: 1, label: 'Feb' },
        { year: 2026, monthIndex: 2, label: 'Mar' },
      ];

      // Monthly cap = £100
      // Jan: £0
      // Feb: £0
      // Mar: £150 (breached)
      // Total = £150, avg spend across 3 active months = £50/mo.
      // monthlyCap - avgSpend = 100 - 50 = 50 >= 10.
      // But breachedCount = 1 > 0, so showProposal should be false (no Unused Cushion).
      const budget: Budget = {
        id: 'b_breached_cushion',
        accountId: 'acc1',
        name: 'Breached Cushion Cat',
        amount: 100,
        frequency: 'monthly',
        budgetStartDate: new Date(2026, 0, 1).getTime(),
      };

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2026, 2, 10).getTime(), payee: 'P1', amount: 150, type: 'expense', budgetId: 'b_breached_cushion', accountId: 'acc1' },
      ];

      const tuning = calculateCategoryTuningItems([budget], threeMonths, transactions);

      expect(tuning.length).toBe(1);
      const item = tuning[0];
      expect(item.showProposal).toBe(false);
    });

    it('handles annual budget calculations and hides cushion proposals when within cap', () => {
      const sortedBudgets: Budget[] = [
        { id: 'b_annual', accountId: 'acc1', name: 'Car Insurance', amount: 1200, frequency: 'annual' },
      ];

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2025, 0, 10).getTime(), payee: 'Insurance Co', amount: 100, type: 'expense', budgetId: 'b_annual', accountId: 'acc1' },
      ];

      const tuning = calculateCategoryTuningItems(sortedBudgets, targetMonths, transactions);

      expect(tuning.length).toBe(1);
      const item = tuning[0];
      expect(item.name).toBe('Car Insurance');
      expect(item.isAnnual).toBe(true);
      expect(item.isError).toBe(false); // £100 total <= £1200 annual cap
      expect(item.showProposal).toBe(false); // Cushion proposals hidden for annual
    });

    it('uses budgetStartDate to calculate breached status text and excludes pre-start breaches', () => {
      // 4 target months: Jan, Feb, Mar, Apr 2026
      const fourMonths = [
        { year: 2026, monthIndex: 0, label: 'Jan' },
        { year: 2026, monthIndex: 1, label: 'Feb' },
        { year: 2026, monthIndex: 2, label: 'Mar' },
        { year: 2026, monthIndex: 3, label: 'Apr' },
      ];

      // Budget starts March 1, 2026 -> Active months are Mar and Apr (2 active months)
      const lateBudget: Budget = {
        id: 'b_status_test',
        accountId: 'acc1',
        name: 'Late Status Cat',
        amount: 100,
        frequency: 'monthly',
        budgetStartDate: new Date(2026, 2, 1).getTime(),
      };

      const transactions: Transaction[] = [
        // Jan spending (before budgetStartDate): £150 (would be over cap if evaluated, but before budgetStart)
        { id: 't1', date: new Date(2026, 0, 10).getTime(), payee: 'P1', amount: 150, type: 'expense', budgetId: 'b_status_test', accountId: 'acc1' },
        // Mar spending: £150 (active month, breached)
        { id: 't2', date: new Date(2026, 2, 10).getTime(), payee: 'P2', amount: 150, type: 'expense', budgetId: 'b_status_test', accountId: 'acc1' },
        // Apr spending: £50 (active month, within cap)
        { id: 't3', date: new Date(2026, 3, 10).getTime(), payee: 'P3', amount: 50, type: 'expense', budgetId: 'b_status_test', accountId: 'acc1' },
      ];

      const tuning = calculateCategoryTuningItems([lateBudget], fourMonths, transactions);

      expect(tuning.length).toBe(1);
      const item = tuning[0];
      // Active months = 2 (Mar, Apr). Active breached months = 1 (Mar).
      // Pre-start month breach (Jan) is excluded.
      expect(item.statusText).toBe('Breached: 1 of last 2 months');
    });
  });

  describe('filterAndSortBudgets', () => {
    const budgets: Budget[] = [
      { id: 'b1', accountId: 'acc1', name: 'Utilities', amount: 100, frequency: 'monthly' },
      { id: 'b2', accountId: 'acc2', name: 'Groceries', amount: 200, frequency: 'monthly' },
      { id: 'b3', accountId: 'acc1', name: 'Entertainment', amount: 50, frequency: 'monthly' },
    ];

    it('returns all budgets sorted alphabetically by name when selectedAccountId is empty', () => {
      const result = filterAndSortBudgets(budgets, '');
      expect(result.map((b) => b.name)).toEqual(['Entertainment', 'Groceries', 'Utilities']);
    });

    it('returns only budgets matching selectedAccountId sorted alphabetically by name', () => {
      const result = filterAndSortBudgets(budgets, 'acc1');
      expect(result.map((b) => b.name)).toEqual(['Entertainment', 'Utilities']);
    });
  });

  describe('getBudgetAccounts', () => {
    const accounts: Account[] = [
      { id: 'a1', ownerId: 'p1', name: 'Current Account B', balance: 1000, interestRate: 0, updatedAt: 0, category: 'Current Account', budgetOrder: 2 },
      { id: 'a2', ownerId: 'p1', name: 'Current Account A', balance: 500, interestRate: 0, updatedAt: 0, category: 'Current Account', budgetOrder: 1 },
      { id: 'a3', ownerId: 'p1', name: 'Savings Account', balance: 2000, interestRate: 5, updatedAt: 0, category: 'Savings' },
    ];

    it('filters out accounts without budgetOrder and sorts remaining accounts alphabetically by name', () => {
      const result = getBudgetAccounts(accounts);
      expect(result.length).toBe(2);
      expect(result.map((a) => a.name)).toEqual(['Current Account A', 'Current Account B']);
    });
  });

  describe('calculateBudgetItemDetails', () => {
    const refDate = new Date(2026, 4, 15); // May 15, 2026

    it('calculates monthly budget details correctly', () => {
      const budget: Budget = {
        id: 'b_m',
        accountId: 'acc1',
        name: 'Dining',
        amount: 200,
        frequency: 'monthly',
        budgetStartDate: new Date(2026, 3, 1).getTime(), // Apr 1 2026
      };

      const transactions: Transaction[] = [
        // Current month (May 2026) expense
        { id: 't1', date: new Date(2026, 4, 10).getTime(), payee: 'Bistro', amount: 100, type: 'expense', budgetId: 'b_m', accountId: 'acc1' },
        // Previous month expense (ignored for monthly actual)
        { id: 't2', date: new Date(2026, 3, 10).getTime(), payee: 'Cafe', amount: 150, type: 'expense', budgetId: 'b_m', accountId: 'acc1' },
        // Income transaction (ignored)
        { id: 't3', date: new Date(2026, 4, 12).getTime(), payee: 'Refund', amount: 50, type: 'income', budgetId: 'b_m', accountId: 'acc1' },
      ];

      const details = calculateBudgetItemDetails(budget, transactions, refDate);

      expect(details.isAnnual).toBe(false);
      expect(details.monthlyAmount).toBe(200);
      expect(details.annualAmount).toBe(2400);
      expect(details.actualAmount).toBe(100);
      expect(details.targetNum).toBe(200);
      expect(details.ratio).toBe(0.5);
      expect(details.percent).toBe(50);
      expect(details.status).toBe('PLENTY OF CAPACITY');
      expect(details.barColor).toBe('bg-emerald-500');
    });

    it('calculates annual budget details correctly across the full current year', () => {
      const budget: Budget = {
        id: 'b_a',
        accountId: 'acc1',
        name: 'Car Insurance',
        amount: 1200,
        frequency: 'annual',
      };

      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2026, 0, 10).getTime(), payee: 'Insurer', amount: 600, type: 'expense', budgetId: 'b_a', accountId: 'acc1' },
        { id: 't2', date: new Date(2026, 4, 10).getTime(), payee: 'Insurer', amount: 600, type: 'expense', budgetId: 'b_a', accountId: 'acc1' },
      ];

      const details = calculateBudgetItemDetails(budget, transactions, refDate);

      expect(details.isAnnual).toBe(true);
      expect(details.monthlyAmount).toBe(100);
      expect(details.annualAmount).toBe(1200);
      expect(details.actualAmount).toBe(1200);
      expect(details.status).toBe('FULLY SPENT');
      expect(details.barColor).toBe('bg-orange-500');
    });

    it('returns OVERSPENT status when actual exceeds target', () => {
      const budget: Budget = { id: 'b1', accountId: 'acc1', name: 'Tech', amount: 100, frequency: 'monthly' };
      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2026, 4, 10).getTime(), payee: 'Store', amount: 120, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
      ];

      const details = calculateBudgetItemDetails(budget, transactions, refDate);

      expect(details.status).toBe('OVERSPENT');
      expect(details.barColor).toBe('bg-red-500');
    });

    it('returns OVERSPEND RISK status when ratio is >= 0.90 but <= 1.0', () => {
      const budget: Budget = { id: 'b1', accountId: 'acc1', name: 'Food', amount: 100, frequency: 'monthly' };
      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2026, 4, 10).getTime(), payee: 'Store', amount: 95, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
      ];

      const details = calculateBudgetItemDetails(budget, transactions, refDate);

      expect(details.status).toBe('OVERSPEND RISK');
      expect(details.barColor).toBe('bg-orange-500');
    });

    it('returns ON TRACK status when ratio is between 0.75 and 0.90', () => {
      const budget: Budget = { id: 'b1', accountId: 'acc1', name: 'Food', amount: 100, frequency: 'monthly' };
      const transactions: Transaction[] = [
        { id: 't1', date: new Date(2026, 4, 10).getTime(), payee: 'Store', amount: 80, type: 'expense', budgetId: 'b1', accountId: 'acc1' },
      ];

      const details = calculateBudgetItemDetails(budget, transactions, refDate);

      expect(details.status).toBe('ON TRACK');
      expect(details.barColor).toBe('bg-blue-500');
    });
  });
});
