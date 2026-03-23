import { describe, it, expect } from 'vitest';
import { calculatePropertyIncomeForTaxYear } from './propertyCalculations';
import type { PropertyIncome, PropertyOwnership } from '@/lib/db';

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
});
