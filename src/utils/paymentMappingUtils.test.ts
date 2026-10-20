import { describe, it, expect } from 'vitest';
import {
    getGroupedBudgets,
    toggleBudgetId,
    validatePaymentMapping,
} from './paymentMappingUtils';
import type { Budget, PaymentMapping } from '@/lib/db';

describe('paymentMappingUtils', () => {
    describe('getGroupedBudgets', () => {
        it('groups and sorts budgets alphabetically by name', () => {
            const budgets: Budget[] = [
                { id: 'b2', accountId: 'acc1', name: 'Groceries', amount: 300, frequency: 'monthly' },
                { id: 'b1', accountId: 'acc1', name: 'Utilities', amount: 150, frequency: 'monthly' },
                { id: 'b3', accountId: 'acc1', name: 'Entertainment', amount: 100, frequency: 'monthly' },
            ];

            const grouped = getGroupedBudgets(budgets);

            expect(grouped).toHaveLength(1);
            expect(grouped[0].categoryId).toBe('all');
            expect(grouped[0].categoryName).toBe('All Budgets');
            expect(grouped[0].budgets.map((b) => b.name)).toEqual([
                'Entertainment',
                'Groceries',
                'Utilities',
            ]);
        });
    });

    describe('toggleBudgetId', () => {
        it('adds a budget ID if not present in list', () => {
            const initial = ['b1', 'b2'];
            const updated = toggleBudgetId(initial, 'b3');
            expect(updated).toEqual(['b1', 'b2', 'b3']);
        });

        it('removes a budget ID if already present in list', () => {
            const initial = ['b1', 'b2', 'b3'];
            const updated = toggleBudgetId(initial, 'b2');
            expect(updated).toEqual(['b1', 'b3']);
        });
    });

    describe('validatePaymentMapping', () => {
        const existingMappings: PaymentMapping[] = [
            { id: 'm1', paymentName: 'Tesco', budgetIds: ['b1'] },
            { id: 'm2', paymentName: 'Salary', budgetIds: ['b2'] },
        ];

        it('returns invalid if payment name is empty or only whitespace', () => {
            const result = validatePaymentMapping('   ', ['b1'], existingMappings);
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe('Payment name is required.');
        });

        it('returns invalid if budgetIds array is empty', () => {
            const result = validatePaymentMapping('Sainsbury', [], existingMappings);
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe('At least one budget must be selected.');
        });

        it('returns invalid if duplicate payment name exists (case-insensitive)', () => {
            const result = validatePaymentMapping('tesco', ['b1'], existingMappings);
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toBe('A mapping with this payment name already exists.');
        });

        it('allows same payment name when editing existing mapping (currentId matches)', () => {
            const result = validatePaymentMapping('Tesco', ['b1', 'b2'], existingMappings, 'm1');
            expect(result.isValid).toBe(true);
            expect(result.trimmedName).toBe('Tesco');
        });

        it('returns valid for unique payment name and non-empty budgetIds', () => {
            const result = validatePaymentMapping('  Asda  ', ['b1'], existingMappings);
            expect(result.isValid).toBe(true);
            expect(result.trimmedName).toBe('Asda');
        });
    });
});
