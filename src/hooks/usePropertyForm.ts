import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function usePropertyForm(id?: string) {
    const [formData, setFormData] = useState<{
        name: string;
        expectedMonthlyIncome?: number;
        annualGrowthRate?: number;
    }>({
        name: '',
    });

    const property = useLiveQuery(
        async () => {
            if (id) {
                return await db.properties.get(id);
            }
            return undefined;
        },
        [id]
    );

    useEffect(() => {
        if (property) {
            setFormData({
                name: property.name,
                expectedMonthlyIncome: property.expectedMonthlyIncome,
                annualGrowthRate: property.annualGrowthRate,
            });
        }
    }, [property]);

    const handlePropertySubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.name) return;

        const propertyData = {
            name: formData.name,
            expectedMonthlyIncome: formData.expectedMonthlyIncome ? Number(formData.expectedMonthlyIncome) : undefined,
            annualGrowthRate: formData.annualGrowthRate ? Number(formData.annualGrowthRate) : undefined,
            updatedAt: Date.now(),
        };

        if (id) {
            await db.properties.update(id, propertyData);
        } else {
            await db.properties.add({
                ...propertyData,
                id: crypto.randomUUID(),
            });
        }
    };

    const deleteProperty = async () => {
        if (id) {
            await db.properties.delete(id);
            // Delete associated expenses when property is deleted
            const expenses = await db.propertyExpenses.where('propertyId').equals(id).toArray();
            await db.propertyExpenses.bulkDelete(expenses.map(e => e.id));
            // Delete associated incomes when property is deleted
            const incomes = await db.propertyIncomes.where('propertyId').equals(id).toArray();
            await db.propertyIncomes.bulkDelete(incomes.map(i => i.id));
            // Delete associated ownerships when property is deleted
            const ownerships = await db.propertyOwnership.where('propertyId').equals(id).toArray();
            await db.propertyOwnership.bulkDelete(ownerships.map(o => o.id));
        }
    };

    return {
        formData,
        setFormData,
        handleSubmit: handlePropertySubmit,
        deleteProperty,
        isEditing: !!id,
        property,
    };
}
