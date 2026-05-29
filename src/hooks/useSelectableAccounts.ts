import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

const LIQUID_CATEGORIES = [
    'Current Account',
    'Easy Access Savings',
    'Fixed Term Savings',
    'Notice Savings',
    'Cash ISA',
    'Shares ISA'
];

export function useSelectableAccounts() {
    const dbAccounts = useLiveQuery(() => db.accounts.toArray());

    if (!dbAccounts) {
        return {
            options: [],
            isReady: false
        };
    }

    const options = dbAccounts
        .filter(account => LIQUID_CATEGORIES.includes(account.category))
        .map(account => {
            const formattedBalance = new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(account.balance);

            return {
                id: account.id,
                label: `${account.name} (${formattedBalance})`
            };
        });

    return {
        options,
        isReady: true
    };
}
