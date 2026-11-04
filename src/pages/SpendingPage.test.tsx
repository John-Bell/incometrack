/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpendingPage } from './SpendingPage';
import { useStore } from '@/store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/store/useStore', () => ({
  useStore: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

describe('SpendingPage', () => {
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
        <SpendingPage />
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

  it('renders budget dropdown and filters budgets based on account selection', () => {
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
        <SpendingPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('option', { name: 'All Budgets' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Entertainment' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Utilities' })).toBeInTheDocument();

    // Select Barclays Main
    const accountSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(accountSelect, { target: { value: 'acc_1' } });

    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Entertainment' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Utilities' })).not.toBeInTheDocument();
  });

  it('defaults to YTD and shows only YTD timeframe when an annual budget exists in scope', () => {
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
        <SpendingPage />
      </BrowserRouter>
    );

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
        <SpendingPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: 'Last 3 Months' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 6 Months' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Last 9 Months' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'YTD' })).toBeInTheDocument();
  });

  it('calculates spending graph and KPI stats correctly for transactions in timeframe', () => {
    (useStore as any).mockReturnValue({
      profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
    });

    const now = new Date();
    const currentMonthMs = new Date(now.getFullYear(), now.getMonth(), 15).getTime();
    const prevMonthMs = new Date(now.getFullYear(), now.getMonth() - 1, 15).getTime();

    const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
    const budgets = [{ id: 'b1', name: 'Groceries', accountId: 'acc_1', frequency: 'monthly', amount: 400 }];
    const transactions = [
      { id: 't1', budgetId: 'b1', accountId: 'acc_1', amount: 250, type: 'expense', date: currentMonthMs },
      { id: 't2', budgetId: 'b1', accountId: 'acc_1', amount: 350, type: 'expense', date: prevMonthMs },
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
        <SpendingPage />
      </BrowserRouter>
    );

    // Switch to Last 3 Months
    fireEvent.click(screen.getByRole('button', { name: 'Last 3 Months' }));

    // Check stats
    // Total Spent: 250 + 350 = 600
    expect(screen.getByText('£600')).toBeInTheDocument();
    // Avg / Month: 600 / 3 = 200
    expect(screen.getByText('£200')).toBeInTheDocument();
    // Peak Month: £350 (appears in KPI card and graph bar)
    expect(screen.getAllByText(/£350/).length).toBeGreaterThanOrEqual(2);

    // Check graph section
    expect(screen.getByText('Spend Over Time')).toBeInTheDocument();
    expect(screen.getByText('Monthly Outgoings')).toBeInTheDocument();
    expect(screen.getByText('£250')).toBeInTheDocument();
  });

  it('resets budget filter when selected account changes and budget belongs to another account', () => {
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
    ];

    (useLiveQuery as any).mockImplementation((cb: any) => {
      const str = cb.toString();
      if (str.includes('accounts')) return accounts;
      if (str.includes('budgets')) return budgets;
      return [];
    });

    render(
      <BrowserRouter>
        <SpendingPage />
      </BrowserRouter>
    );

    const selects = screen.getAllByRole('combobox');
    const accountSelect = selects[0];
    const budgetSelect = selects[1];

    // Select budget b1
    fireEvent.change(budgetSelect, { target: { value: 'b1' } });
    expect(budgetSelect).toHaveValue('b1');

    // Change account to acc_2 (which does not own b1)
    fireEvent.change(accountSelect, { target: { value: 'acc_2' } });

    // Budget select should reset to empty
    expect(screen.getAllByRole('combobox')[1]).toHaveValue('');
  });

  it('excludes one-off budgets from totals on the spending screen unless the one-off budget is selected', () => {
    (useStore as any).mockReturnValue({
      profile: { partner1Name: 'Dan', partner2Name: 'Freya' },
    });

    const now = new Date();
    const currentMonthMs = new Date(now.getFullYear(), now.getMonth(), 15).getTime();

    const accounts = [{ id: 'acc_1', name: 'Barclays Main', category: 'Current Account' }];
    const budgets = [
      { id: 'b_regular', name: 'Groceries', accountId: 'acc_1', frequency: 'monthly', amount: 500, oneOffBudget: false },
      { id: 'b_oneoff', name: 'Holiday', accountId: 'acc_1', frequency: 'monthly', amount: 2000, oneOffBudget: true },
    ];
    const transactions = [
      { id: 't1', budgetId: 'b_regular', accountId: 'acc_1', amount: 300, type: 'expense', date: currentMonthMs },
      { id: 't2', budgetId: 'b_oneoff', accountId: 'acc_1', amount: 1500, type: 'expense', date: currentMonthMs },
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
        <SpendingPage />
      </BrowserRouter>
    );

    // Initial state: "All Budgets" selected -> One-off budget t2 (£1500) excluded, only t1 (£300) included
    expect(screen.getAllByText(/£300/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/£1,800/)).not.toBeInTheDocument();

    // Now select the one-off budget "Holiday" in the budget dropdown
    const budgetSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(budgetSelect, { target: { value: 'b_oneoff' } });

    // When the one-off budget is selected, its total should be shown (£1500)
    expect(screen.getAllByText(/£1,500/).length).toBeGreaterThanOrEqual(1);
  });
});
