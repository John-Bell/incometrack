import { describe, it, expect } from 'vitest';
import { calculateProjectedAnnualInterest } from './interestCalculations';
import type { Account, InterestAccrual } from '../lib/db';

describe('calculateProjectedAnnualInterest', () => {
    // Dynamically calculating realistic dates bounded by the tax year
    // Start: April 6, 2024
    // End: April 5, 2025 23:59:59
    const taxYearStartTs = new Date(2024, 3, 6).getTime();
    const taxYearEndTs = new Date(2025, 3, 5, 23, 59, 59, 999).getTime();

    const createMockAccount = (overrides: Partial<Account>): Account => ({
        id: 'acc1',
        name: 'Test Account',
        ownerId: 'owner1',
        category: 'Cash',
        updatedAt: Date.now(),
        balance: 0,
        interestRate: 0,
        ...overrides
    });

    describe('Group 1: Manual Tracking Method', () => {
        it('Scenario 1: Monthly - Standard Mid-Year Projection', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'manual',
                interestPayoutFrequency: 'monthly',
                balance: 1000,
                interestRate: 5
            });

            const accruals: InterestAccrual[] = [
                { id: '1', accountId: 'acc1', date: new Date(2024, 4, 6).getTime(), interestAccrued: 10, balance: 1000 }, // May 2024
                { id: '2', accountId: 'acc1', date: new Date(2024, 5, 6).getTime(), interestAccrued: 10, balance: 1000 }, // June 2024
                { id: '3', accountId: 'acc1', date: new Date(2024, 6, 6).getTime(), interestAccrued: 15, balance: 1000 }, // July 2024
            ];

            const result = calculateProjectedAnnualInterest(account, accruals, taxYearStartTs, taxYearEndTs);

            // Sum of 3 entries = 35.
            // Latest is July (month 6 in JS). End is April (month 3 in JS, next year).
            // Months remaining = (2025 - 2024) * 12 + (3 - 6) = 12 - 3 = 9.
            // 9 * 15 = 135
            // Total = 35 + 135 = 170
            expect(result).toBe(170);
        });

        it('Scenario 2: Monthly - Mid-Year Cutoff', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'manual',
                interestPayoutFrequency: 'monthly',
                interestPayoutDate: new Date(2024, 9, 6).getTime(), // Oct 6, 2024
                balance: 1000,
                interestRate: 5
            });

            const accruals: InterestAccrual[] = [
                { id: '1', accountId: 'acc1', date: new Date(2024, 4, 6).getTime(), interestAccrued: 10, balance: 1000 }, // May 2024
                { id: '2', accountId: 'acc1', date: new Date(2024, 5, 6).getTime(), interestAccrued: 10, balance: 1000 }, // June 2024
                { id: '3', accountId: 'acc1', date: new Date(2024, 6, 6).getTime(), interestAccrued: 10, balance: 1000 }, // July 2024
                { id: '4', accountId: 'acc1', date: new Date(2024, 7, 6).getTime(), interestAccrued: 20, balance: 1000 }, // Aug 2024
            ];

            const result = calculateProjectedAnnualInterest(account, accruals, taxYearStartTs, taxYearEndTs);

            // Sum of 4 entries = 50.
            // Latest is Aug (month 7). Payout is Oct (month 9).
            // Months remaining = 9 - 7 = 2.
            // 2 * 20 = 40.
            // Total = 50 + 40 = 90.
            expect(result).toBe(90);
        });

        it('Scenario 3: Lump Sum - Not Yet Paid This Year', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'manual',
                interestPayoutFrequency: 'annually',
                interestPayoutDate: new Date(2024, 11, 1).getTime(), // Dec 1, 2024 (Within tax year)
                balance: 1000,
                interestRate: 5
            });

            const accruals: InterestAccrual[] = [];

            const result = calculateProjectedAnnualInterest(account, accruals, taxYearStartTs, taxYearEndTs);

            // Estimated AER lump sum = 1000 * 5% = 50
            expect(result).toBe(50);
        });

        it('Scenario 4: Lump Sum - Already Paid This Year', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'manual',
                interestPayoutFrequency: 'annually',
                interestPayoutDate: new Date(2024, 11, 1).getTime(), // Dec 1, 2024
                balance: 1000,
                interestRate: 5
            });

            const accruals: InterestAccrual[] = [
                { id: '1', accountId: 'acc1', date: new Date(2024, 11, 1).getTime(), interestAccrued: 60, balance: 1000 }
            ];

            const result = calculateProjectedAnnualInterest(account, accruals, taxYearStartTs, taxYearEndTs);

            // Only amount logged = 60
            expect(result).toBe(60);
        });

        it('Scenario 5: Lump Sum - Pays Outside Tax Year', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'manual',
                interestPayoutFrequency: 'annually',
                interestPayoutDate: new Date(2025, 6, 1).getTime(), // July 1, 2025 (Outside tax year)
                balance: 1000,
                interestRate: 5
            });

            const accruals: InterestAccrual[] = [];

            const result = calculateProjectedAnnualInterest(account, accruals, taxYearStartTs, taxYearEndTs);

            // Outside tax year = 0
            expect(result).toBe(0);
        });
    });

    describe('Group 2: Automatic/AER Tracking Method', () => {
        it('Scenario 6: Monthly - Standard AER', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'aer',
                interestPayoutFrequency: 'monthly',
                balance: 1000,
                interestRate: 5
            });

            const result = calculateProjectedAnnualInterest(account, [], taxYearStartTs, taxYearEndTs);

            // Standard calculation: 1000 * 5% = 50
            expect(result).toBe(50);
        });

        it('Scenario 7: Monthly - Pro-rated AER due to Cutoff', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'aer',
                interestPayoutFrequency: 'monthly',
                interestPayoutDate: new Date(2024, 9, 6).getTime(), // Oct 6, 2024 (6 months into tax year)
                balance: 1000,
                interestRate: 5
            });

            const result = calculateProjectedAnnualInterest(account, [], taxYearStartTs, taxYearEndTs);

            // 6 months active: (50 / 12) * 6 = 25
            expect(result).toBe(25);
        });

        it('Scenario 8: Lump Sum - Pays This Tax Year', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'aer',
                interestPayoutFrequency: 'annually',
                interestPayoutDate: new Date(2024, 11, 1).getTime(), // Dec 1, 2024
                balance: 1000,
                interestRate: 5
            });

            const result = calculateProjectedAnnualInterest(account, [], taxYearStartTs, taxYearEndTs);

            // Pays this tax year: full lump sum = 50
            expect(result).toBe(50);
        });

        it('Scenario 9: Lump Sum - Pays Outside Tax Year', () => {
            const account = createMockAccount({
                interestTrackingMethod: 'aer',
                interestPayoutFrequency: 'annually',
                interestPayoutDate: new Date(2025, 6, 1).getTime(), // July 1, 2025
                balance: 1000,
                interestRate: 5
            });

            const result = calculateProjectedAnnualInterest(account, [], taxYearStartTs, taxYearEndTs);

            // Pays outside tax year = 0
            expect(result).toBe(0);
        });
    });
});
