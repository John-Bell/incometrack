import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { useStore } from '@/store/useStore';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { calculateTotalSavings } from '@/services/accountCalculations';

import { SummaryCards } from '../components/dashboard/SummaryCards';
import { BudgetHealth } from '../components/dashboard/BudgetHealth';
import { TopExpenses } from '../components/dashboard/TopExpenses';

export function DashboardPage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';
    const combinedName = profile?.name || `${p1Name} & ${p2Name}`;

    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

    const { combinedNet } = useTaxCalculations();

    const totalSavings = calculateTotalSavings(accounts);

    // Calculate budget health for the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthBudgetsTarget = budgets.reduce((sum, budget) => {
        return sum + (budget.frequency === 'annual' ? budget.amount / 12 : budget.amount);
    }, 0);

    const currentMonthExpenses = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.budgetId;
    });

    const currentMonthActualSpent = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Get top 2 expenses for the current month
    const allCurrentMonthExpenses = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const top2Expenses = [...allCurrentMonthExpenses]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 2);

    return (
        <AppLayout
            header={
                <Header
                    subtitle="Good morning,"
                    title={combinedName}
                    rightElement={
                        <MainHeaderActions onSave={() => { }} />
                    }
                />
            }
        >
            <div className="flex flex-col pb-20">
                <SummaryCards totalSavings={totalSavings} netIncome={combinedNet} />
                <BudgetHealth targetAmount={currentMonthBudgetsTarget} actualAmount={currentMonthActualSpent} />
                <TopExpenses expenses={top2Expenses} />
            </div>
        </AppLayout>
    );
}
