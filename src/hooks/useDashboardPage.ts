import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { getProfileCombinedName } from '@/utils/dashboardUtils';

export function useDashboardPage() {
    const profile = useStore(state => state.profile);
    const combinedName = getProfileCombinedName(profile);

    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

    return {
        combinedName,
        accounts,
        budgets,
        transactions
    };
}
