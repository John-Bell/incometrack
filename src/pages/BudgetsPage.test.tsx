import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetsPage } from './BudgetsPage';
import { BrowserRouter } from 'react-router-dom';
import { useBudgetsPage } from '@/hooks/useBudgetsPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useBudgetsPage', () => ({
  useBudgetsPage: vi.fn(),
}));

describe('BudgetsPage', () => {
  const mockSetSelectedAccountId = vi.fn();

  const sampleAccounts = [
    { id: 'acc1', name: 'Barclays Main', category: 'Current Account', budgetOrder: 1 },
    { id: 'acc2', name: 'Monzo Joint', nickname: 'Joint Monzo', category: 'Current Account', budgetOrder: 2 },
  ];

  const sampleBudgets = [
    { id: 'b1', name: 'Groceries', amount: 300, frequency: 'monthly', accountId: 'acc1' },
    { id: 'b2', name: 'Car Insurance', amount: 1200, frequency: 'annual', accountId: 'acc2' },
  ];

  const sampleBudgetItems = [
    {
      budget: sampleBudgets[0],
      details: {
        isAnnual: false,
        monthlyAmount: 300,
        annualAmount: 3600,
        startDateTs: 1774915200000,
        formattedStartDate: '01 Apr 2026',
        actualAmount: 150,
        targetNum: 300,
        ratio: 0.5,
        percent: 50,
        status: 'PLENTY OF CAPACITY',
        barColor: 'bg-emerald-500',
        chipClass: 'bg-emerald-500/10 text-emerald-500',
      },
    },
    {
      budget: sampleBudgets[1],
      details: {
        isAnnual: true,
        monthlyAmount: 100,
        annualAmount: 1200,
        startDateTs: 1774915200000,
        formattedStartDate: '01 Apr 2026',
        actualAmount: 600,
        targetNum: 1200,
        ratio: 0.5,
        percent: 50,
        status: 'PLENTY OF CAPACITY',
        barColor: 'bg-emerald-500',
        chipClass: 'bg-emerald-500/10 text-emerald-500',
      },
    },
  ];

  const defaultHookReturn = {
    selectedAccountId: '',
    setSelectedAccountId: mockSetSelectedAccountId,
    budgets: sampleBudgets,
    sortedBudgets: sampleBudgets,
    budgetAccounts: sampleAccounts,
    budgetItems: sampleBudgetItems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "No Budgets Yet" empty state when no budgets exist and no account filter selected', () => {
    (useBudgetsPage as any).mockReturnValue({
      ...defaultHookReturn,
      budgets: [],
      sortedBudgets: [],
      budgetItems: [],
    });

    render(
      <BrowserRouter>
        <BudgetsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('No Budgets Yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first budget item to start tracking your expenses.')).toBeInTheDocument();
  });

  it('renders accounts in account select dropdown and budget list with cards', () => {
    (useBudgetsPage as any).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <BudgetsPage />
      </BrowserRouter>
    );

    // Filter selector options
    expect(screen.getByRole('option', { name: 'All Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Barclays Main' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Joint Monzo' })).toBeInTheDocument();

    // Headers & budget list items
    expect(screen.getByText('All Budgets')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Car Insurance')).toBeInTheDocument();

    // Budget card details
    expect(screen.getByText('£300.00')).toBeInTheDocument(); // Monthly amount for Groceries
    expect(screen.getByText('£100.00')).toBeInTheDocument(); // Monthly amount for Car Insurance
    expect(screen.getAllByText('PLENTY OF CAPACITY').length).toBe(2);
  });

  it('filters budgets when account is selected from dropdown', () => {
    (useBudgetsPage as any).mockReturnValue({
      ...defaultHookReturn,
      selectedAccountId: 'acc1',
      sortedBudgets: [sampleBudgets[0]],
      budgetItems: [sampleBudgetItems[0]],
    });

    render(
      <BrowserRouter>
        <BudgetsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Filtered Budgets')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Car Insurance')).not.toBeInTheDocument();

    const accountSelect = screen.getByRole('combobox');
    fireEvent.change(accountSelect, { target: { value: 'acc2' } });

    expect(mockSetSelectedAccountId).toHaveBeenCalledWith('acc2');
  });

  it('renders "No Budgets Found" when selected account has no matching budgets', () => {
    (useBudgetsPage as any).mockReturnValue({
      ...defaultHookReturn,
      selectedAccountId: 'acc2',
      sortedBudgets: [],
      budgetItems: [],
    });

    render(
      <BrowserRouter>
        <BudgetsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('No Budgets Found')).toBeInTheDocument();
    expect(screen.getByText('There are no budgets linked to this account.')).toBeInTheDocument();
  });

  it('navigates to add budget page when "Add Budget" button is clicked', () => {
    (useBudgetsPage as any).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <BudgetsPage />
      </BrowserRouter>
    );

    const addButton = screen.getByRole('button', { name: /Add Budget/i });
    fireEvent.click(addButton);

    expect(mockNavigate).toHaveBeenCalledWith('/budgets/add');
  });

  it('navigates to edit budget page when edit icon button is clicked', () => {
    (useBudgetsPage as any).mockReturnValue(defaultHookReturn);

    const { container } = render(
      <BrowserRouter>
        <BudgetsPage />
      </BrowserRouter>
    );

    // Click edit icon button on first budget card
    const editIcons = container.querySelectorAll('div.cursor-pointer');
    expect(editIcons.length).toBeGreaterThan(0);
    fireEvent.click(editIcons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/budgets/edit/b1');
  });
});
