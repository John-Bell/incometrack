import { describe, it, expect } from 'vitest';
import {
    isIncomeValidInTaxYear,
    calculateIncomeForTaxYear,
    calculatePartnerIncomeSplitPercentages,
    formatWholeCurrency,
    formatCompactThousandsCurrency,
    groupIncomesByType,
    getAvailableSimulatorTaxYears,
    calculateSliderPercent,
    resolveIncomeDropdownSelection,
    formatOptionalDateInput,
    parseOptionalDateInput
} from './incomeCalculations';
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

describe('calculateIncomeForTaxYear', () => {
    const taxYearStart = new Date(2024, 3, 6).getTime();
    const taxYearEnd = new Date(2025, 3, 5, 23, 59, 59, 999).getTime();
    const midTaxYear = taxYearStart + (taxYearEnd - taxYearStart) / 2;

    const baseIncome: Income = {
        id: 'test-id',
        ownerId: 'person1',
        name: 'Pension',
        amount: 2000,
        frequency: 'monthly',
        type: 'pension',
        taxCategory: 'Pension'
    };

    it('returns full annualized amount for monthly income with no start or end date', () => {
        expect(calculateIncomeForTaxYear(baseIncome, taxYearStart, taxYearEnd)).toBe(24000);
    });

    it('returns full amount for annual income with no start or end date', () => {
        const annualIncome: Income = { ...baseIncome, amount: 18000, frequency: 'annual' };
        expect(calculateIncomeForTaxYear(annualIncome, taxYearStart, taxYearEnd)).toBe(18000);
    });

    it('pro-rates income starting halfway through the tax year', () => {
        const income: Income = {
            ...baseIncome,
            startDate: midTaxYear
        };
        expect(calculateIncomeForTaxYear(income, taxYearStart, taxYearEnd)).toBeCloseTo(12000, 2);
    });

    it('pro-rates income ending halfway through the tax year', () => {
        const income: Income = {
            ...baseIncome,
            endDate: midTaxYear
        };
        expect(calculateIncomeForTaxYear(income, taxYearStart, taxYearEnd)).toBeCloseTo(12000, 2);
    });

    it('pro-rates income starting at 25% and ending at 75% of the tax year', () => {
        const quarterSpan = (taxYearEnd - taxYearStart) * 0.25;
        const income: Income = {
            ...baseIncome,
            startDate: taxYearStart + quarterSpan,
            endDate: taxYearStart + quarterSpan * 3
        };
        expect(calculateIncomeForTaxYear(income, taxYearStart, taxYearEnd)).toBeCloseTo(12000, 2);
    });

    it('returns 0 for income outside the tax year', () => {
        const futureIncome: Income = {
            ...baseIncome,
            startDate: taxYearEnd + 1000
        };
        expect(calculateIncomeForTaxYear(futureIncome, taxYearStart, taxYearEnd)).toBe(0);
    });

    it('does not pro-rate dividends that start mid-tax-year', () => {
        const dividendIncome: Income = {
            ...baseIncome,
            type: 'dividends',
            taxCategory: 'Dividend',
            frequency: 'annual',
            amount: 5000,
            startDate: midTaxYear
        };
        expect(calculateIncomeForTaxYear(dividendIncome, taxYearStart, taxYearEnd)).toBe(5000);
    });
});

describe('income page & simulator pure helpers', () => {
    it('calculates partner income split percentages and defaults to 50/50 when total is 0', () => {
        expect(calculatePartnerIncomeSplitPercentages(0, 0)).toEqual({
            total: 0,
            p1Pct: 50,
            p2Pct: 50
        });
        expect(calculatePartnerIncomeSplitPercentages(750, 250)).toEqual({
            total: 1000,
            p1Pct: 75,
            p2Pct: 25
        });
    });

    it('formats whole and compact thousands currencies in en-GB', () => {
        expect(formatWholeCurrency(12345.67)).toBe('£12,346');
        expect(formatCompactThousandsCurrency(12500)).toBe('£12.5k');
    });

    it('groups incomes by type', () => {
        const items: Income[] = [
            { id: '1', ownerId: 'person1', name: 'Job', amount: 50000, frequency: 'annual', type: 'employment', taxCategory: 'Earned' },
            { id: '2', ownerId: 'person1', name: 'SIPP', amount: 12000, frequency: 'annual', type: 'pension', taxCategory: 'Pension' },
            { id: '3', ownerId: 'person1', name: 'Divs', amount: 2000, frequency: 'annual', type: 'dividends', taxCategory: 'Dividend' }
        ];
        const grouped = groupIncomesByType(items);
        expect(grouped.employment.map(i => i.id)).toEqual(['1']);
        expect(grouped.pensions.map(i => i.id)).toEqual(['2']);
        expect(grouped.dividends.map(i => i.id)).toEqual(['3']);
    });

    it('returns tax rule IDs when present and falls back to constant keys when empty', () => {
        expect(getAvailableSimulatorTaxYears([{ id: '2025-2026' }, { id: '2026-2027' }], ['2024-2025'])).toEqual([
            '2025-2026',
            '2026-2027'
        ]);
        expect(getAvailableSimulatorTaxYears([], ['2024-2025'])).toEqual(['2024-2025']);
        expect(getAvailableSimulatorTaxYears(undefined, ['2024-2025'])).toEqual(['2024-2025']);
    });

    it('calculates slider percentage with override or falls back to ratio or 50', () => {
        expect(calculateSliderPercent(80, 100, 500)).toBe(80);
        expect(calculateSliderPercent(undefined, 150, 600)).toBe(25);
        expect(calculateSliderPercent(undefined, 0, 0)).toBe(50);
    });

    it('resolves income dropdown selection for cleared, exact, and custom entries', () => {
        expect(resolveIncomeDropdownSelection(false, undefined, undefined)).toEqual({
            selectedDropdownPath: '',
            showCustomName: false
        });
        expect(resolveIncomeDropdownSelection(true, 'Private Pension', 'pension')).toEqual({
            selectedDropdownPath: 'Private Pension',
            showCustomName: false
        });
        expect(resolveIncomeDropdownSelection(true, 'My Consulting Ltd', 'dividends')).toEqual({
            selectedDropdownPath: 'Custom Dividend...',
            showCustomName: true
        });
    });

    it('formats and parses optional ISO date strings', () => {
        const ts = parseOptionalDateInput('2026-04-06');
        expect(ts).toBeTypeOf('number');
        expect(formatOptionalDateInput(ts)).toBe('2026-04-06');
        expect(parseOptionalDateInput('')).toBeUndefined();
        expect(formatOptionalDateInput(undefined)).toBe('');
    });
});

