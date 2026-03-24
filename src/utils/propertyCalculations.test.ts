import { describe, it, expect } from 'vitest';
import { calculatePropertyIncomeForTaxYear, calculatePropertyExpensesForTaxYear } from './propertyCalculations';
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
