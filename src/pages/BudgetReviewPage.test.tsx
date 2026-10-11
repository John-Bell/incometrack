import { render, screen } from '@testing-library/react';
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

        (useLiveQuery as any)
            .mockImplementationOnce(() => [
                { id: 'acc_1', name: 'Barclays Main', category: 'Current Account', last4Digits: '1234' },
                { id: 'acc_2', name: 'Monzo Joint', nickname: 'Joint Monzo', category: 'Current Account' },
                { id: 'acc_3', name: 'Marcus Savings', category: 'Easy Access Savings' },
            ])
            .mockImplementationOnce(() => []);

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

        (useLiveQuery as any)
            .mockImplementationOnce(() => [
                { id: 'acc_1', name: 'Barclays Main', category: 'Current Account' },
                { id: 'acc_2', name: 'Monzo Joint', category: 'Current Account' },
            ])
            .mockImplementationOnce(() => [
                { id: 'b1', name: 'Groceries', accountId: 'acc_1' },
                { id: 'b2', name: 'Utilities', accountId: 'acc_2' },
                { id: 'b3', name: 'Entertainment', accountId: 'acc_1' },
            ]);

        render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        // Check "Budget Spend vs Cap" heading is present
        expect(screen.getByRole('heading', { name: 'Budget Spend vs Cap' })).toBeInTheDocument();

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

        (useLiveQuery as any)
            .mockImplementationOnce(() => [
                { id: 'acc_1', name: 'Barclays Main', category: 'Current Account' },
            ])
            .mockImplementationOnce(() => [
                { id: 'b1', name: 'Groceries', amount: 500, accountId: 'acc_1' },
            ]);

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

        // Mock accounts and budgets with one annual budget
        (useLiveQuery as any)
            .mockImplementationOnce(() => [
                { id: 'acc_1', name: 'Barclays Main', category: 'Current Account' },
            ])
            .mockImplementationOnce(() => [
                { id: 'b1', name: 'Car Insurance', accountId: 'acc_1', frequency: 'annual', amount: 500 },
                { id: 'b2', name: 'Groceries', accountId: 'acc_1', frequency: 'monthly', amount: 200 },
            ]);

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

        // Mock accounts and budgets with only monthly budgets
        (useLiveQuery as any)
            .mockImplementationOnce(() => [
                { id: 'acc_1', name: 'Barclays Main', category: 'Current Account' },
            ])
            .mockImplementationOnce(() => [
                { id: 'b1', name: 'Utilities', accountId: 'acc_1', frequency: 'monthly', amount: 100 },
                { id: 'b2', name: 'Groceries', accountId: 'acc_1', frequency: 'monthly', amount: 200 },
            ]);

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
});
