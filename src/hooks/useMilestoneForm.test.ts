import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMilestoneForm } from './useMilestoneForm';
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

describe('useMilestoneForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(db.milestones, 'add').mockResolvedValue('new-m-id');
    vi.spyOn(db.milestones, 'update').mockResolvedValue(1);
    vi.spyOn(db.milestones, 'delete').mockResolvedValue(undefined);
  });

  it('initializes with default values in Add mode and saves a new milestone', async () => {
    mockedUseLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useMilestoneForm());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.handleChange('name', 'Retirement Lump Sum');
      result.current.handleChange('date', '2030-04-06');
      result.current.handleChange('amount', '50000');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(db.milestones.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Retirement Lump Sum',
        date: new Date('2030-04-06').getTime(),
        amount: 50000,
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/milestones');
  });

  it('populates existing milestone in Edit mode and updates record on save', async () => {
    const existingMilestone = {
      id: 'm1',
      name: 'House Move',
      date: new Date('2028-09-01T00:00:00.000Z').getTime(),
      amount: -25000,
    };

    mockedUseLiveQuery.mockReturnValue(existingMilestone);

    const { result } = renderHook(() => useMilestoneForm('m1'));

    expect(result.current.isEditing).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.formData.name).toBe('House Move');
    expect(result.current.formData.date).toBe('2028-09-01');
    expect(result.current.formData.amount).toBe('-25000');

    act(() => {
      result.current.handleChange('amount', '-30000');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(db.milestones.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({
        name: 'House Move',
        date: new Date('2028-09-01').getTime(),
        amount: -30000,
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/milestones');
  });

  it('deletes milestone and redirects when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockedUseLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useMilestoneForm('m1'));

    await act(async () => {
      await result.current.handleDelete();
    });

    expect(db.milestones.delete).toHaveBeenCalledWith('m1');
    expect(mockNavigate).toHaveBeenCalledWith('/milestones');
  });
});
