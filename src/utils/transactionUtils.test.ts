import { describe, it, expect } from 'vitest';
import type { Account, Budget, Transaction } from '@/lib/db';
import {
  filterCurrentAccounts,
  getAvailableBudgets,
  filterTransactions,
  createBudgetsMap,
  groupTransactionsByDate,
  formatTransactionAmount,
  getUpdatedSearchParamsOnAccountChange,
  getUpdatedSearchParamsOnBudgetChange,
  buildTransactionUrl,
} from './transactionUtils';

describe('transactionUtils', () => {
  const sampleAccounts: Account[] = [
    { id: 'acc1', name: 'Zebra Account', category: 'Current Account', ownerId: 'p1', balance: 1000 },
    { id: 'acc2', name: 'Alpha Account', category: 'Current Account', ownerId: 'p1', balance: 500 },
    { id: 'acc3', name: 'Savings Pot', category: 'Easy Access Savings', ownerId: 'p1', balance: 2000 },
  ];

  const sampleBudgets: Budget[] = [
    { id: 'b1', name: 'Groceries', amount: 300, frequency: 'monthly', accountId: 'acc1' },
    { id: 'b2', name: 'Utilities', amount: 150, frequency: 'monthly', accountId: 'acc2' },
    { id: 'b3', name: 'Dining Out', amount: 100, frequency: 'monthly', accountId: 'acc1' },
  ];

  const sampleTransactions: Transaction[] = [
    { id: 'tx1', payee: 'Tesco', amount: 45.5, type: 'expense', date: '2025-05-15', accountId: 'acc1', budgetId: 'b1', icon: 'shopping_cart' },
    { id: 'tx2', payee: 'British Gas', amount: 80, type: 'expense', date: '2025-05-14', accountId: 'acc2', budgetId: 'b2', icon: 'bolt' },
    { id: 'tx3', payee: 'Salary', amount: 2000, type: 'income', date: '2025-05-15', accountId: 'acc1', icon: 'payments' },
  ];

  describe('filterCurrentAccounts', () => {
    it('filters Current Accounts only and sorts them alphabetically', () => {
      const result = filterCurrentAccounts(sampleAccounts);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alpha Account');
      expect(result[1].name).toBe('Zebra Account');
    });
  });

  describe('getAvailableBudgets', () => {
    it('returns all budgets sorted alphabetically when no accountId is selected', () => {
      const result = getAvailableBudgets(sampleBudgets, '');
      expect(result).toHaveLength(3);
      expect(result.map((b) => b.name)).toEqual(['Dining Out', 'Groceries', 'Utilities']);
    });

    it('filters budgets matching selected accountId and sorts them', () => {
      const result = getAvailableBudgets(sampleBudgets, 'acc1');
      expect(result).toHaveLength(2);
      expect(result.map((b) => b.name)).toEqual(['Dining Out', 'Groceries']);
    });
  });

  describe('filterTransactions', () => {
    it('returns all transactions when no filters selected', () => {
      const result = filterTransactions(sampleTransactions, '', '');
      expect(result).toHaveLength(3);
    });

    it('filters transactions by accountId', () => {
      const result = filterTransactions(sampleTransactions, 'acc2', '');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx2');
    });

    it('filters transactions by budgetId', () => {
      const result = filterTransactions(sampleTransactions, 'acc1', 'b1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx1');
    });

    it('returns empty array when account and budget filters do not match any transaction', () => {
      const result = filterTransactions(sampleTransactions, 'acc2', 'b1');
      expect(result).toHaveLength(0);
    });
  });

  describe('createBudgetsMap', () => {
    it('maps budget array to budget object indexed by id', () => {
      const map = createBudgetsMap(sampleBudgets);
      expect(map['b1']).toEqual(sampleBudgets[0]);
      expect(map['b2']).toEqual(sampleBudgets[1]);
    });
  });

  describe('groupTransactionsByDate', () => {
    const fixedNow = new Date(2025, 4, 15, 12, 0, 0); // May 15, 2025

    it('groups transactions into Today, Yesterday, and formatted date strings', () => {
      const txToday: Transaction = { id: 't1', payee: 'P1', amount: 10, type: 'expense', date: '2025-05-15T10:00:00.000Z', accountId: 'acc1', icon: 'add' };
      const txYesterday: Transaction = { id: 't2', payee: 'P2', amount: 20, type: 'expense', date: '2025-05-14T18:00:00.000Z', accountId: 'acc1', icon: 'add' };
      const txOlder: Transaction = { id: 't3', payee: 'P3', amount: 30, type: 'expense', date: '2025-05-10T12:00:00.000Z', accountId: 'acc1', icon: 'add' };

      const grouped = groupTransactionsByDate([txToday, txYesterday, txOlder], fixedNow);

      expect(grouped['Today']).toHaveLength(1);
      expect(grouped['Today'][0].id).toBe('t1');

      expect(grouped['Yesterday']).toHaveLength(1);
      expect(grouped['Yesterday'][0].id).toBe('t2');

      const olderKeys = Object.keys(grouped).filter((k) => k !== 'Today' && k !== 'Yesterday');
      expect(olderKeys.length).toBe(1);
      expect(grouped[olderKeys[0]][0].id).toBe('t3');
    });
  });

  describe('formatTransactionAmount', () => {
    it('formats expense with minus sign prefix', () => {
      expect(formatTransactionAmount(45.5, 'expense')).toBe('-£45.50');
    });

    it('formats income with plus sign prefix', () => {
      expect(formatTransactionAmount(100, 'income')).toBe('+£100.00');
    });
  });

  describe('getUpdatedSearchParamsOnAccountChange', () => {
    it('preserves budgetId if budget belongs to new account', () => {
      const params = getUpdatedSearchParamsOnAccountChange('acc1', 'b1', sampleBudgets);
      expect(params).toEqual({ accountId: 'acc1', budgetId: 'b1' });
    });

    it('clears budgetId if budget does not belong to new account', () => {
      const params = getUpdatedSearchParamsOnAccountChange('acc2', 'b1', sampleBudgets);
      expect(params).toEqual({ accountId: 'acc2' });
    });

    it('preserves budgetId if all accounts selected (newAccountId = "")', () => {
      const params = getUpdatedSearchParamsOnAccountChange('', 'b1', sampleBudgets);
      expect(params).toEqual({ budgetId: 'b1' });
    });
  });

  describe('getUpdatedSearchParamsOnBudgetChange', () => {
    it('sets both accountId and budgetId when present', () => {
      const params = getUpdatedSearchParamsOnBudgetChange('b1', 'acc1');
      expect(params).toEqual({ accountId: 'acc1', budgetId: 'b1' });
    });

    it('omits budgetId when newBudgetId is empty', () => {
      const params = getUpdatedSearchParamsOnBudgetChange('', 'acc1');
      expect(params).toEqual({ accountId: 'acc1' });
    });
  });

  describe('buildTransactionUrl', () => {
    it('appends query params when present', () => {
      expect(buildTransactionUrl('/transactions/add', 'acc1', 'b1')).toBe('/transactions/add?accountId=acc1&budgetId=b1');
    });

    it('returns base path when no parameters are provided', () => {
      expect(buildTransactionUrl('/transactions/add', '', '')).toBe('/transactions/add');
    });
  });
});
