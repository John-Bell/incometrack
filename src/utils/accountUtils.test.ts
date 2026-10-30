import { describe, it, expect } from 'vitest';
import { type Account } from '@/lib/db';
import {
  formatGBP,
  sortAccounts,
  formatAccountForDisplay,
  calculatePortfolioSummary,
  calculateTabSummaries,
} from './accountUtils';

describe('accountUtils', () => {
  const p1Name = 'Alice';
  const p2Name = 'Bob';

  const mockAccounts: Account[] = [
    {
      id: 'acc1',
      name: 'Santander Easy',
      nickname: 'Main Savings',
      balance: 10000,
      interestRate: 4.5,
      ownerId: 'person1',
      category: 'Easy Access Savings',
      updatedAt: Date.now() - 3600000,
      last4Digits: '1234',
    },
    {
      id: 'acc2',
      name: 'Barclays Joint',
      balance: 5000,
      interestRate: 2.0,
      ownerId: 'joint',
      category: 'Current Account',
      updatedAt: Date.now() - 7200000,
    },
    {
      id: 'acc3',
      name: 'Loyds DC Pension',
      balance: 50000,
      interestRate: 0,
      ownerId: 'person2',
      category: 'DC Pension',
      updatedAt: Date.now(),
    },
  ];

  describe('formatGBP', () => {
    it('formats numbers to GBP currency string', () => {
      expect(formatGBP(1234.56)).toBe('£1,234.56');
      expect(formatGBP(0)).toBe('£0.00');
    });
  });

  describe('sortAccounts', () => {
    it('sorts accounts by name in ascending alphabetical order', () => {
      const sorted = sortAccounts(mockAccounts, 'name');
      expect(sorted.map((a) => a.name)).toEqual([
        'Barclays Joint',
        'Loyds DC Pension',
        'Santander Easy',
      ]);
    });

    it('sorts accounts by interest rate in ascending numerical order', () => {
      const sorted = sortAccounts(mockAccounts, 'rate');
      expect(sorted.map((a) => a.name)).toEqual([
        'Loyds DC Pension',
        'Barclays Joint',
        'Santander Easy',
      ]);
    });
  });

  describe('formatAccountForDisplay', () => {
    const startTs = new Date(2025, 3, 6).getTime();
    const endTs = new Date(2026, 3, 5).getTime();

    it('formats person1 account with blue owner tag and correct icon color', () => {
      const formatted = formatAccountForDisplay(
        mockAccounts[0],
        [],
        startTs,
        endTs,
        p1Name,
        p2Name
      );

      expect(formatted.id).toBe('acc1');
      expect(formatted.ownerTag).toBe('Alice');
      expect(formatted.ownerTagColor).toBe('blue');
      expect(formatted.accountIcon).toBe('S');
      expect(formatted.iconColor).toBe('red');
      expect(formatted.balance).toBe('£10,000.00');
      expect(formatted.rate).toBe('4.50%');
      expect(formatted.isTaxable).toBe(true);
    });

    it('formats person2 account with pink owner tag and handles zero interest rate', () => {
      const formatted = formatAccountForDisplay(
        mockAccounts[2],
        [],
        startTs,
        endTs,
        p1Name,
        p2Name
      );

      expect(formatted.ownerTag).toBe('Bob');
      expect(formatted.ownerTagColor).toBe('pink');
      expect(formatted.accountIcon).toBe('L');
      expect(formatted.iconColor).toBe('green');
      expect(formatted.rate).toBeUndefined();
      expect(formatted.isTaxable).toBe(false); // DC Pension is tax free category
    });

    it('formats joint account with purple owner tag', () => {
      const formatted = formatAccountForDisplay(
        mockAccounts[1],
        [],
        startTs,
        endTs,
        p1Name,
        p2Name
      );

      expect(formatted.ownerTag).toBe('Joint');
      expect(formatted.ownerTagColor).toBe('purple');
      expect(formatted.accountIcon).toBe('B');
      expect(formatted.iconColor).toBe('blue');
    });
  });

  describe('calculatePortfolioSummary', () => {
    it('calculates formatted total, non-pension, and taxable savings', () => {
      const summary = calculatePortfolioSummary(mockAccounts);

      expect(summary.formattedTotalSavings).toBe('£65,000.00');
      expect(summary.formattedNonPensionSavings).toBe('£15,000.00');
      expect(summary.formattedTaxableSavings).toBe('£15,000.00');
    });
  });

  describe('calculateTabSummaries', () => {
    const startTs = new Date(2025, 3, 6).getTime();
    const endTs = new Date(2026, 3, 5).getTime();

    it('returns tab summaries for person1, person2, and joint', () => {
      const summaries = calculateTabSummaries(
        mockAccounts,
        [],
        startTs,
        endTs,
        p1Name,
        p2Name
      );

      expect(summaries).toHaveLength(3);
      expect(summaries[0].id).toBe('person1');
      expect(summaries[0].label).toBe('Alice');
      expect(summaries[1].id).toBe('person2');
      expect(summaries[1].label).toBe('Bob');
      expect(summaries[2].id).toBe('joint');
      expect(summaries[2].label).toBe('Joint');
    });
  });
});
