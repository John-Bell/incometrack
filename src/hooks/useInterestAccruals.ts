import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { InterestAccrual } from '../lib/db';
import { formatLedgerDateInput, parseLedgerDateInput } from '@/utils/accountUtils';

export function useInterestAccruals(accountId?: string) {
    const accruals = useLiveQuery(
        async () => {
            let query = db.interestAccruals.toCollection();

            if (accountId) {
                query = db.interestAccruals.where('accountId').equals(accountId);
            }

            return await query.reverse().sortBy('date');
        },
        [accountId]
    );

    return {
        accruals,
        isLoading: accruals === undefined
    };
}

export const addInterestAccrual = async (accrualData: Omit<InterestAccrual, 'id' | 'updatedAt'>) => {
    return db.interestAccruals.add({
        id: crypto.randomUUID(),
        ...accrualData,
        updatedAt: Date.now()
    });
};

export const updateInterestAccrual = async (id: string, accrualData: Partial<Omit<InterestAccrual, 'id' | 'updatedAt'>>) => {
    return db.interestAccruals.update(id, {
        ...accrualData,
        updatedAt: Date.now()
    });
};

export const deleteInterestAccrual = async (id: string) => {
    return db.interestAccruals.delete(id);
};

interface InterestLedgerFormState {
    editingId: string | null;
    entryDate: string;
    interest: string;
}

const INITIAL_LEDGER_FORM_STATE: InterestLedgerFormState = {
    editingId: null,
    entryDate: '',
    interest: ''
};

export function useInterestLedger(accountId: string) {
    const { accruals, isLoading } = useInterestAccruals(accountId);
    const [formState, setFormState] = useState<InterestLedgerFormState>(INITIAL_LEDGER_FORM_STATE);

    const setEntryDate = (entryDate: string) => {
        setFormState(prev => ({ ...prev, entryDate }));
    };

    const setInterest = (interest: string) => {
        setFormState(prev => ({ ...prev, interest }));
    };

    const handleAddOrEdit = async () => {
        if (!formState.entryDate || !formState.interest || !accountId) return;

        const date = parseLedgerDateInput(formState.entryDate);
        const interestAccrued = parseFloat(formState.interest);

        if (formState.editingId) {
            await updateInterestAccrual(formState.editingId, {
                accountId,
                date,
                interestAccrued
            });
        } else {
            await addInterestAccrual({
                accountId,
                date,
                interestAccrued
            });
        }

        setFormState(INITIAL_LEDGER_FORM_STATE);
    };

    const handleEditClick = (accrual: InterestAccrual) => {
        setFormState({
            editingId: accrual.id,
            entryDate: formatLedgerDateInput(accrual.date),
            interest: accrual.interestAccrued.toString()
        });
    };

    const handleCancelEdit = () => {
        setFormState(INITIAL_LEDGER_FORM_STATE);
    };

    const handleDeleteClick = async (id: string) => {
        await deleteInterestAccrual(id);
    };

    return {
        accruals,
        isLoading,
        editingId: formState.editingId,
        entryDate: formState.entryDate,
        interest: formState.interest,
        setEntryDate,
        setInterest,
        handleAddOrEdit,
        handleEditClick,
        handleCancelEdit,
        handleDeleteClick
    };
}
