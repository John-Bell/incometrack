import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { DashboardAccountList } from '../components/dashboard/DashboardAccountList';
import { useDashboardPage } from '@/hooks/useDashboardPage';

export function DashboardPage() {
    const { combinedName, accounts, budgets, transactions } = useDashboardPage();

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
