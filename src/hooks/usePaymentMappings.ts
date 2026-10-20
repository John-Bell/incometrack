import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PaymentMapping } from '@/lib/db';
import {
    getGroupedBudgets,
    toggleBudgetId,
    validatePaymentMapping,
} from '@/utils/paymentMappingUtils';

export function usePaymentMappings() {
    const mappings = useLiveQuery(() => db.paymentMappings.toArray()) || [];
    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPaymentName, setEditPaymentName] = useState('');
    const [editBudgetIds, setEditBudgetIds] = useState<string[]>([]);

    const [newPaymentName, setNewPaymentName] = useState('');
    const [newBudgetIds, setNewBudgetIds] = useState<string[]>([]);

    const groupedBudgets = getGroupedBudgets(budgets);

    const toggleNewBudgetId = (id: string) => {
        setNewBudgetIds((prev) => toggleBudgetId(prev, id));
    };

    const toggleEditBudgetId = (id: string) => {
        setEditBudgetIds((prev) => toggleBudgetId(prev, id));
    };

    const handleAdd = async () => {
        const validation = validatePaymentMapping(
            newPaymentName,
            newBudgetIds,
            mappings
        );

        if (!validation.isValid) {
            if (validation.errorMessage) {
                alert(validation.errorMessage);
            }
            return;
        }

        await db.paymentMappings.add({
            id: crypto.randomUUID(),
            paymentName: validation.trimmedName,
            budgetIds: newBudgetIds,
            updatedAt: Date.now(),
        });

        setNewPaymentName('');
        setNewBudgetIds([]);
    };

    const startEdit = (mapping: PaymentMapping) => {
        setEditingId(mapping.id);
        setEditPaymentName(mapping.paymentName);
        setEditBudgetIds(mapping.budgetIds || []);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditPaymentName('');
        setEditBudgetIds([]);
    };

    const handleSaveEdit = async (id: string) => {
        const trimmed = editPaymentName.trim();
        if (!trimmed || editBudgetIds.length === 0) {
            cancelEdit();
            return;
        }

        const validation = validatePaymentMapping(
            editPaymentName,
            editBudgetIds,
            mappings,
            id
        );

        if (!validation.isValid) {
            if (validation.errorMessage) {
                alert(validation.errorMessage);
            }
            return;
        }

        await db.paymentMappings.update(id, {
            paymentName: validation.trimmedName,
            budgetIds: editBudgetIds,
            updatedAt: Date.now(),
        });

        cancelEdit();
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete the mapping for "${name}"?`)) {
            await db.paymentMappings.delete(id);
        }
    };

    return {
        mappings,
        budgets,
        groupedBudgets,
        newPaymentName,
        setNewPaymentName,
        newBudgetIds,
        toggleNewBudgetId,
        handleAdd,
        editingId,
        editPaymentName,
        setEditPaymentName,
        editBudgetIds,
        toggleEditBudgetId,
        startEdit,
        cancelEdit,
        handleSaveEdit,
        handleDelete,
    };
}
