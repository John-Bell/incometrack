import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { calculateTotalSavings, calculateBlendedRate, calculateTaxableSavings, calculateProjectedTaxableInterest } from './accountCalculations';
import { getTaxYearDates } from '@/constants/taxConstants';
import { type Account } from '@/lib/db';

describe('accountCalculations', () => {
    const createMockAccount = (balance: number, interestRate: number): Account => ({
        id: Math.random().toString(),
        ownerId: 'person1',
        name: 'Test Account',
        category: 'Cash',
        updatedAt: Date.now(),
        balance,
        interestRate
    });

    describe('calculateTotalSavings', () => {
        it('should return 0 for empty accounts', () => {
            expect(calculateTotalSavings([])).toBe(0);
        });

        it('should calculate total for a single account', () => {
            const accounts = [createMockAccount(1000, 5)];
            expect(calculateTotalSavings(accounts)).toBe(1000);
        });

        it('should calculate total for multiple accounts', () => {
            const accounts = [
                createMockAccount(1000, 5),
                createMockAccount(2500, 2),
                createMockAccount(500, 0)
            ];
            expect(calculateTotalSavings(accounts)).toBe(4000);
        });

        it('should handle accounts with missing or falsy balance safely', () => {
            const accounts = [
                createMockAccount(1000, 5),
                { ...createMockAccount(0, 5), balance: undefined as any }
            ];
            expect(calculateTotalSavings(accounts)).toBe(1000);
        });
    });

    describe('calculateBlendedRate', () => {
        it('should return 0 for empty accounts', () => {
            expect(calculateBlendedRate([])).toBe(0);
        });

        it('should return 0 if all accounts return 0 projected interest and 0 balance', () => {
            const accounts = [
                createMockAccount(0, 0)
            ];
            expect(calculateBlendedRate(accounts)).toBe(0);
        });

        it('should calculate correct blended rate for a single account', () => {
            const accounts = [createMockAccount(1000, 5)];
            expect(calculateBlendedRate(accounts)).toBeCloseTo(5, 2);
        });

        it('should calculate correct blended rate for multiple accounts', () => {
            const accounts = [
                createMockAccount(1000, 5), // 1000 * 0.05 = 50
                createMockAccount(3000, 2)  // 3000 * 0.02 = 60
            ];
            // Total interest = 110. Total balance = 4000. 110 / 4000 = 0.0275 = 2.75%
            expect(calculateBlendedRate(accounts)).toBeCloseTo(2.75, 2);
        });

        it('should include accounts with 0 interest rate in blended rate calculation to drag down rate', () => {
            const accounts = [
                createMockAccount(1000, 5),
                createMockAccount(3000, 2),
                createMockAccount(4000, 0)
            ];
            // (50 + 60 + 0) / 8000 = 110 / 8000 = 1.375%
            expect(calculateBlendedRate(accounts)).toBeCloseTo(1.375, 2);
        });

        it('should handle accounts with 0 balance correctly', () => {
            const accounts = [
                createMockAccount(1000, 5),
                createMockAccount(0, 10)
            ];
            // (50 + 0) / (1000 + 0) = 5%
            expect(calculateBlendedRate(accounts)).toBeCloseTo(5, 2);
        });

        it('should factor in manual tracking accounts correctly', () => {
            const manualAccount: Account = {
                ...createMockAccount(2000, 0),
                id: 'acc1',
                interestTrackingMethod: 'manual'
            };
            const aerAccount = createMockAccount(1000, 5); // 1000 * 0.05 = 50

            // Let's explicitly pass a tax year to calculateBlendedRate so we know the dates.
            // Tax year 2024-2025: starts 2024-04-06, ends 2025-04-05
            const taxYearStart = new Date(2024, 3, 6).getTime();

            const accruals = [
                { id: '1', accountId: 'acc1', date: taxYearStart + 100000, balance: 2000, interestAccrued: 10 },
                { id: '2', accountId: 'acc1', date: taxYearStart + 200000, balance: 2000, interestAccrued: 15 } // latest
            ];
            // manualAccount actual interest so far: 10 + 15 = 25
            // no projection for manual tracking, so total manual interest: 25
            // aer account interest: 50
            // total interest: 25 + 50 = 75
            // total balance: 2000 + 1000 = 3000
            // rate: 75 / 3000 = 0.025 = 2.5%
            expect(calculateBlendedRate([manualAccount, aerAccount], accruals, '2024-2025')).toBeCloseTo(2.5, 4);
        });
    });
});
describe('calculateTaxableSavings', () => {
    it('returns 0 when accounts is empty', () => {
        expect(calculateTaxableSavings([])).toBe(0);
    });

    it('sums all balances when no accounts are in excluded categories', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 100, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 0 },
            { id: '2', name: 'Acc 2', balance: 200, ownerId: 'p2', updatedAt: 0, category: 'Easy Access Savings', interestRate: 0 },
        ];
        expect(calculateTaxableSavings(accounts)).toBe(300);
    });

    it('excludes DC Pension accounts', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 100, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 0 },
            { id: '2', name: 'Acc 2', balance: 500, ownerId: 'p2', updatedAt: 0, category: 'DC Pension', interestRate: 0 },
        ];
        expect(calculateTaxableSavings(accounts)).toBe(100);
    });

    it('excludes DC Pension (Post-Drawdown) accounts', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 100, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 0 },
            { id: '2', name: 'Acc 2', balance: 500, ownerId: 'p2', updatedAt: 0, category: 'DC Pension (Post-Drawdown)', interestRate: 0 },
        ];
        expect(calculateTaxableSavings(accounts)).toBe(100);
    });

    it('excludes Premium Bonds accounts', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 100, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 0 },
            { id: '2', name: 'Acc 2', balance: 500, ownerId: 'p2', updatedAt: 0, category: 'Premium Bonds', interestRate: 0 },
        ];
        expect(calculateTaxableSavings(accounts)).toBe(100);
    });

    it('excludes Cash ISA accounts', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 100, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 0 },
            { id: '2', name: 'Acc 2', balance: 500, ownerId: 'p2', updatedAt: 0, category: 'Cash ISA', interestRate: 0 },
        ];
        expect(calculateTaxableSavings(accounts)).toBe(100);
    });

    it('excludes a mix of excluded categories', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 100, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 0 },
            { id: '2', name: 'Acc 2', balance: 500, ownerId: 'p2', updatedAt: 0, category: 'DC Pension', interestRate: 0 },
            { id: '3', name: 'Acc 3', balance: 1000, ownerId: 'p2', updatedAt: 0, category: 'Premium Bonds', interestRate: 0 },
            { id: '4', name: 'Acc 4', balance: 2000, ownerId: 'p2', updatedAt: 0, category: 'Cash ISA', interestRate: 0 },
            { id: '5', name: 'Acc 5', balance: 300, ownerId: 'p1', updatedAt: 0, category: 'Fixed Term Savings', interestRate: 0 },
        ];
        expect(calculateTaxableSavings(accounts)).toBe(400);
    });
});

