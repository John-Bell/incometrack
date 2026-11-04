import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardAccountList } from './DashboardAccountList';
import type { Account, Budget } from '@/lib/db';

describe('DashboardAccountList', () => {
    const mockAccounts: Account[] = [
        {
            id: 'acc-1',
            ownerId: 'default',
            name: 'Current Account',
            balance: 5000,
            interestRate: 0,
            category: 'Current Account',
            budgetOrder: 1,
            updatedAt: Date.now()
        }
    ];

    it('calculates top monthly allocated total excluding oneOffBudget and adds annual / 12', () => {
        const mockBudgets: Budget[] = [
            {
                id: 'b-monthly',
                accountId: 'acc-1',
                name: 'Monthly Groceries',
                amount: 300,
                frequency: 'monthly',
                updatedAt: Date.now()
            },
            {
                id: 'b-annual',
                accountId: 'acc-1',
                name: 'Annual Insurance',
                amount: 1200,
                frequency: 'annual',
                updatedAt: Date.now()
            },
            {
                id: 'b-oneoff',
                accountId: 'acc-1',
                name: 'One-off Holiday Expense',
                amount: 1000,
                frequency: 'monthly',
                oneOffBudget: true,
                updatedAt: Date.now()
            }
        ];

        render(
            <MemoryRouter>
                <DashboardAccountList
                    accounts={mockAccounts}
                    budgets={mockBudgets}
                    transactions={[]}
                />
            </MemoryRouter>
        );

        // Top Allocated summary: 300 (monthly) + 1200 / 12 (annual) = 400.00. One-off 1000 is excluded.
        expect(screen.getByText('£400.00')).toBeInTheDocument();
        expect(screen.getByText('Monthly allocated spending')).toBeInTheDocument();

        // Account allocated total should be 300 + 1200 = 1,500.00 (excluding 1000 one-off)
        // Desktop and Mobile both render "Allocated: £1,500.00"
        const allocatedElements = screen.getAllByText('Allocated: £1,500.00');
        expect(allocatedElements.length).toBeGreaterThan(0);

        // Total remaining on account should be 1500.00 - 0 = £1,500.00
        const remainingElements = screen.getAllByText('Total Remaining: £1,500.00');
        expect(remainingElements.length).toBeGreaterThan(0);
    });

    it('renders one-off budget with indicator icon and budgeted amount in list', () => {
        const mockBudgets: Budget[] = [
            {
                id: 'b-oneoff',
                accountId: 'acc-1',
                name: 'One-off Repair',
                amount: 500,
                frequency: 'monthly',
                oneOffBudget: true,
                updatedAt: Date.now()
            }
        ];

        render(
            <MemoryRouter>
                <DashboardAccountList
                    accounts={mockAccounts}
                    budgets={mockBudgets}
                    transactions={[]}
                />
            </MemoryRouter>
        );

        // Top allocated should be 0 because the only budget is oneOffBudget
        const zeroAmounts = screen.getAllByText('£0.00');
        expect(zeroAmounts.length).toBeGreaterThan(0);

        // The budget item itself should be displayed in the list
        expect(screen.getAllByText('One-off Repair').length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText('One-off budget').length).toBeGreaterThan(0);
    });
});
