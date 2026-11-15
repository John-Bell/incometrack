import { describe, it, expect } from 'vitest';
import {
    getProfileCombinedName,
    formatDashboardCurrency,
    formatDashboardAmount,
    getBudgetIconName,
    getBudgetsForAccount,
    getTransactionsForBudget,
    buildDashboardSummary
} from './dashboardUtils';
import type { Account, Budget, Transaction } from '@/lib/db';

describe('dashboardUtils', () => {
    describe('getProfileCombinedName', () => {
        it('returns default partner names when profile is null or undefined', () => {
            expect(getProfileCombinedName(null)).toBe('Partner 1 & Partner 2');
            expect(getProfileCombinedName(undefined)).toBe('Partner 1 & Partner 2');
        });

        it('returns explicit profile.name when provided', () => {
            expect(
                getProfileCombinedName({
                    id: 'default',
                    name: 'Household Account',
                    partner1Name: 'Alice',
                    partner2Name: 'Bob',
                    updatedAt: 0
                })
            ).toBe('Household Account');
        });

        it('combines partner1Name and partner2Name when profile.name is empty', () => {
            expect(
                getProfileCombinedName({
                    id: 'default',
                    name: '',
                    partner1Name: 'Alice',
                    partner2Name: 'Bob',
                    updatedAt: 0
                })
            ).toBe('Alice & Bob');
        });
    });

    describe('formatDashboardCurrency and formatDashboardAmount', () => {
        it('formats numbers in en-GB locale with two decimal places', () => {
            expect(formatDashboardCurrency(1500)).toBe('£1,500.00');
            expect(formatDashboardCurrency(42.5)).toBe('£42.50');
            expect(formatDashboardAmount(1500)).toBe('1,500.00');
        });
    });

    describe('getBudgetIconName', () => {
        it('maps budget keywords to expected material symbols', () => {
            expect(getBudgetIconName('Mortgage Payment')).toBe('home');
            expect(getBudgetIconName('Monthly Groceries')).toBe('restaurant');
            expect(getBudgetIconName('Electric & Gas')).toBe('water_drop');
            expect(getBudgetIconName('Car Fuel')).toBe('directions_car');
            expect(getBudgetIconName('Clothes Shopping')).toBe('shopping_bag');
            expect(getBudgetIconName('Medical Dental')).toBe('medical_services');
            expect(getBudgetIconName('Entertainment & Fun')).toBe('confirmation_number');
            expect(getBudgetIconName('Save & Invest')).toBe('savings');
            expect(getBudgetIconName('Summer Holiday')).toBe('flight_takeoff');
            expect(getBudgetIconName('Miscellaneous')).toBe('category');
        });
    });

    describe('getTransactionsForBudget', () => {
        const refDate = new Date('2026-06-15T12:00:00Z');
        const transactions: Transaction[] = [
            {
                id: 't-june-early',
                accountId: 'acc-1',
                budgetId: 'b-1',
                amount: 40,
                date: new Date('2026-06-02T10:00:00Z').getTime(),
                type: 'expense',
                payee: 'Tesco',
                updatedAt: 0
            },
            {
                id: 't-june-late',
                accountId: 'acc-1',
                budgetId: 'b-1',
                amount: 60,
                date: new Date('2026-06-14T10:00:00Z').getTime(),
                type: 'expense',
                payee: 'Sainsburys',
                updatedAt: 0
            },
            {
                id: 't-may-same-year',
                accountId: 'acc-1',
                budgetId: 'b-1',
                amount: 100,
                date: new Date('2026-05-10T10:00:00Z').getTime(),
                type: 'expense',
                payee: 'Waitrose',
                updatedAt: 0
            },
            {
                id: 't-prev-year',
                accountId: 'acc-1',
                budgetId: 'b-1',
                amount: 200,
                date: new Date('2025-06-10T10:00:00Z').getTime(),
                type: 'expense',
                payee: 'Old Store',
                updatedAt: 0
            },
            {
                id: 't-income',
                accountId: 'acc-1',
                budgetId: 'b-1',
                amount: 500,
                date: new Date('2026-06-12T10:00:00Z').getTime(),
                type: 'income',
                payee: 'Refund',
                updatedAt: 0
            }
        ];

        it('filters monthly budgets to current month & year expenses sorted newest first', () => {
            const result = getTransactionsForBudget(transactions, 'b-1', 'monthly', refDate);
            expect(result.map(t => t.id)).toEqual(['t-june-late', 't-june-early']);
        });

        it('filters annual budgets to entire current year expenses sorted newest first', () => {
            const result = getTransactionsForBudget(transactions, 'b-1', 'annual', refDate);
            expect(result.map(t => t.id)).toEqual(['t-june-late', 't-june-early', 't-may-same-year']);
        });
    });

    describe('buildDashboardSummary', () => {
        const refDate = new Date('2026-06-15T12:00:00Z');
        const accounts: Account[] = [
            {
                id: 'acc-2',
                ownerId: 'joint',
                name: 'Second Account',
                balance: 1000,
                interestRate: 0,
                category: 'Current Account',
                budgetOrder: 2,
                updatedAt: 0
            },
            {
                id: 'acc-1',
                ownerId: 'joint',
                name: 'First Account',
                balance: 2000,
                interestRate: 0,
                category: 'Current Account',
                budgetOrder: 1,
                updatedAt: 0
            },
            {
                id: 'acc-empty',
                ownerId: 'joint',
                name: 'No Budgets Account',
                balance: 500,
                interestRate: 0,
                category: 'Savings',
                budgetOrder: 0,
                updatedAt: 0
            }
        ];

        const budgets: Budget[] = [
            {
                id: 'b-1',
                accountId: 'acc-1',
                name: 'Groceries',
                amount: 400,
                frequency: 'monthly',
                updatedAt: 0
            },
            {
                id: 'b-2',
                accountId: 'acc-1',
                name: 'One-off Sofa',
                amount: 1000,
                frequency: 'monthly',
                oneOffBudget: true,
                updatedAt: 0
            },
            {
                id: 'b-3',
                accountId: 'acc-2',
                name: 'Car Insurance',
                amount: 1200,
                frequency: 'annual',
                updatedAt: 0
            }
        ];

        const transactions: Transaction[] = [
            {
                id: 'tx-1',
                accountId: 'acc-1',
                budgetId: 'b-1',
                amount: 150,
                date: new Date('2026-06-10T10:00:00Z').getTime(),
                type: 'expense',
                payee: 'Supermarket',
                updatedAt: 0
            }
        ];

        it('filters accounts without budgets, sorts by budgetOrder, and computes allocations and spending', () => {
            const summary = buildDashboardSummary(accounts, budgets, transactions, refDate);

            expect(summary.sortedAccounts.map(a => a.id)).toEqual(['acc-1', 'acc-2']);
            expect(summary.totalMonthlyAllocated).toBe(500); // 400 + (1200 / 12), excluding 1000 one-off

            const acc1Data = summary.accountsData[0];
            expect(acc1Data.account.id).toBe('acc-1');
            expect(acc1Data.accountTotalAllocated).toBe(400);
            expect(acc1Data.accountMonthlyAllocated).toBe(400);
            expect(acc1Data.isOnlyAnnual).toBe(false);
            expect(acc1Data.totalSpent).toBe(150);
            expect(acc1Data.budgetItems[0].budgetRemaining).toBe(250);

            const acc2Data = summary.accountsData[1];
            expect(acc2Data.account.id).toBe('acc-2');
            expect(acc2Data.accountTotalAllocated).toBe(1200);
            expect(acc2Data.accountMonthlyAllocated).toBe(100);
            expect(acc2Data.isOnlyAnnual).toBe(true);
            expect(acc2Data.totalSpent).toBe(0);
            expect(getBudgetsForAccount(budgets, 'acc-2')).toHaveLength(1);
        });
    });
});
