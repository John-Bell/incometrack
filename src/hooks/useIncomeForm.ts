import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Income } from '@/lib/db';

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

    const handleFormChange = (field: keyof Income, value: any) => {
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
                updatedAt: Date.now()
            });
        } else {
            await db.incomes.add({
                id: crypto.randomUUID(),
                ownerId,
                name: formData.name,
                amount: numericAmount,
                frequency: formData.frequency as any,
                type: formData.type,
                taxCategory: formData.taxCategory,
                updatedAt: Date.now()
            } as Income);
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
