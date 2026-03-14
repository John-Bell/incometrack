import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { InterestAccrual } from '../lib/db';

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

export const deleteInterestAccrual = async (id: string) => {
    return db.interestAccruals.delete(id);
};
