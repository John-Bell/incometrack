import { describe, it, expect } from 'vitest';
import {
    calculatePropertyIncomeForTaxYear,
    calculatePropertyExpensesForTaxYear,
    calculatePropertyTotalsForRange,
    filterPropertyRecordsByTaxYearAndProperty,
    filterPropertyOwnerships,
    calculateComplementaryOwnershipSplit,
    buildPropertyListRedirectUrl,
} from './propertyCalculations';
import type { PropertyIncome, PropertyOwnership, PropertyExpense } from '@/lib/db';

describe('calculatePropertyIncomeForTaxYear', () => {
    it('calculates correct property income for each person based on ownership % at the time of income', () => {


        const propertyOwnerships: PropertyOwnership[] = [
            { id: 'own1', propertyId: 'prop1', startDate: 1000, person1Percent: 50, person2Percent: 50 },
            { id: 'own2', propertyId: 'prop1', startDate: 2000, person1Percent: 100, person2Percent: 0 },
        ];

        const propertyIncomes: PropertyIncome[] = [
            { id: 'inc1', propertyId: 'prop1', date: 1500, amount: 1000 }, // Under 50/50 split
            { id: 'inc2', propertyId: 'prop1', date: 2500, amount: 1000 }, // Under 100/0 split
            { id: 'inc3', propertyId: 'prop1', date: 3500, amount: 1000 }, // Outside tax year
        ];

        const startTs = 1000;
        const endTs = 3000;

        const result = calculatePropertyIncomeForTaxYear(propertyIncomes, propertyOwnerships, startTs, endTs);

        expect(result.p1Rental).toBe(1500); // 500 + 1000
        expect(result.p2Rental).toBe(500);  // 500 + 0
    });

    it('returns 0 if no ownership matches the income date', () => {


        const propertyOwnerships: PropertyOwnership[] = [
            { id: 'own1', propertyId: 'prop1', startDate: 2000, person1Percent: 50, person2Percent: 50 },
        ];

        const propertyIncomes: PropertyIncome[] = [
            { id: 'inc1', propertyId: 'prop1', date: 1500, amount: 1000 }, // Before ownership starts
        ];

        const startTs = 1000;
        const endTs = 3000;

        const result = calculatePropertyIncomeForTaxYear(propertyIncomes, propertyOwnerships, startTs, endTs);

        expect(result.p1Rental).toBe(0);
        expect(result.p2Rental).toBe(0);
    });

    it('calculates correct property income for a 100% P1 to 100% P2 mid-year transfer', () => {
        const propertyOwnerships: PropertyOwnership[] = [
            { id: 'own1', propertyId: 'prop1', startDate: 1000, person1Percent: 100, person2Percent: 0 },
            { id: 'own2', propertyId: 'prop1', startDate: 2000, person1Percent: 0, person2Percent: 100 },
        ];
        const propertyIncomes: PropertyIncome[] = [
            { id: 'inc1', propertyId: 'prop1', date: 1500, amount: 1000 },
            { id: 'inc2', propertyId: 'prop1', date: 2500, amount: 1000 },
        ];
        const result = calculatePropertyIncomeForTaxYear(propertyIncomes, propertyOwnerships, 1000, 3000);
        expect(result.p1Rental).toBe(1000);
        expect(result.p2Rental).toBe(1000);
    });
});

