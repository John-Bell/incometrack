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

    it('filters displayed categories in Category Calibration & Tuning when a budget is selected', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b1', name: 'Groceries', amount: 500, accountId: 'acc_1' },
            { id: 'b2', name: 'Utilities', amount: 200, accountId: 'acc_1' },
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

        // Both budgets shown initially in Category Calibration & Tuning (or KPI cards)
        expect(screen.getAllByRole('heading', { name: 'Groceries' }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('heading', { name: 'Utilities' }).length).toBeGreaterThan(0);

        // Select Groceries from budget dropdown
        const budgetSelect = screen.getAllByRole('combobox')[1];
        fireEvent.change(budgetSelect, { target: { value: 'b1' } });

        // Only Groceries should be shown in Category Calibration & Tuning
        expect(screen.getAllByRole('heading', { name: 'Groceries' }).length).toBeGreaterThan(0);
        expect(screen.queryByRole('heading', { name: 'Utilities' })).not.toBeInTheDocument();
    });

    it('calculates Category Calibration & Tuning for filtered budgets and selected timeframe', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const now = new Date();
        const m1 = new Date(now.getFullYear(), now.getMonth(), 10).getTime();
        const m2 = new Date(now.getFullYear(), now.getMonth() - 1, 10).getTime();

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b1', name: 'Dining Out', amount: 100, frequency: 'monthly', accountId: 'acc_1' },
        ];

        const transactions = [
            { id: 't1', budgetId: 'b1', accountId: 'acc_1', amount: 150, type: 'expense', date: m1 },
            { id: 't2', budgetId: 'b1', accountId: 'acc_1', amount: 50, type: 'expense', date: m2 },
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

        // Check header count
        expect(screen.getByText('1 Budgets Monitored')).toBeInTheDocument();
        // Check budget name
        expect(screen.getAllByRole('heading', { name: 'Dining Out' }).length).toBeGreaterThan(0);
        // Check current cap
        expect(screen.getByText('Current Cap: £100/mo')).toBeInTheDocument();
        // Avg monthly spend section exists
        expect(screen.getByText('Avg Monthly Spend')).toBeInTheDocument();
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
        expect(screen.getAllByText('£450').length).toBeGreaterThan(0);
    });

    it('dynamically calculates Persistent Overspend when spend exceeds budget cap >10% of months', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const now = new Date();
        const m1 = new Date(now.getFullYear(), now.getMonth(), 10).getTime();
        const m2 = new Date(now.getFullYear(), now.getMonth() - 1, 10).getTime();

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b_over', name: 'Energy Bill', accountId: 'acc_1', amount: 100, frequency: 'monthly' },
        ];
        const transactions = [
            { id: 't1', budgetId: 'b_over', accountId: 'acc_1', amount: 150, type: 'expense', date: m1 },
            { id: 't2', budgetId: 'b_over', accountId: 'acc_1', amount: 150, type: 'expense', date: m2 },
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

        expect(screen.getByText('Persistent Overspend')).toBeInTheDocument();
        const headings = screen.getAllByRole('heading', { name: 'Energy Bill' });
        expect(headings.length).toBeGreaterThan(0);
        expect(screen.getByText(/Breached 2 of/i)).toBeInTheDocument();
    });

    it('dynamically calculates Excess Slack Available when spend is <20% of budget cap >10% of months for monthly budgets', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const now = new Date();
        const m1 = new Date(now.getFullYear(), now.getMonth(), 10).getTime();

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b_slack', name: 'Gym Membership', accountId: 'acc_1', amount: 500, frequency: 'monthly' },
        ];
        // Spend of £10 is only 2% of £500 cap (<20%)
        const transactions = [
            { id: 't1', budgetId: 'b_slack', accountId: 'acc_1', amount: 10, type: 'expense', date: m1 },
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

        expect(screen.getByText('Excess Slack Available')).toBeInTheDocument();
        const headings = screen.getAllByRole('heading', { name: 'Gym Membership' });
        expect(headings.length).toBeGreaterThan(0);
        expect(screen.getByText(/Low \d+ of/i)).toBeInTheDocument();
    });

    it('does NOT generate Excessive Slack for non-monthly budgets (e.g. annual)', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const now = new Date();
        const m1 = new Date(now.getFullYear(), now.getMonth(), 10).getTime();

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b_annual_slack', name: 'Holiday Fund', accountId: 'acc_1', amount: 1200, frequency: 'annual' },
        ];
        // Spend of £10 is <20% of cap (£1200)
        const transactions = [
            { id: 't1', budgetId: 'b_annual_slack', accountId: 'acc_1', amount: 10, type: 'expense', date: m1 },
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

        expect(screen.queryByText('Excess Slack Available')).not.toBeInTheDocument();
    });

    it('recalculates overspend and slack based on selected account scope', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const now = new Date();
        const m1 = new Date(now.getFullYear(), now.getMonth(), 10).getTime();
        const m2 = new Date(now.getFullYear(), now.getMonth() - 1, 10).getTime();

        const accounts = [
            { id: 'acc_1', name: 'Barclays Main', category: 'Current Account' },
            { id: 'acc_2', name: 'Monzo Joint', category: 'Current Account' },
        ];
        const budgets = [
            { id: 'b_acc1', name: 'Acc1 Luxury', accountId: 'acc_1', amount: 1000, frequency: 'monthly' },
            { id: 'b_acc2', name: 'Acc2 Utility', accountId: 'acc_2', amount: 100, frequency: 'monthly' },
        ];
        const transactions = [
            { id: 't1', budgetId: 'b_acc1', accountId: 'acc_1', amount: 10, type: 'expense', date: m1 },
            { id: 't2', budgetId: 'b_acc2', accountId: 'acc_2', amount: 200, type: 'expense', date: m1 },
            { id: 't3', budgetId: 'b_acc2', accountId: 'acc_2', amount: 200, type: 'expense', date: m2 },
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

        // All accounts selected initially -> b_acc2 gives overspend, b_acc1 gives slack
        expect(screen.getAllByRole('heading', { name: 'Acc2 Utility' }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('heading', { name: 'Acc1 Luxury' }).length).toBeGreaterThan(0);

        // Filter to acc_1 only
        const accountSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(accountSelect, { target: { value: 'acc_1' } });

        // Now only acc_1's budget (Acc1 Luxury - slack) should be visible, overspend should be hidden
        expect(screen.getAllByRole('heading', { name: 'Acc1 Luxury' }).length).toBeGreaterThan(0);
        expect(screen.queryByRole('heading', { name: 'Acc2 Utility' })).not.toBeInTheDocument();
        expect(screen.queryByText('Persistent Overspend')).not.toBeInTheDocument();
    });

    it('displays N/A for Avg Monthly Spend and Peak Month for non-monthly budgets', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b_annual', name: 'Car Insurance', accountId: 'acc_1', frequency: 'annual', amount: 1200 },
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

        expect(screen.getAllByText('N/A').length).toBe(2);
    });

    it('renders grey bullet for months with no spend in Audit Trend', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
        });

        const now = new Date();
        const currentMonthMs = new Date(now.getFullYear(), now.getMonth(), 15).getTime();

        const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
        const budgets = [
            { id: 'b_monthly', name: 'Groceries', accountId: 'acc_1', frequency: 'monthly', amount: 400 },
        ];
        // Transaction only in current month; previous months in targetMonths have 0 spend
        const transactions = [
            { id: 't1', budgetId: 'b_monthly', accountId: 'acc_1', amount: 250, type: 'expense', date: currentMonthMs },
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('budgets')) return budgets;
            if (str.includes('transactions')) return transactions;
            return [];
        });

        const { container } = render(
            <BrowserRouter>
                <BudgetReviewPage />
            </BrowserRouter>
        );

        // Find bullets in the Audit Trend section
        const bullets = container.querySelectorAll('span.rounded-full.mb-1');
        expect(bullets.length).toBeGreaterThan(0);

        // At least one bullet should have grey styling (bg-slate-300) for 0 spend month
        const greyBullets = Array.from(bullets).filter(b => b.className.includes('bg-slate-300'));
        expect(greyBullets.length).toBeGreaterThan(0);
    });
});
