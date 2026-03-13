import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { useStore } from '@/store/useStore';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

import { DashboardAccountList } from '../components/dashboard/DashboardAccountList';

export function DashboardPage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';
    const combinedName = profile?.name || `${p1Name} & ${p2Name}`;

    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

    return (
        <AppLayout
            header={
                <Header
                    subtitle="Good morning,"
                    title={combinedName}
                    rightElement={
                        <MainHeaderActions showSaveButton />
                    }
                />
            }
        >
            <DashboardAccountList
                accounts={accounts}
                budgets={budgets}
                transactions={transactions}
            />
        </AppLayout>
    );
}
