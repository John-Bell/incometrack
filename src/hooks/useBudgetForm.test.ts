import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBudgetForm } from './useBudgetForm';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

const mockedUseLiveQuery = vi.mocked(useLiveQuery);

describe('useBudgetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db.budgets, 'add').mockResolvedValue('new-id');
    vi.spyOn(db.budgets, 'update').mockResolvedValue(1);
    vi.spyOn(db.budgets, 'delete').mockResolvedValue(undefined);
  });

  it('initializes with default values in Add mode and saves a new budget', async () => {
    const sampleAccounts = [
      { id: 'acc1', name: 'Main Account', budgetOrder: 1, balance: 0, interestRate: 0, ownerId: 'joint', category: 'Current Account', updatedAt: 0 },
      { id: 'acc2', name: 'Savings Account', balance: 0, interestRate: 0, ownerId: 'joint', category: 'Savings', updatedAt: 0 },
    ];

    mockedUseLiveQuery.mockImplementation((_cb: () => unknown, deps?: unknown[]) => {
      if (deps && deps.length > 0) return undefined;
      return sampleAccounts;
    });

    const { result } = renderHook(() => useBudgetForm());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.budgetAccounts).toHaveLength(1);
    expect(result.current.budgetAccounts[0].id).toBe('acc1');

    act(() => {
      result.current.handleChange('name', 'Weekly Groceries');
      result.current.handleChange('amount', '150');
      result.current.handleChange('frequency', 'monthly');
      result.current.handleChange('accountId', 'acc1');
      result.current.handleChange('oneOffBudget', true);
    });

    expect(result.current.calculatedAnnual).toBe(1800);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(db.budgets.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Weekly Groceries',
        amount: 150,
        frequency: 'monthly',
        accountId: 'acc1',
        oneOffBudget: true,
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/budgets');
  });

  it('populates existing budget in Edit mode and updates record on save', async () => {
    const existingBudget = {
      id: 'b1',
      name: 'Council Tax',
      amount: 200,
      frequency: 'monthly',
      accountId: 'acc1',
      icon: 'home',
      budgetStartDate: new Date(2026, 3, 1).getTime(),
      oneOffBudget: false,
    };

    mockedUseLiveQuery.mockImplementation((_cb: () => unknown, deps?: unknown[]) => {
      if (deps && deps.length > 0) return existingBudget;
      return [];
    });

    const { result } = renderHook(() => useBudgetForm('b1'));

    expect(result.current.isEditing).toBe(true);
    expect(result.current.formData.name).toBe('Council Tax');
    expect(result.current.formData.amount).toBe('200');
    expect(result.current.formData.icon).toBe('home');
    expect(result.current.formData.budgetStartDate).toBe('2026-04-01');

    act(() => {
      result.current.handleChange('amount', '225');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(db.budgets.update).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({
        name: 'Council Tax',
        amount: 225,
        frequency: 'monthly',
        accountId: 'acc1',
        icon: 'home',
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/budgets');
  });

  it('blocks deletion when associated transactions exist', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(db.transactions, 'where').mockReturnValue({
      equals: () => ({
        count: vi.fn().mockResolvedValue(2),
      }),
    } as unknown as ReturnType<typeof db.transactions.where>);

    mockedUseLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useBudgetForm('b1'));

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Cannot delete budget item as it has associated payments.'
    );
    expect(db.budgets.delete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
