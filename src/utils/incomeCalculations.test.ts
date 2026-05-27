import { describe, it, expect } from 'vitest';
import { isIncomeValidInTaxYear } from './incomeCalculations';
import type { Income } from '@/lib/db';

describe('isIncomeValidInTaxYear', () => {
    // 2024-2025 tax year: 2024-04-06 to 2025-04-05
    const taxYearStart = new Date(2024, 3, 6).getTime();
    const taxYearEnd = new Date(2025, 3, 5, 23, 59, 59, 999).getTime();

    const baseIncome: Income = {
        id: 'test-id',
        ownerId: 'person1',
        name: 'Test Income',
        amount: 1000,
        frequency: 'monthly',
        type: 'employment',
        taxCategory: 'Earned'
    };

    it('returns true for income with no start or end date', () => {
        expect(isIncomeValidInTaxYear(baseIncome, taxYearStart, taxYearEnd)).toBe(true);
    });

    it('returns true for income starting before and ending after tax year', () => {
        const income = {
            ...baseIncome,
            startDate: new Date(2023, 0, 1).getTime(),
            endDate: new Date(2026, 0, 1).getTime()
        };
        expect(isIncomeValidInTaxYear(income, taxYearStart, taxYearEnd)).toBe(true);
    });

    it('returns true for income starting mid-year with no end date', () => {
        const income = {
            ...baseIncome,
            startDate: new Date(2024, 6, 1).getTime()
        };
        expect(isIncomeValidInTaxYear(income, taxYearStart, taxYearEnd)).toBe(true);
    });

    it('returns true for income ending mid-year with no start date', () => {
        const income = {
            ...baseIncome,
            endDate: new Date(2024, 6, 1).getTime()
        };
        expect(isIncomeValidInTaxYear(income, taxYearStart, taxYearEnd)).toBe(true);
    });

    it('returns true for income starting and ending within the tax year', () => {
        const income = {
            ...baseIncome,
            startDate: new Date(2024, 4, 1).getTime(),
            endDate: new Date(2024, 8, 1).getTime()
        };
        expect(isIncomeValidInTaxYear(income, taxYearStart, taxYearEnd)).toBe(true);
    });

    it('returns false for income ending before the tax year starts', () => {
        const income = {
            ...baseIncome,
            endDate: taxYearStart - 1
        };
        expect(isIncomeValidInTaxYear(income, taxYearStart, taxYearEnd)).toBe(false);
    });

    it('returns false for income starting after the tax year ends', () => {
        const income = {
            ...baseIncome,
            startDate: taxYearEnd + 1
        };
        expect(isIncomeValidInTaxYear(income, taxYearStart, taxYearEnd)).toBe(false);
    });

    it('returns true for income starting exactly on the last day of the tax year', () => {
        const income = {
            ...baseIncome,
            startDate: taxYearEnd
        };
        expect(isIncomeValidInTaxYear(income, taxYearStart, taxYearEnd)).toBe(true);
    });

    it('returns true for income ending exactly on the first day of the tax year', () => {
        const income = {
            ...baseIncome,
            endDate: taxYearStart
        };
        expect(isIncomeValidInTaxYear(income, taxYearStart, taxYearEnd)).toBe(true);
    });
});
