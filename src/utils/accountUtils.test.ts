import { describe, it, expect } from 'vitest';
import { type Account, type InterestAccrual } from '@/lib/db';
import {
  formatGBP,
  sortAccounts,
  getNextAccountSort,
  getAccountSortLabel,
  getAccountUpdateInfo,
  getAccountLedgerInfo,
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

    it('sorts accounts by updatedAt oldest first with alphabetical tie-breaker', () => {
      const accountsWithDates: Account[] = [
        { ...mockAccounts[0], name: 'Zeta', updatedAt: 2000 },
        { ...mockAccounts[1], name: 'Beta', updatedAt: 1000 },
        { ...mockAccounts[2], name: 'Alpha', updatedAt: 1000 },
        { ...mockAccounts[2], id: 'acc4', name: 'NoDate', updatedAt: 0 },
      ];
      const sorted = sortAccounts(accountsWithDates, 'updatedAt');
      expect(sorted.map((a) => a.name)).toEqual(['NoDate', 'Alpha', 'Beta', 'Zeta']);
    });
  });

  describe('getNextAccountSort and getAccountSortLabel', () => {
    it('cycles through name -> rate -> updatedAt -> name', () => {
      expect(getNextAccountSort('name')).toBe('rate');
      expect(getNextAccountSort('rate')).toBe('updatedAt');
      expect(getNextAccountSort('updatedAt')).toBe('name');
    });

    it('returns display labels for each sort option', () => {
      expect(getAccountSortLabel('name')).toBe('Name');
      expect(getAccountSortLabel('rate')).toBe('Rate');
      expect(getAccountSortLabel('updatedAt')).toBe('Last Updated');
    });
  });

  describe('getAccountUpdateInfo', () => {
    const now = new Date(2026, 10, 21, 14, 0, 0).getTime(); // 21 Nov 2026 14:00

    it('handles missing or zero updatedAt as unknown and stale', () => {
      expect(getAccountUpdateInfo(undefined, now)).toEqual({
        formattedDate: 'Unknown',
        ageLabel: null,
        displayText: 'Never updated',
        daysSinceUpdate: null,
        freshness: 'unknown',
        isStale: true,
      });
      expect(getAccountUpdateInfo(0, now).freshness).toBe('unknown');
    });

    it('formats updates within the last minute as Just now', () => {
      const info = getAccountUpdateInfo(now - 30 * 1000, now);
      expect(info.displayText).toBe('Just now');
      expect(info.freshness).toBe('fresh');
      expect(info.isStale).toBe(false);
    });

    it('formats updates within the last hour in minutes', () => {
      expect(getAccountUpdateInfo(now - 60 * 1000, now).displayText).toBe('1 min ago');
      expect(getAccountUpdateInfo(now - 15 * 60 * 1000, now).displayText).toBe('15 mins ago');
    });

    it('formats earlier same-day updates as Today', () => {
      const info = getAccountUpdateInfo(new Date(2026, 10, 21, 8, 0, 0).getTime(), now);
      expect(info.displayText).toBe('Today');
      expect(info.freshness).toBe('fresh');
      expect(info.daysSinceUpdate).toBe(0);
    });

    it('formats previous calendar day updates as Yesterday', () => {
      const info = getAccountUpdateInfo(new Date(2026, 10, 20, 22, 0, 0).getTime(), now);
      expect(info.displayText).toBe('Yesterday');
      expect(info.freshness).toBe('fresh');
      expect(info.daysSinceUpdate).toBe(1);
    });

    it('formats 2-29 days ago with date and days ago as fresh', () => {
      const fiveDaysAgo = new Date(2026, 10, 16, 10, 0, 0).getTime();
      const info = getAccountUpdateInfo(fiveDaysAgo, now);
      expect(info.displayText).toBe('16 Nov (5 days ago)');
      expect(info.freshness).toBe('fresh');
      expect(info.isStale).toBe(false);
      expect(info.daysSinceUpdate).toBe(5);
    });

    it('marks 30-59 days ago as aging with month period', () => {
      const thirtyFiveDaysAgo = new Date(2026, 9, 17, 10, 0, 0).getTime();
      const info = getAccountUpdateInfo(thirtyFiveDaysAgo, now);
      expect(info.displayText).toBe('17 Oct (1 month ago)');
      expect(info.freshness).toBe('aging');
      expect(info.isStale).toBe(true);
      expect(info.daysSinceUpdate).toBe(35);
    });

    it('marks 60+ days ago as stale with months period', () => {
      const seventyFiveDaysAgo = new Date(2026, 8, 7, 10, 0, 0).getTime();
      const info = getAccountUpdateInfo(seventyFiveDaysAgo, now);
      expect(info.displayText).toBe('7 Sept (2 months ago)');
      expect(info.freshness).toBe('stale');
      expect(info.isStale).toBe(true);
      expect(info.daysSinceUpdate).toBe(75);
    });

    it('includes year and years ago for updates over a year old', () => {
      const overYearAgo = new Date(2025, 9, 17, 10, 0, 0).getTime();
      const info = getAccountUpdateInfo(overYearAgo, now);
      expect(info.displayText).toBe('17 Oct 2025 (1 year ago)');
      expect(info.freshness).toBe('stale');
      expect(info.isStale).toBe(true);
    });

    it('clamps future timestamps safely to Just now', () => {
      const info = getAccountUpdateInfo(now + 60 * 60 * 1000, now);
      expect(info.displayText).toBe('Just now');
      expect(info.freshness).toBe('fresh');
      expect(info.isStale).toBe(false);
    });
  });

  describe('getAccountLedgerInfo', () => {
    const now = new Date(2026, 10, 21, 14, 0, 0).getTime(); // 21 Nov 2026

    const makeAccrual = (id: string, accountId: string, date: number): InterestAccrual => ({
      id,
      accountId,
      date,
      interestAccrued: 25.5,
      updatedAt: date,
    });

    it('returns null when account has no ledger entries', () => {
      const otherAccruals = [makeAccrual('1', 'other-acc', new Date(2026, 10, 15).getTime())];
      expect(getAccountLedgerInfo('acc1', [], 'monthly', now)).toBeNull();
      expect(getAccountLedgerInfo('acc1', otherAccruals, 'monthly', now)).toBeNull();
    });

    it('selects the latest entry date regardless of array order and tracks entryCount', () => {
      const accruals = [
        makeAccrual('1', 'acc1', new Date(2026, 8, 1).getTime()),
        makeAccrual('2', 'acc1', new Date(2026, 10, 15).getTime()),
        makeAccrual('3', 'acc1', new Date(2026, 9, 15).getTime()),
      ];
      const info = getAccountLedgerInfo('acc1', accruals, 'monthly', now);
      expect(info).not.toBeNull();
      expect(info?.entryCount).toBe(3);
      expect(info?.displayText).toBe('15 Nov (6 days ago)');
      expect(info?.daysSinceEntry).toBe(6);
      expect(info?.freshness).toBe('recent');
    });

    it('formats today and yesterday entries cleanly', () => {
      const todayInfo = getAccountLedgerInfo(
        'acc1',
        [makeAccrual('1', 'acc1', new Date(2026, 10, 21, 9, 0, 0).getTime())],
        'monthly',
        now
      );
      expect(todayInfo?.displayText).toBe('Today');
      expect(todayInfo?.freshness).toBe('recent');

      const yesterdayInfo = getAccountLedgerInfo(
        'acc1',
        [makeAccrual('1', 'acc1', new Date(2026, 10, 20, 9, 0, 0).getTime())],
        'monthly',
        now
      );
      expect(yesterdayInfo?.displayText).toBe('Yesterday');
      expect(yesterdayInfo?.freshness).toBe('recent');
    });

    it('marks monthly accounts as overdue when latest ledger entry is >= 40 days old', () => {
      const fortyFiveDaysAgo = new Date(2026, 9, 7).getTime();
      const info = getAccountLedgerInfo(
        'acc1',
        [makeAccrual('1', 'acc1', fortyFiveDaysAgo)],
        'monthly',
        now
      );
      expect(info?.displayText).toBe('7 Oct (1 month ago)');
      expect(info?.daysSinceEntry).toBe(45);
      expect(info?.freshness).toBe('overdue');
    });

    it('keeps annual, at_maturity, and sporadic accounts neutral even when older than 40 days', () => {
      const priorYearEntry = new Date(2025, 10, 1).getTime();
      const accruals = [makeAccrual('1', 'acc1', priorYearEntry)];

      const annualInfo = getAccountLedgerInfo('acc1', accruals, 'annually', now);
      expect(annualInfo?.displayText).toBe('1 Nov 2025 (1 year ago)');
      expect(annualInfo?.freshness).toBe('neutral');

      const maturityInfo = getAccountLedgerInfo('acc1', accruals, 'at_maturity', now);
      expect(maturityInfo?.freshness).toBe('neutral');

      const sporadicInfo = getAccountLedgerInfo('acc1', accruals, undefined, now);
      expect(sporadicInfo?.freshness).toBe('neutral');
    });

    it('handles future-dated ledger entries without negative days', () => {
      const futureEntry = new Date(2026, 11, 1).getTime();
      const info = getAccountLedgerInfo(
        'acc1',
        [makeAccrual('1', 'acc1', futureEntry)],
        'monthly',
        now
      );
      expect(info?.daysSinceEntry).toBe(0);
      expect(info?.ageLabel).toBe('Scheduled');
      expect(info?.displayText).toBe('1 Dec');
      expect(info?.freshness).toBe('recent');
    });
  });

  describe('formatAccountForDisplay', () => {
    const startTs = new Date(2025, 3, 6).getTime();
    const endTs = new Date(2026, 3, 5).getTime();

    it('formats person1 account with blue owner tag and correct icon color', () => {
      const now = new Date(2026, 10, 21, 14, 0, 0).getTime();
      const formatted = formatAccountForDisplay(
        { ...mockAccounts[0], updatedAt: now - 3600000 },
        [],
        startTs,
        endTs,
        p1Name,
        p2Name,
        now
      );

      expect(formatted.id).toBe('acc1');
      expect(formatted.ownerTag).toBe('Alice');
      expect(formatted.ownerTagColor).toBe('blue');
      expect(formatted.accountIcon).toBe('S');
      expect(formatted.iconColor).toBe('red');
      expect(formatted.balance).toBe('£10,000.00');
      expect(formatted.rate).toBe('4.50%');
      expect(formatted.isTaxable).toBe(true);
      expect(formatted.updatedAt).toBe('Today');
      expect(formatted.updatedAtFreshness).toBe('fresh');
      expect(formatted.isStale).toBe(false);
    });

    it('surfaces stale freshness metadata when account has not been updated recently', () => {
      const now = new Date(2026, 10, 21, 14, 0, 0).getTime();
      const oldTs = new Date(2026, 7, 1, 10, 0, 0).getTime();
      const formatted = formatAccountForDisplay(
        { ...mockAccounts[0], updatedAt: oldTs },
        [],
        startTs,
        endTs,
        p1Name,
        p2Name,
        now
      );

      expect(formatted.updatedAt).toBe('1 Aug (3 months ago)');
      expect(formatted.updatedAtFreshness).toBe('stale');
      expect(formatted.isStale).toBe(true);
      expect(formatted.ledgerLastEntry).toBeUndefined();
      expect(formatted.ledgerFreshness).toBeUndefined();
    });

    it('surfaces ledger last entry from all-time accruals including prior tax years', () => {
      const now = new Date(2026, 10, 21, 14, 0, 0).getTime();
      const priorTaxYearAccrual: InterestAccrual = {
        id: 'old-1',
        accountId: 'acc1',
        date: new Date(2025, 2, 15).getTime(),
        interestAccrued: 120,
        updatedAt: new Date(2025, 2, 15).getTime(),
      };
      const formatted = formatAccountForDisplay(
        { ...mockAccounts[0], interestPayoutFrequency: 'annually', updatedAt: now },
        [],
        new Date(2026, 3, 6).getTime(),
        new Date(2027, 3, 5).getTime(),
        p1Name,
        p2Name,
        now,
        [priorTaxYearAccrual]
      );

      expect(formatted.ledgerLastEntry).toBe('15 Mar 2025 (1 year ago)');
      expect(formatted.ledgerFreshness).toBe('neutral');
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
