import { describe, it, expect } from 'vitest';
import { calculateTotalSavings, calculateBlendedRate } from './accountCalculations';
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
            expect(calculateBlendedRate(accounts)).toBe(5);
        });

        it('should calculate correct blended rate for multiple accounts', () => {
            const accounts = [
                createMockAccount(1000, 5), // 1000 * 0.05 = 50
                createMockAccount(3000, 2)  // 3000 * 0.02 = 60
            ];
            // Total interest = 110. Total balance = 4000. 110 / 4000 = 0.0275 = 2.75%
            expect(calculateBlendedRate(accounts)).toBe(2.75);
        });

        it('should include accounts with 0 interest rate in blended rate calculation to drag down rate', () => {
            const accounts = [
                createMockAccount(1000, 5),
                createMockAccount(3000, 2),
                createMockAccount(4000, 0)
            ];
            // (50 + 60 + 0) / 8000 = 110 / 8000 = 1.375%
            expect(calculateBlendedRate(accounts)).toBe(1.375);
        });

        it('should handle accounts with 0 balance correctly', () => {
            const accounts = [
                createMockAccount(1000, 5),
                createMockAccount(0, 10)
            ];
            // (50 + 0) / (1000 + 0) = 5%
            expect(calculateBlendedRate(accounts)).toBe(5);
        });

        it('should factor in manual tracking accounts correctly', () => {
            const manualAccount: Account = {
                ...createMockAccount(2000, 0),
                id: 'acc1',
                interestTrackingMethod: 'manual'
            };
            const aerAccount = createMockAccount(1000, 5); // 1000 * 0.05 = 50

            const accruals = [
                { id: '1', accountId: 'acc1', date: 1000, balance: 2000, interestAccrued: 10 },
                { id: '2', accountId: 'acc1', date: 2000, balance: 2000, interestAccrued: 15 } // latest
            ];
            // manualAccount projected interest: 15 * 12 = 180
            // total interest: 180 + 50 = 230
            // total balance: 2000 + 1000 = 3000
            // rate: 230 / 3000 = 0.07666... = 7.666...%
            expect(calculateBlendedRate([manualAccount, aerAccount], accruals)).toBeCloseTo(7.6667, 4);
        });
    });
});
