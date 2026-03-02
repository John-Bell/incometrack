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

        it('should return 0 if no accounts have an interest rate > 0', () => {
            const accounts = [
                createMockAccount(1000, 0),
                createMockAccount(2000, -1)
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

        it('should exclude accounts with 0 interest rate from blended rate calculation', () => {
            const accounts = [
                createMockAccount(1000, 5),
                createMockAccount(3000, 2),
                createMockAccount(5000, 0)
            ];
            // Only the first two should be included: (50 + 60) / 4000 = 2.75%
            expect(calculateBlendedRate(accounts)).toBe(2.75);
        });

        it('should handle accounts with 0 balance correctly', () => {
            const accounts = [
                createMockAccount(1000, 5),
                createMockAccount(0, 10)
            ];
            // (50 + 0) / (1000 + 0) = 5%
            expect(calculateBlendedRate(accounts)).toBe(5);
        });
    });
});
