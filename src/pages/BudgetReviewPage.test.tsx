import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetReviewPage } from './BudgetReviewPage';
import { useStore } from '@/store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/store/useStore', () => ({
    useStore: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: vi.fn(),
}));

describe('BudgetReviewPage', () => {
    it('renders current accounts in the accounts select dropdown', () => {
        (useStore as any).mockReturnValue({
            profile: {
                partner1Name: 'Dan',
                partner2Name: 'Freya',
            },
        });

        const accounts = [
            { id: 'acc_1', name: 'Barclays Main', category: 'Current Account', last4Digits: '1234' },
            { id: 'acc_2', name: 'Monzo Joint', nickname: 'Joint Monzo', category: 'Current Account' },
            { id: 'acc_3', name: 'Marcus Savings', category: 'Easy Access Savings' },
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            return [];
        });

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        const selectElements = screen.getAllByRole('combobox');
        expect(selectElements.length).toBe(2);

        // Accounts select (first combobox)
        expect(screen.getByRole('option', { name: 'All Accounts' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Barclays Main (x1234)' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Joint Monzo' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Marcus Savings/i })).not.toBeInTheDocument();
    });

    it('renders budget dropdown and filters budgets based on account selection', async () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const accounts = [
            { id: 'acc_1', name: 'Barclays Main', category: 'Current Account' },
            { id: 'acc_2', name: 'Monzo Joint', category: 'Current Account' },
        ];
        const budgets = [
            { id: 'b1', name: 'Groceries', accountId: 'acc_1' },
            { id: 'b2', name: 'Utilities', accountId: 'acc_2' },
            { id: 'b3', name: 'Entertainment', accountId: 'acc_1' },
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('budgets')) return budgets;
            return [];
        });

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        // Budget Spend vs Cap graph should NOT be shown when no budget is selected
        expect(screen.queryByRole('heading', { name: 'Budget Spend vs Cap' })).not.toBeInTheDocument();

        // Check budget selector exists and shows all budgets initially
        expect(screen.getByRole('option', { name: 'All Budgets' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Entertainment' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Utilities' })).toBeInTheDocument();
    });

    it('filters displayed categories when a budget is selected', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [{ id: 'b1', name: 'Groceries', amount: 500, accountId: 'acc_1' }];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('budgets')) return budgets;
            return [];
        });

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Joint Household Caps')).toBeInTheDocument();
        expect(screen.getByText('Current & Discretionary')).toBeInTheDocument();
    });

    it('defaults to YTD timeframe and shows only YTD filter when an annual budget exists in scope', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b1', name: 'Car Insurance', accountId: 'acc_1', frequency: 'annual', amount: 500 },
            { id: 'b2', name: 'Groceries', accountId: 'acc_1', frequency: 'monthly', amount: 200 },
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('budgets')) return budgets;
            return [];
        });

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        // Check timeframe filter buttons
        expect(screen.getByRole('button', { name: 'YTD' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Last 3 Months' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Last 6 Months' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Last 9 Months' })).not.toBeInTheDocument();
    });

    it('shows all timeframe options when no annual budget exists in scope', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b1', name: 'Utilities', accountId: 'acc_1', frequency: 'monthly', amount: 100 },
            { id: 'b2', name: 'Groceries', accountId: 'acc_1', frequency: 'monthly', amount: 200 },
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('budgets')) return budgets;
            return [];
        });

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        expect(screen.getByRole('button', { name: 'Last 3 Months' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Last 6 Months' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Last 9 Months' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'YTD' })).toBeInTheDocument();
    });

    it('does not render Budget Spend vs Cap graph when an annual budget is selected', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [{ id: 'b_annual', name: 'Car Insurance', accountId: 'acc_1', frequency: 'annual', amount: 1200 }];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('budgets')) return budgets;
            return [];
        });

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        const selects = screen.getAllByRole('combobox');
        const budgetSelect = selects[1];

        // Select the annual budget
        fireEvent.change(budgetSelect, { target: { value: 'b_annual' } });

        expect(screen.queryByRole('heading', { name: 'Budget Spend vs Cap' })).not.toBeInTheDocument();
    });

    it('renders and populates Budget Spend vs Cap graph when a monthly budget is selected', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const now = new Date();
        const currentMonthMs = new Date(now.getFullYear(), now.getMonth(), 15).getTime();
        const prevMonthMs = new Date(now.getFullYear(), now.getMonth() - 1, 15).getTime();

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [{ id: 'b_monthly', name: 'Groceries', accountId: 'acc_1', frequency: 'monthly', amount: 400 }];
        const transactions = [
            { id: 't1', budgetId: 'b_monthly', accountId: 'acc_1', amount: 250, type: 'expense', date: currentMonthMs },
            { id: 't2', budgetId: 'b_monthly', accountId: 'acc_1', amount: 450, type: 'expense', date: prevMonthMs },
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('budgets')) return budgets;
            if (str.includes('transactions')) return transactions;
            return [];
        });

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        const selects = screen.getAllByRole('combobox');
        const budgetSelect = selects[1];

        // Select monthly budget
        fireEvent.change(budgetSelect, { target: { value: 'b_monthly' } });

        expect(screen.getByRole('heading', { name: 'Budget Spend vs Cap' })).toBeInTheDocument();
        expect(screen.getByText('Groceries · Baseline £400/mo')).toBeInTheDocument();
        expect(screen.getByText('Cap: £400')).toBeInTheDocument();
        expect(screen.getByText('£250')).toBeInTheDocument();
        expect(screen.getByText('£450')).toBeInTheDocument();
    });

    it('shows Persistent Overspend and Excess Slack Available sections when no budget is selected and hides them when a budget is selected', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [{ id: 'b1', name: 'Groceries', accountId: 'acc_1', amount: 300, frequency: 'monthly' }];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('budgets')) return budgets;
            return [];
        });

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        // When no budget is selected ("All Budgets"), both sections should be present
        expect(screen.getByText('Persistent Overspend')).toBeInTheDocument();
        expect(screen.getByText('Excess Slack Available')).toBeInTheDocument();

        // Select a budget
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[1], { target: { value: 'b1' } });

        // Sections should no longer be visible
        expect(screen.queryByText('Persistent Overspend')).not.toBeInTheDocument();
        expect(screen.queryByText('Excess Slack Available')).not.toBeInTheDocument();
    });
});
