import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function usePropertyIncomeForm(id?: string) {
    const [formData, setFormData] = useState<{
        propertyId: string;
        date: string; // YYYY-MM-DD for form input
        description: string;
        amount: string; // string for intermediate input state
    }>({
        propertyId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
    });

    const income = useLiveQuery(
        async () => {
            if (id) {
                return await db.propertyIncomes.get(id);
            }
            return undefined;
        },
        [id]
    );

    useEffect(() => {
        if (income) {
            setFormData({
                propertyId: income.propertyId,
                date: new Date(income.date).toISOString().split('T')[0],
                description: income.description || '',
                amount: income.amount.toString(),
            });
        }
    }, [income]);

    const handleIncomeSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.propertyId || !formData.date || !formData.amount) return;

        const incomeData = {
            propertyId: formData.propertyId,
            date: new Date(formData.date).getTime(),
            description: formData.description,
            amount: Number(formData.amount),
            updatedAt: Date.now(),
        };

        if (id) {
            await db.propertyIncomes.update(id, incomeData);
        } else {
            await db.propertyIncomes.add({
                ...incomeData,
                id: crypto.randomUUID(),
            });
        }
    };

    const deleteIncome = async () => {
        if (id) {
            await db.propertyIncomes.delete(id);
        }
    };

    return {
        formData,
        setFormData,
        handleSubmit: handleIncomeSubmit,
        deleteIncome,
        isEditing: !!id,
        income,
    };
}
