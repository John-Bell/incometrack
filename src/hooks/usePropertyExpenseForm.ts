import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function usePropertyExpenseForm(id?: string) {
    const [formData, setFormData] = useState<{
        propertyId: string;
        date: string; // YYYY-MM-DD for form input
        payee: string;
        description: string;
        amount: string; // string for intermediate input state
    }>({
        propertyId: '',
        date: new Date().toISOString().split('T')[0],
        payee: '',
        description: '',
        amount: '',
    });

    const expense = useLiveQuery(
        async () => {
            if (id) {
                return await db.propertyExpenses.get(id);
            }
            return undefined;
        },
        [id]
    );

    useEffect(() => {
        if (expense) {
            setFormData({
                propertyId: expense.propertyId,
                date: new Date(expense.date).toISOString().split('T')[0],
                payee: expense.payee,
                description: expense.description || '',
                amount: expense.amount.toString(),
            });
        }
    }, [expense]);

    const handleExpenseSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.propertyId || !formData.date || !formData.payee || !formData.amount) return;

        const expenseData = {
            propertyId: formData.propertyId,
            date: new Date(formData.date).getTime(),
            payee: formData.payee,
            description: formData.description,
            amount: Number(formData.amount),
            updatedAt: Date.now(),
        };

        if (id) {
            await db.propertyExpenses.update(id, expenseData);
        } else {
            await db.propertyExpenses.add({
                ...expenseData,
                id: crypto.randomUUID(),
            });
        }
    };

    const deleteExpense = async () => {
        if (id) {
            await db.propertyExpenses.delete(id);
        }
    };

    return {
        formData,
        setFormData,
        handleSubmit: handleExpenseSubmit,
        deleteExpense,
        isEditing: !!id,
        expense,
    };
}
