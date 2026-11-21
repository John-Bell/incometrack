import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditAccountPage } from './EditAccountPage';
import { useAccountForm } from '@/hooks/useAccountForm';

vi.mock('@/hooks/useAccountForm', () => ({
  useAccountForm: vi.fn(),
}));

vi.mock('@/components/accounts/InterestLedger', () => ({
  InterestLedger: () => <div data-testid="interest-ledger" />,
}));

describe('EditAccountPage', () => {
  const baseHookReturn: ReturnType<typeof useAccountForm> = {
    account: {
      id: 'acc1',
      ownerId: 'person1',
      name: 'Santander Easy',
      balance: 10000,
      interestRate: 4.5,
      category: 'Easy Access Savings',
      updatedAt: new Date(2026, 9, 17, 10, 0, 0).getTime(),
    },
    activeAccountId: 'acc1',
    lastUpdatedInfo: {
      formattedDate: '17 Oct',
      ageLabel: '1 month ago',
      displayText: '17 Oct (1 month ago)',
      daysSinceUpdate: 35,
      freshness: 'aging',
      isStale: true,
    },
    navigate: vi.fn(),
    p1Name: 'Alice',
    p2Name: 'Bob',
    formData: {
      ownerId: 'person1',
      accountName: 'Santander Easy',
      nickname: '',
      last4Digits: '',
      category: 'Easy Access Savings',
      balance: '10000',
      interestRate: '4.5',
      budgetOrder: '',
      interestTrackingMethod: 'manual',
      bonusRateActive: false,
      bonusEndDate: '',
      interestPayoutFrequency: 'monthly',
      interestPayoutDate: '',
      isCompound: true,
      bondTermYears: '',
    },
    handleChange: vi.fn(),
    isEditing: true,
    showAER: true,
    showBonus: true,
    handleSave: vi.fn(),
    handleDelete: vi.fn(),
    showDeleteConfirm: false,
    setShowDeleteConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the last updated timestamp and aging badge in Financial Settings', () => {
    vi.mocked(useAccountForm).mockReturnValue(baseHookReturn);

    render(
      <MemoryRouter initialEntries={['/accounts/edit/acc1']}>
        <Routes>
          <Route path="/accounts/edit/:id" element={<EditAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const badge = screen.getByText('Updated: 17 Oct (1 month ago)');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement?.className).toContain('text-amber-700');
  });

  it('displays a stale rose badge when the account has not been updated in 60+ days', () => {
    vi.mocked(useAccountForm).mockReturnValue({
      ...baseHookReturn,
      lastUpdatedInfo: {
        formattedDate: '1 Aug',
        ageLabel: '3 months ago',
        displayText: '1 Aug (3 months ago)',
        daysSinceUpdate: 112,
        freshness: 'stale',
        isStale: true,
      },
    });

    render(
      <MemoryRouter initialEntries={['/accounts/edit/acc1']}>
        <Routes>
          <Route path="/accounts/edit/:id" element={<EditAccountPage />} />
        </Routes>
      </MemoryRouter>
    );

    const badge = screen.getByText('Updated: 1 Aug (3 months ago)');
    expect(badge).toBeInTheDocument();
    expect(badge.parentElement?.className).toContain('text-rose-600');
  });
});
