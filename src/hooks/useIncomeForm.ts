import { useState, useEffect, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Income } from '@/lib/db';
import {
    formatOptionalDateInput,
    INCOME_OPTIONS,
    parseOptionalDateInput,
    resolveIncomeDropdownSelection
} from '@/utils/incomeCalculations';

export type IncomeFieldValue = Income[keyof Income] | string;

export function useIncomeForm(ownerId: string) {
    const incomes = useLiveQuery(() => db.incomes.where('ownerId').equals(ownerId).toArray(), [ownerId]);

    const [formData, setFormData] = useState<Partial<Income>>({
        frequency: 'annual',
        amount: 0
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    // One-time cleanup of legacy £0 entries left over by the old form implementation
    useEffect(() => {
        const cleanupZeros = async () => {
            const zeroIncomes = await db.incomes.filter(i => i.amount === 0).toArray();
            if (zeroIncomes.length > 0) {
                await db.incomes.bulkDelete(zeroIncomes.map(z => z.id));
            }
        };
        cleanupZeros();
    }, []);

    const handleFormChange = (field: keyof Income, value: IncomeFieldValue) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEdit = (income: Income) => {
        setEditingId(income.id);
        setFormData(income);

        // Scroll to the form
        setTimeout(() => {
            document.getElementById('modify-entry-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            frequency: 'annual',
            amount: 0
        });
    };

    const handleSaveEntry = async () => {
        if (!formData.name || formData.amount === undefined || !formData.frequency || !formData.type || !formData.taxCategory) return;

        const numericAmount = typeof formData.amount === 'string' ? parseFloat(formData.amount) || 0 : formData.amount;

        if (editingId) {
            await db.incomes.update(editingId, {
                ...formData,
                amount: numericAmount,
                startDate: formData.startDate ? Number(formData.startDate) : undefined,
                endDate: formData.endDate ? Number(formData.endDate) : undefined,
                updatedAt: Date.now()
            });
        } else {
            await db.incomes.add({
                id: crypto.randomUUID(),
                ownerId,
                name: formData.name,
                amount: numericAmount,
                frequency: formData.frequency,
                type: formData.type,
                taxCategory: formData.taxCategory,
                startDate: formData.startDate ? Number(formData.startDate) : undefined,
                endDate: formData.endDate ? Number(formData.endDate) : undefined,
                updatedAt: Date.now()
            });
        }
        handleCancelEdit();
    };

    const handleDeleteEntry = async (id: string) => {
        await db.incomes.delete(id);
        if (editingId === id) {
            handleCancelEdit();
        }
    };

    // Removed prefilling to ensure dropdown remains explicitly blank when clicking '+'
    const handleAddClick = () => {
        setEditingId(null);
        setFormData({
            frequency: 'annual',
            amount: 0
        });
        setTimeout(() => {
            document.getElementById('modify-entry-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    return {
        incomes: incomes || [],
        formData,
        editingId,
        handleFormChange,
        handleEdit,
        handleSaveEntry,
        handleDeleteEntry,
        handleCancelEdit,
        handleAddClick
    };
}

interface IncomeEntryFormUiState {
    selectedDropdownPath: string;
    showCustomName: boolean;
    syncedKey: string;
}

export function useIncomeEntryForm(
    formData: Partial<Income>,
    isEditing: boolean,
    onChange: (field: keyof Income, value: IncomeFieldValue) => void
) {
    const syncKey = `${isEditing}|${formData.type || ''}|${isEditing ? formData.name || '' : ''}`;
    const [uiState, setUiState] = useState<IncomeEntryFormUiState>({
        selectedDropdownPath: '',
        showCustomName: false,
        syncedKey: ''
    });

    if (syncKey !== uiState.syncedKey) {
        const resolved = resolveIncomeDropdownSelection(isEditing, formData.name, formData.type);
        if (resolved) {
            setUiState({
                selectedDropdownPath: resolved.selectedDropdownPath,
                showCustomName: resolved.showCustomName,
                syncedKey: syncKey
            });
        } else {
            setUiState(prev => ({
                ...prev,
                syncedKey: syncKey
            }));
        }
    }

    const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const option = INCOME_OPTIONS.find(opt => opt.label === e.target.value);
        if (option) {
            setUiState(prev => ({
                ...prev,
                selectedDropdownPath: option.label,
                showCustomName: !!option.isCustom
            }));
            onChange('type', option.type);
            onChange('taxCategory', option.taxCategory);

            if (option.isCustom) {
                onChange('name', '');
            } else {
                onChange('name', option.label);
            }
        }
    };

    const displayAmount = formData.amount === 0 ? '' : formData.amount?.toString() || '';
    const startDateValue = formatOptionalDateInput(formData.startDate);
    const endDateValue = formatOptionalDateInput(formData.endDate);

    const handleStartDateChange = (val: string) => {
        onChange('startDate', parseOptionalDateInput(val));
    };

    const handleEndDateChange = (val: string) => {
        onChange('endDate', parseOptionalDateInput(val));
    };

    return {
        selectedDropdownPath: uiState.selectedDropdownPath,
        showCustomName: uiState.showCustomName,
        displayAmount,
        startDateValue,
        endDateValue,
        pensionOptions: INCOME_OPTIONS.filter(o => o.type === 'pension'),
        employmentOptions: INCOME_OPTIONS.filter(o => o.type === 'employment'),
        dividendOptions: INCOME_OPTIONS.filter(o => o.type === 'dividends'),
        handleTypeChange,
        handleStartDateChange,
        handleEndDateChange
    };
}
