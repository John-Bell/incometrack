import { describe, it, expect } from 'vitest';
import {
  getTargetMonths,
  calculateGraphData,
  calculateBudgetAlerts,
  calculateCategoryTuningItems,
} from './budgetUtils';
import type { Budget, Transaction } from '@/lib/db';

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
        { id: 'b_over', accountId: 'acc1', name: 'Overspend Cat', amount: 100, frequency: 'monthly' },
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

    it('triggers slack alert when spend is <30% of cap in >35% of periods', () => {
      const budgets: Budget[] = [
        { id: 'b_slack', accountId: 'acc1', name: 'Slack Cat', amount: 500, frequency: 'monthly' },
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
        { id: 'b1', accountId: 'acc1', name: 'Groceries', amount: 200, frequency: 'monthly' },
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
  });
});
