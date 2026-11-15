import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePaymentForm } from './usePaymentForm';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

const mockedUseLiveQuery = vi.mocked(useLiveQuery);

describe('usePaymentForm', () => {
  const sampleAccounts = [
    { id: 'acc1', name: 'Main Current', category: 'Current Account', balance: 0, interestRate: 0, ownerId: 'joint', updatedAt: 0 },
    { id: 'acc2', name: 'Second Current', category: 'Current Account', balance: 0, interestRate: 0, ownerId: 'joint', updatedAt: 0 },
    { id: 'acc3', name: 'Instant Saver', category: 'Savings', balance: 0, interestRate: 0, ownerId: 'joint', updatedAt: 0 },
  ];

  const sampleBudgets = [
    { id: 'b1', name: 'Groceries', accountId: 'acc1', amount: 400, frequency: 'monthly' },
    { id: 'b2', name: 'Dining Out', accountId: 'acc2', amount: 150, frequency: 'monthly' },
  ];

  const sampleMappings = [
    { id: 'm1', paymentName: 'Tesco', budgetIds: ['b1', 'b2'] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.spyOn(db.transactions, 'add').mockResolvedValue('new-tx-id');
    vi.spyOn(db.transactions, 'update').mockResolvedValue(1);
    vi.spyOn(db.transactions, 'delete').mockResolvedValue(undefined);
  });

  it('auto-suggests budget and account from payee mapping in Add mode and saves transaction', async () => {
    mockedUseLiveQuery.mockImplementation((cb: () => unknown, deps?: unknown[]) => {
      if (deps && deps.length > 0) return undefined;
      const fnStr = cb.toString();
      if (fnStr.includes('budgets')) return sampleBudgets;
      if (fnStr.includes('accounts')) return sampleAccounts;
      if (fnStr.includes('paymentMappings')) return sampleMappings;
      return [];
    });

    const { result } = renderHook(() => usePaymentForm());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.currentAccounts).toHaveLength(2);

    act(() => {
      result.current.handlePayeeChange('Tesco Express');
      result.current.handleChange('amount', '42.50');
    });

    expect(result.current.suggestedBudgetIds).toEqual(['b1', 'b2']);
    expect(result.current.formData.budgetId).toBe('b1');
    expect(result.current.formData.accountId).toBe('acc1');

    act(() => {
      result.current.applySuggestion('b2');
    });

    expect(result.current.formData.budgetId).toBe('b2');
    expect(result.current.formData.accountId).toBe('acc2');

    await act(async () => {
      await result.current.handleSave();
    });

    expect(db.transactions.add).toHaveBeenCalledWith(
      expect.objectContaining({
        payee: 'Tesco Express',
        amount: 42.5,
        type: 'expense',
        icon: 'shopping_cart',
        budgetId: 'b2',
        accountId: 'acc2',
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/transactions');
  });

  it('populates existing transaction in Edit mode, clears incompatible budget on account change, and updates record', async () => {
    mockSearchParams = new URLSearchParams('from=dashboard');
    const existingTx = {
      id: 'tx1',
      date: new Date('2026-05-10').getTime(),
      payee: 'Sainsburys',
      amount: 65,
      type: 'expense' as const,
      icon: 'shopping_cart',
      budgetId: 'b1',
      accountId: 'acc1',
    };

    mockedUseLiveQuery.mockImplementation((cb: () => unknown, deps?: unknown[]) => {
      if (deps && deps.length > 0) return existingTx;
      const fnStr = cb.toString();
      if (fnStr.includes('budgets')) return sampleBudgets;
      if (fnStr.includes('accounts')) return sampleAccounts;
      return [];
    });

    const { result } = renderHook(() => usePaymentForm('tx1'));

    expect(result.current.isEditing).toBe(true);
    expect(result.current.formData.payee).toBe('Sainsburys');
    expect(result.current.formData.budgetId).toBe('b1');
    expect(result.current.formData.accountId).toBe('acc1');

    act(() => {
      result.current.handleChange('accountId', 'acc2');
    });

    expect(result.current.formData.accountId).toBe('acc2');
    expect(result.current.formData.budgetId).toBe('');

    await act(async () => {
      await result.current.handleSave();
    });

    expect(db.transactions.update).toHaveBeenCalledWith(
      'tx1',
      expect.objectContaining({
        payee: 'Sainsburys',
        amount: 65,
        accountId: 'acc2',
        budgetId: undefined,
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('deletes transaction and redirects when confirmed', async () => {
    mockSearchParams = new URLSearchParams('accountId=acc1');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockedUseLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => usePaymentForm('tx1'));

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(db.transactions.delete).toHaveBeenCalledWith('tx1');
    expect(mockNavigate).toHaveBeenCalledWith('/transactions?accountId=acc1');
  });
});
