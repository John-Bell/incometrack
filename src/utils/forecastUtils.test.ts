import { describe, it, expect } from 'vitest';
import { calculateHybridForecast } from './forecastUtils';
import type { Account, InterestAccrual } from '@/lib/db';

const taxYearStart = 1712361600000; // April 6, 2024
const taxYearEnd = 1743811199000;   // April 5, 2025, 23:59:59

function createMockAccount(overrides: Partial<Account> = {}): Account {
    return {
        id: 'acc1',
        ownerId: 'user1',
        name: 'Test Account',
        balance: 10000,
        interestRate: 5,
        updatedAt: Date.now(),
        category: 'Cash',
        isCompound: true,
        ...overrides,
    };
}

function createMockAccrual(overrides: Partial<InterestAccrual> = {}): InterestAccrual {
    return {
        id: 'accrual1',
        accountId: 'acc1',
        date: taxYearStart + 1,
        interestAccrued: 0,
        ...overrides,
    };
}

describe('calculateHybridForecast', () => {
    it('Scenario 1: The Blank Slate (No Accruals)', () => {
        const account = createMockAccount(); // £10,000 balance, 5% rate, isCompound: true
        const result = calculateHybridForecast([account], [], taxYearStart, taxYearEnd);

        // Days remaining: (1743811199000 - 1712361600000) / 86400000 = 363.9999884259259
        // Projection: 10000 * (Math.pow(1.05, 363.9999884259259 / 365) - 1)
        // Which is ~£498.66. The user instructions say "~£500". Let's check what it exactly evaluates to.
        const expectedDays = (taxYearEnd - taxYearStart) / 86400000;
        const expected = 10000 * (Math.pow(1.05, expectedDays / 365) - 1);

        expect(result).toBeCloseTo(expected, 2);
    });

    it('Scenario 2: The Mid-Year Log (Partial Accruals)', () => {
        const account = createMockAccount();
        const halfYearMs = 182.5 * 86400000; // 182.5 days in ms
        const accrualDate = taxYearStart + halfYearMs;

        const accrual = createMockAccrual({
            date: accrualDate,
            interestAccrued: 250,
        });

        const result = calculateHybridForecast([account], [accrual], taxYearStart, taxYearEnd);

        const remainingDays = (taxYearEnd - accrualDate) / 86400000;
        const expectedFuture = 10000 * (Math.pow(1.05, remainingDays / 365) - 1);
        const expectedTotal = 250 + expectedFuture;

        expect(result).toBeCloseTo(expectedTotal, 2);
    });

    it('Scenario 3: Simple vs. Compound Math', () => {
        // Run test over a partial year (180 days remaining)
        // Set projection start to 185 days into the tax year to leave ~180 days
        const startOffsetMs = (365 - 180) * 86400000;
        const testStartDate = taxYearStart + startOffsetMs;

        const compoundAccount = createMockAccount({ isCompound: true, id: 'compound' });
        const simpleAccount = createMockAccount({ isCompound: false, id: 'simple' });

        const accrualCompound = createMockAccrual({ accountId: 'compound', date: testStartDate, interestAccrued: 0 });
        const accrualSimple = createMockAccrual({ accountId: 'simple', date: testStartDate, interestAccrued: 0 });

        const compoundResult = calculateHybridForecast([compoundAccount], [accrualCompound], taxYearStart, taxYearEnd);
        const simpleResult = calculateHybridForecast([simpleAccount], [accrualSimple], taxYearStart, taxYearEnd);

        const remainingDays = (taxYearEnd - testStartDate) / 86400000;

        const expectedCompound = 10000 * (Math.pow(1.05, remainingDays / 365) - 1);
        const expectedSimple = 10000 * 0.05 * (remainingDays / 365);

        expect(compoundResult).toBeCloseTo(expectedCompound, 2);
        expect(simpleResult).toBeCloseTo(expectedSimple, 2);

        // Ensure they yield distinct numbers over a partial year
        expect(Math.abs(compoundResult - simpleResult)).toBeGreaterThan(0.01);
    });

    it('Scenario 4: Fixed Term Maturing MID-Year', () => {
        const halfYearMs = 182.5 * 86400000;
        const midYearDate = taxYearStart + halfYearMs;

        const account = createMockAccount({
            interestPayoutFrequency: 'at_maturity',
            interestPayoutDate: midYearDate,
            isCompound: true
        });

        const result = calculateHybridForecast([account], [], taxYearStart, taxYearEnd);

        const activeDays = (midYearDate - taxYearStart) / 86400000;
        const expected = 10000 * (Math.pow(1.05, activeDays / 365) - 1);

        expect(result).toBeCloseTo(expected, 2);
    });

    it('Scenario 5: Fixed Term Maturing NEXT Year (Out of Bounds)', () => {
        const nextYearDate = taxYearEnd + 86400000; // 1 day after tax year end

        const account = createMockAccount({
            interestPayoutFrequency: 'at_maturity',
            interestPayoutDate: nextYearDate,
            isCompound: true
        });

        const result = calculateHybridForecast([account], [], taxYearStart, taxYearEnd);

        // Expect £0 projection for the current tax year since it matures out of bounds
        expect(result).toBe(0);
    });

    it('Scenario 6: Out of Bounds Accruals Ignored', () => {
        const account = createMockAccount();

        const beforeAccrual = createMockAccrual({
            date: taxYearStart - 86400000, // 1 day before
            interestAccrued: 100
        });

        const afterAccrual = createMockAccrual({
            date: taxYearEnd + 86400000, // 1 day after
            interestAccrued: 100
        });

        const result = calculateHybridForecast([account], [beforeAccrual, afterAccrual], taxYearStart, taxYearEnd);

        // It should act exactly like Scenario 1 (Blank Slate)
        const expectedDays = (taxYearEnd - taxYearStart) / 86400000;
        const expected = 10000 * (Math.pow(1.05, expectedDays / 365) - 1);

        expect(result).toBeCloseTo(expected, 2);
    });
});
