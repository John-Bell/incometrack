import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountsPage } from './AccountsPage';
import { BrowserRouter } from 'react-router-dom';
import { useAccountsPage } from '@/hooks/useAccountsPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useAccountsPage', () => ({
  useAccountsPage: vi.fn(),
}));

describe('AccountsPage', () => {
  const mockSetActiveAccountsTab = vi.fn();
  const mockSetSortBy = vi.fn();

  const mockTabSummaries = [
    { id: 'person1' as const, label: 'Alice', formattedTaxableInterest: '£150.00' },
    { id: 'person2' as const, label: 'Bob', formattedTaxableInterest: '£50.00' },
    { id: 'joint' as const, label: 'Joint', formattedTaxableInterest: '£0.00' },
  ];

  const mockFilteredAccounts = [
    {
      id: 'acc1',
      ownerId: 'person1',
      accountIcon: 'S',
      iconColor: 'red' as const,
      accountName: 'Santander Easy Access',
      nickname: 'Main Savings',
      last4Digits: '1234',
      category: 'Easy Access Savings',
      ownerTag: 'Alice',
      ownerTagColor: 'blue' as const,
      balance: '£10,000.00',
      projectedInterest: '£450.00',
      isTaxable: true,
      rate: '4.50%',
      interestPayoutFrequency: undefined,
      interestPayoutDate: undefined,
      updatedAt: 'Today',
      updatedAtFreshness: 'fresh' as const,
      isStale: false,
      alertText: undefined,
      alertType: undefined,
    },
  ];

  const defaultHookReturn: ReturnType<typeof useAccountsPage> = {
    p1Name: 'Alice',
    p2Name: 'Bob',
    sortBy: 'name',
    setSortBy: mockSetSortBy,
    activeAccountsTab: 'person1',
    setActiveAccountsTab: mockSetActiveAccountsTab,
    startTs: 1712361600000,
    endTs: 1743897600000,
    formattedTotalSavings: '£10,000.00',
    formattedNonPensionSavings: '£10,000.00',
    formattedTaxableSavings: '£10,000.00',
    tabSummaries: mockTabSummaries,
    filteredAccounts: mockFilteredAccounts,
    rawAccounts: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders portfolio overview, forecast widget, add account button, tabs, and active accounts', () => {
    vi.mocked(useAccountsPage).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <AccountsPage />
      </BrowserRouter>
    );

    // Header & Portfolio Overview
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
    expect(screen.getAllByText('£10,000.00').length).toBeGreaterThan(0);

    // Tabs & Account Owners
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Joint')).toBeInTheDocument();
    expect(screen.getByText('£150.00')).toBeInTheDocument();

    // Add Account Button
    expect(screen.getByRole('button', { name: /Add Account/i })).toBeInTheDocument();

    // Active Accounts
    expect(screen.getByText('Active Accounts')).toBeInTheDocument();
    expect(screen.getByText('Main Savings')).toBeInTheDocument();
    expect(screen.getByText('Updated: Today')).toBeInTheDocument();
  });

  it('triggers setActiveAccountsTab when clicking a tab button', () => {
    vi.mocked(useAccountsPage).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <AccountsPage />
      </BrowserRouter>
    );

    const bobTab = screen.getByText('Bob');
    fireEvent.click(bobTab);

    expect(mockSetActiveAccountsTab).toHaveBeenCalledWith('person2');
  });

  it('triggers setSortBy with next sort cycle when clicking sort button', () => {
    vi.mocked(useAccountsPage).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <AccountsPage />
      </BrowserRouter>
    );

    const sortButton = screen.getByRole('button', { name: /Sort by Name/i });
    fireEvent.click(sortButton);

    expect(mockSetSortBy).toHaveBeenCalledTimes(1);
    const updater = mockSetSortBy.mock.calls[0][0] as (prev: 'name' | 'rate' | 'updatedAt') => string;
    expect(updater('name')).toBe('rate');
    expect(updater('rate')).toBe('updatedAt');
    expect(updater('updatedAt')).toBe('name');
  });

  it('displays Sort by Last Updated label and highlights stale account timestamps', () => {
    vi.mocked(useAccountsPage).mockReturnValue({
      ...defaultHookReturn,
      sortBy: 'updatedAt',
      filteredAccounts: [
        {
          ...mockFilteredAccounts[0],
          updatedAt: '1 Aug (3 months ago)',
          updatedAtFreshness: 'stale',
          isStale: true,
        },
      ],
    });

    render(
      <BrowserRouter>
        <AccountsPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /Sort by Last Updated/i })).toBeInTheDocument();
    const updatedLabel = screen.getByText('Updated: 1 Aug (3 months ago)');
    expect(updatedLabel).toBeInTheDocument();
    expect(updatedLabel.parentElement?.className).toContain('text-rose-600');
  });

  it('navigates to /accounts/add when "Add Account" button is clicked', () => {
    vi.mocked(useAccountsPage).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <AccountsPage />
      </BrowserRouter>
    );

    const addButton = screen.getByRole('button', { name: /Add Account/i });
    fireEvent.click(addButton);

    expect(mockNavigate).toHaveBeenCalledWith('/accounts/add');
  });

  it('navigates to edit account page when quick update button is clicked', () => {
    vi.mocked(useAccountsPage).mockReturnValue(defaultHookReturn);

    render(
      <BrowserRouter>
        <AccountsPage />
      </BrowserRouter>
    );

    const quickUpdateBtn = screen.getByRole('button', { name: /Quick Update/i });
    fireEvent.click(quickUpdateBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/accounts/edit/acc1');
  });
});