describe('calculatePropertyExpensesForTaxYear', () => {
    it('calculates correct property expenses for a 50/50 to 100/0 mid-year split', () => {
        const propertyOwnerships: PropertyOwnership[] = [
            { id: 'own1', propertyId: 'prop1', startDate: 1000, person1Percent: 50, person2Percent: 50 },
            { id: 'own2', propertyId: 'prop1', startDate: 2000, person1Percent: 100, person2Percent: 0 },
        ];
        const propertyExpenses: PropertyExpense[] = [
            { id: 'exp1', propertyId: 'prop1', date: 1500, payee: 'foo', amount: 400 },
            { id: 'exp2', propertyId: 'prop1', date: 2500, payee: 'bar', amount: 800 },
        ];
        const result = calculatePropertyExpensesForTaxYear(propertyExpenses, propertyOwnerships, 1000, 3000);
        expect(result.p1Expenses).toBe(1000); // 200 + 800
        expect(result.p2Expenses).toBe(200);  // 200 + 0
    });

    it('calculates correct property expenses for a 100% P1 to 100% P2 mid-year transfer', () => {
        const propertyOwnerships: PropertyOwnership[] = [
            { id: 'own1', propertyId: 'prop1', startDate: 1000, person1Percent: 100, person2Percent: 0 },
            { id: 'own2', propertyId: 'prop1', startDate: 2000, person1Percent: 0, person2Percent: 100 },
        ];
        const propertyExpenses: PropertyExpense[] = [
            { id: 'exp1', propertyId: 'prop1', date: 1500, payee: 'foo', amount: 500 },
            { id: 'exp2', propertyId: 'prop1', date: 2500, payee: 'bar', amount: 600 },
        ];
        const result = calculatePropertyExpensesForTaxYear(propertyExpenses, propertyOwnerships, 1000, 3000);
        expect(result.p1Expenses).toBe(500);
        expect(result.p2Expenses).toBe(600);
    });
});

describe('Property Page & Form Pure Utilities', () => {
    it('calculates total incomes and expenses for a property within a date range', () => {
        const incomes: PropertyIncome[] = [
            { id: 'i1', propertyId: 'p1', date: 1500, amount: 1200 },
            { id: 'i2', propertyId: 'p2', date: 1500, amount: 900 },
            { id: 'i3', propertyId: 'p1', date: 5000, amount: 1200 },
        ];
        const expenses: PropertyExpense[] = [
            { id: 'e1', propertyId: 'p1', date: 1600, payee: 'Repair', amount: 300 },
        ];

        const totals = calculatePropertyTotalsForRange('p1', incomes, expenses, 1000, 3000);
        expect(totals).toEqual({ totalIncomes: 1200, totalExpenses: 300 });
    });

    it('filters and sorts property records descending by date', () => {
        const records: PropertyIncome[] = [
            { id: 'i1', propertyId: 'p1', date: 1200, amount: 500 },
            { id: 'i2', propertyId: 'p1', date: 2000, amount: 700 },
            { id: 'i3', propertyId: 'p2', date: 1800, amount: 600 },
        ];

        const filteredP1 = filterPropertyRecordsByTaxYearAndProperty(records, 'p1', 1000, 3000);
        expect(filteredP1.map(r => r.id)).toEqual(['i2', 'i1']);

        const filteredAll = filterPropertyRecordsByTaxYearAndProperty(records, 'all', 1000, 3000);
        expect(filteredAll.map(r => r.id)).toEqual(['i2', 'i3', 'i1']);
    });

    it('filters and sorts property ownerships descending by startDate', () => {
        const ownerships: PropertyOwnership[] = [
            { id: 'o1', propertyId: 'p1', startDate: 1000, person1Percent: 50, person2Percent: 50 },
            { id: 'o2', propertyId: 'p1', startDate: 2000, person1Percent: 100, person2Percent: 0 },
            { id: 'o3', propertyId: 'p2', startDate: 1500, person1Percent: 50, person2Percent: 50 },
        ];

        expect(filterPropertyOwnerships(ownerships, 'p1').map(o => o.id)).toEqual(['o2', 'o1']);
        expect(filterPropertyOwnerships(ownerships, 'all').map(o => o.id)).toEqual(['o2', 'o3', 'o1']);
    });

    it('calculates complementary ownership percentage split and build redirect URLs', () => {
        expect(calculateComplementaryOwnershipSplit('60')).toEqual({ person1Percent: '60', person2Percent: '40' });
        expect(calculateComplementaryOwnershipSplit('')).toEqual({ person1Percent: '', person2Percent: '' });
        expect(calculateComplementaryOwnershipSplit('150')).toBeNull();

        expect(buildPropertyListRedirectUrl('/property-incomes', 'p1')).toBe('/property-incomes?propertyId=p1');
        expect(buildPropertyListRedirectUrl('/property-incomes', 'all')).toBe('/property-incomes');
        expect(buildPropertyListRedirectUrl('/property-incomes', null)).toBe('/property-incomes');
    });
});
