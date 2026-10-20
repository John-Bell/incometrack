import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentMappingsPage } from './PaymentMappingsPage';
import { BrowserRouter } from 'react-router-dom';
import { usePaymentMappings } from '@/hooks/usePaymentMappings';

vi.mock('@/hooks/usePaymentMappings', () => ({
    usePaymentMappings: vi.fn(),
}));

describe('PaymentMappingsPage', () => {
    const mockSetNewPaymentName = vi.fn();
    const mockToggleNewBudgetId = vi.fn();
    const mockHandleAdd = vi.fn();
    const mockSetEditPaymentName = vi.fn();
    const mockToggleEditBudgetId = vi.fn();
    const mockStartEdit = vi.fn();
    const mockCancelEdit = vi.fn();
    const mockHandleSaveEdit = vi.fn();
    const mockHandleDelete = vi.fn();

    const sampleBudgets = [
        { id: 'b1', accountId: 'acc1', name: 'Groceries', amount: 300, frequency: 'monthly' },
        { id: 'b2', accountId: 'acc1', name: 'Utilities', amount: 150, frequency: 'monthly' },
    ];

    const sampleMappings = [
        { id: 'm1', paymentName: 'Tesco', budgetIds: ['b1'] },
        { id: 'm2', paymentName: 'British Gas', budgetIds: ['b2'] },
    ];

    const defaultHookReturn = {
        mappings: sampleMappings,
        budgets: sampleBudgets,
        groupedBudgets: [
            { categoryId: 'all', categoryName: 'All Budgets', budgets: sampleBudgets },
        ],
        newPaymentName: '',
        setNewPaymentName: mockSetNewPaymentName,
        newBudgetIds: [],
        toggleNewBudgetId: mockToggleNewBudgetId,
        handleAdd: mockHandleAdd,
        editingId: null,
        editPaymentName: '',
        setEditPaymentName: mockSetEditPaymentName,
        editBudgetIds: [],
        toggleEditBudgetId: mockToggleEditBudgetId,
        startEdit: mockStartEdit,
        cancelEdit: mockCancelEdit,
        handleSaveEdit: mockHandleSaveEdit,
        handleDelete: mockHandleDelete,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when no payment mappings exist', () => {
        (usePaymentMappings as any).mockReturnValue({
            ...defaultHookReturn,
            mappings: [],
        });

        render(
            <BrowserRouter>
                <PaymentMappingsPage />
            </BrowserRouter>
        );

        expect(screen.getByText('No payment mappings found.')).toBeInTheDocument();
    });

    it('renders list of payment mappings with budget badges', () => {
        (usePaymentMappings as any).mockReturnValue(defaultHookReturn);

        render(
            <BrowserRouter>
                <PaymentMappingsPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Tesco')).toBeInTheDocument();
        expect(screen.getByText('British Gas')).toBeInTheDocument();
        expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Utilities').length).toBeGreaterThan(0);
    });

    it('handles input and calls handleAdd when adding a mapping', () => {
        (usePaymentMappings as any).mockReturnValue({
            ...defaultHookReturn,
            newPaymentName: 'Sainsbury',
            newBudgetIds: ['b1'],
        });

        render(
            <BrowserRouter>
                <PaymentMappingsPage />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText('e.g. Tesco, Salary, Direct Debit');
        fireEvent.change(input, { target: { value: 'Aldi' } });
        expect(mockSetNewPaymentName).toHaveBeenCalledWith('Aldi');

        const addButtons = screen.getAllByRole('button');
        const addButton = addButtons.find(btn => btn.querySelector('span')?.textContent === 'add') || addButtons[1];
        fireEvent.click(addButton);
        expect(mockHandleAdd).toHaveBeenCalled();
    });

    it('calls startEdit when clicking edit button', () => {
        (usePaymentMappings as any).mockReturnValue(defaultHookReturn);

        render(
            <BrowserRouter>
                <PaymentMappingsPage />
            </BrowserRouter>
        );

        const editButtons = screen.getAllByRole('button', { name: 'Edit mapping' });
        fireEvent.click(editButtons[0]);
        expect(mockStartEdit).toHaveBeenCalledWith(sampleMappings[0]);
    });

    it('renders edit form when editingId matches a mapping and handles save/cancel', () => {
        (usePaymentMappings as any).mockReturnValue({
            ...defaultHookReturn,
            editingId: 'm1',
            editPaymentName: 'Tesco Express',
            editBudgetIds: ['b1'],
        });

        render(
            <BrowserRouter>
                <PaymentMappingsPage />
            </BrowserRouter>
        );

        const editInput = screen.getByDisplayValue('Tesco Express');
        fireEvent.change(editInput, { target: { value: 'Tesco Extra' } });
        expect(mockSetEditPaymentName).toHaveBeenCalledWith('Tesco Extra');

        const saveButton = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(saveButton);
        expect(mockHandleSaveEdit).toHaveBeenCalledWith('m1');

        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        fireEvent.click(cancelButton);
        expect(mockCancelEdit).toHaveBeenCalled();
    });

    it('calls handleDelete when clicking delete button', () => {
        (usePaymentMappings as any).mockReturnValue(defaultHookReturn);

        render(
            <BrowserRouter>
                <PaymentMappingsPage />
            </BrowserRouter>
        );

        const deleteButtons = screen.getAllByRole('button', { name: 'Delete mapping' });
        fireEvent.click(deleteButtons[0]);
        expect(mockHandleDelete).toHaveBeenCalledWith('m1', 'Tesco');
    });
});
