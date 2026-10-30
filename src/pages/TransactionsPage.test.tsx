import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionsPage } from './TransactionsPage';
import { BrowserRouter } from 'react-router-dom';
import { useTransactionsPage } from '@/hooks/useTransactionsPage';
import type { Account, Budget, Transaction } from '@/lib/db';

vi.mock('@/hooks/useTransactionsPage', () => ({
  useTransactionsPage: vi.fn(),
}));

describe('TransactionsPage', () => {
  const mockHandleAccountChange = vi.fn();
  const mockHandleBudgetChange = vi.fn();
  const mockHandleAddPayment = vi.fn();
  const mockGetEditUrl = vi.fn((id: string) => `/transactions/edit/${id}`);

  const sampleCurrentAccounts: Account[] = [
    { id: 'acc1', name: 'Barclays Main', category: 'Current Account', ownerId: 'p1', balance: 1000 },
    { id: 'acc2', name: 'Monzo Joint', category: 'Current Account', ownerId: 'p1', balance: 500 },
  ];

  const sampleAvailableBudgets: Budget[] = [
    { id: 'b1', name: 'Groceries', amount: 300, frequency: 'monthly', accountId: 'acc1' },
    { id: 'b2', name: 'Utilities', amount: 150, frequency: 'monthly', accountId: 'acc2' },
  ];

  const sampleBudgetsMap: Record<string, Budget> = {
    b1: sampleAvailableBudgets[0],
    b2: sampleAvailableBudgets[1],
  };

  const sampleGroupedTransactions: Record<string, Transaction[]> = {
    Today: [
      { id: 'tx1', payee: 'Tesco', amount: 45.5, type: 'expense', date: '2025-05-15', accountId: 'acc1', budgetId: 'b1', icon: 'shopping_cart' },
    ],
    Yesterday: [
      { id: 'tx2', payee: 'Employer Inc', amount: 2500, type: 'income', date: '2025-05-14', accountId: 'acc1', icon: 'payments' },
    ],
  };

  const defaultHookReturn = {
    selectedAccountId: '',
    selectedBudgetId: '',
    currentAccounts: sampleCurrentAccounts,
    availableBudgets: sampleAvailableBudgets,
    groupedTransactions: sampleGroupedTransactions,
    budgetsMap: sampleBudgetsMap,
    handleAccountChange: mockHandleAccountChange,
    handleBudgetChange: mockHandleBudgetChange,
    handleAddPayment: mockHandleAddPayment,
    getEditUrl: mockGetEditUrl,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, account select, budget select, and transaction list', () => {
    (useTransactionsPage as any).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <TransactionsPage />
      </BrowserRouter>
    );

    // Header & dropdowns
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Barclays Main' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Monzo Joint' })).toBeInTheDocument();

    expect(screen.getByRole('option', { name: 'All Budgets' })).toBeInTheDocument();

    // Group labels and transactions
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tesco')).toBeInTheDocument();
    expect(screen.getByText('-£45.50')).toBeInTheDocument();
    expect(screen.getAllByText('Groceries')).toHaveLength(2); // option + transaction label

    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Employer Inc')).toBeInTheDocument();
    expect(screen.getByText('+£2,500.00')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });

  it('calls handleAccountChange when account option is selected', () => {
    (useTransactionsPage as any).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <TransactionsPage />
      </BrowserRouter>
    );

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[0], { target: { value: 'acc1' } });

    expect(mockHandleAccountChange).toHaveBeenCalledWith('acc1');
  });

  it('calls handleBudgetChange when budget option is selected', () => {
    (useTransactionsPage as any).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <TransactionsPage />
      </BrowserRouter>
    );

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[1], { target: { value: 'b1' } });

    expect(mockHandleBudgetChange).toHaveBeenCalledWith('b1');
  });

  it('calls handleAddPayment when Add Payment button is clicked', () => {
    (useTransactionsPage as any).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <TransactionsPage />
      </BrowserRouter>
    );

    const addButton = screen.getByRole('button', { name: /Add Payment/i });
    fireEvent.click(addButton);

    expect(mockHandleAddPayment).toHaveBeenCalledTimes(1);
  });
});
