import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function usePropertyOwnershipForm(id?: string) {
    const [formData, setFormData] = useState<{
        propertyId: string;
        startDate: string;
        person1Percent: string;
        person2Percent: string;
    }>({
        propertyId: '',
        startDate: new Date().toISOString().split('T')[0],
        person1Percent: '50',
        person2Percent: '50',
    });

    const ownership = useLiveQuery(
        async () => {
            if (id) {
                return await db.propertyOwnership.get(id);
            }
            return undefined;
        },
        [id]
    );

    useEffect(() => {
        if (ownership) {
            setFormData({
                propertyId: ownership.propertyId,
                startDate: new Date(ownership.startDate).toISOString().split('T')[0],
                person1Percent: ownership.person1Percent.toString(),
                person2Percent: ownership.person2Percent.toString(),
            });
        }
    }, [ownership]);

    const handleOwnershipSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.propertyId || !formData.startDate || formData.person1Percent === '' || formData.person2Percent === '') return;

        const ownershipData = {
            propertyId: formData.propertyId,
            startDate: new Date(formData.startDate).getTime(),
            person1Percent: Number(formData.person1Percent),
            person2Percent: Number(formData.person2Percent),
            updatedAt: Date.now(),
        };

        if (id) {
            await db.propertyOwnership.update(id, ownershipData);
        } else {
            await db.propertyOwnership.add({
                ...ownershipData,
                id: crypto.randomUUID(),
            });
        }
    };

    const deleteOwnership = async () => {
        if (id) {
            await db.propertyOwnership.delete(id);
        }
    };

    return {
        formData,
        setFormData,
        handleSubmit: handleOwnershipSubmit,
        deleteOwnership,
        isEditing: !!id,
        ownership,
    };
}