describe('calculateProjectedTaxableInterest', () => {
    const { startTs, endTs } = getTaxYearDates();

    beforeAll(() => {
        // Mock Date.now to startTs so daysRemaining is exactly (endTs - startTs) / msPerDay, which is ~365 days
        vi.useFakeTimers();
        vi.setSystemTime(new Date(startTs));
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('returns 0 when accounts is empty', () => {
        expect(calculateProjectedTaxableInterest([], [], startTs, endTs)).toBe(0);
    });

    it('calculates interest for non-excluded categories', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 1000, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 5 },
            { id: '2', name: 'Acc 2', balance: 2000, ownerId: 'p2', updatedAt: 0, category: 'Easy Access Savings', interestRate: 2 },
        ];
        // 1000 * 0.05 = 50
        // 2000 * 0.02 = 40
        // Total = 90
        expect(calculateProjectedTaxableInterest(accounts, [], startTs, endTs)).toBeCloseTo(90, 4);
    });

    it('excludes DC Pension accounts from interest calculation', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 1000, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 5 },
            { id: '2', name: 'Acc 2', balance: 5000, ownerId: 'p2', updatedAt: 0, category: 'DC Pension', interestRate: 10 },
        ];
        expect(calculateProjectedTaxableInterest(accounts, [], startTs, endTs)).toBeCloseTo(50, 4);
    });

    it('excludes DC Pension (Post-Drawdown) accounts from interest calculation', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 1000, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 5 },
            { id: '2', name: 'Acc 2', balance: 5000, ownerId: 'p2', updatedAt: 0, category: 'DC Pension (Post-Drawdown)', interestRate: 10 },
        ];
        expect(calculateProjectedTaxableInterest(accounts, [], startTs, endTs)).toBeCloseTo(50, 4);
    });

    it('excludes Premium Bonds accounts from interest calculation', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 1000, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 5 },
            { id: '2', name: 'Acc 2', balance: 5000, ownerId: 'p2', updatedAt: 0, category: 'Premium Bonds', interestRate: 10 },
        ];
        expect(calculateProjectedTaxableInterest(accounts, [], startTs, endTs)).toBeCloseTo(50, 4);
    });

    it('excludes Cash ISA accounts from interest calculation', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 1000, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 5 },
            { id: '2', name: 'Acc 2', balance: 5000, ownerId: 'p2', updatedAt: 0, category: 'Cash ISA', interestRate: 10 },
        ];
        expect(calculateProjectedTaxableInterest(accounts, [], startTs, endTs)).toBeCloseTo(50, 4);
    });

    it('excludes Shares ISA accounts from interest calculation', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 1000, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 5 },
            { id: '2', name: 'Acc 2', balance: 5000, ownerId: 'p2', updatedAt: 0, category: 'Shares ISA', interestRate: 10 },
        ];
        expect(calculateProjectedTaxableInterest(accounts, [], startTs, endTs)).toBeCloseTo(50, 4);
    });

    it('excludes a mix of excluded categories and includes valid ones', () => {
        const accounts: Account[] = [
            { id: '1', name: 'Acc 1', balance: 1000, ownerId: 'p1', updatedAt: 0, category: 'Current Account', interestRate: 5 },
            { id: '2', name: 'Acc 2', balance: 5000, ownerId: 'p2', updatedAt: 0, category: 'DC Pension', interestRate: 10 },
            { id: '3', name: 'Acc 3', balance: 1000, ownerId: 'p2', updatedAt: 0, category: 'Premium Bonds', interestRate: 10 },
            { id: '4', name: 'Acc 4', balance: 2000, ownerId: 'p2', updatedAt: 0, category: 'Cash ISA', interestRate: 10 },
            { id: '5', name: 'Acc 5', balance: 3000, ownerId: 'p1', updatedAt: 0, category: 'Fixed Term Savings', interestRate: 2 },
            { id: '6', name: 'Acc 6', balance: 1000, ownerId: 'p1', updatedAt: 0, category: 'Shares ISA', interestRate: 10 },
        ];
        // 1000 * 0.05 = 50
        // 3000 * 0.02 = 60
        // Total = 110
        expect(calculateProjectedTaxableInterest(accounts, [], startTs, endTs)).toBeCloseTo(110, 4);
    });
});
