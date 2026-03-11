import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Transaction } from '@/lib/db';
import { Link, useNavigate } from 'react-router-dom';

export function TransactionsPage() {
    const navigate = useNavigate();
    const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];
    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const budgetCategories = useLiveQuery(() => db.budgetCategories.toArray()) || [];

    const budgetsMap = Object.fromEntries(budgets.map(b => [b.id, b]));
    const categoriesMap = Object.fromEntries(budgetCategories.map(c => [c.id, c.name]));

    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups: Record<string, Transaction[]>, transaction) => {
        const txDate = new Date(transaction.date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

        let groupKey = '';
        if (txDate.getTime() === today.getTime()) {
            groupKey = 'Today';
        } else if (txDate.getTime() === yesterday.getTime()) {
            groupKey = 'Yesterday';
        } else {
            groupKey = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(txDate);
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(transaction);
        return groups;
    }, {});

    return (
        <AppLayout
            header={
                <Header
                    title="The Chaser"
                    subtitle="Recent Transactions"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="receipt_long" className="text-2xl" />
                        </div>
                    }
                    rightElement={
                        <MainHeaderActions showSaveButton />
                    }
                />
            }
        >
            <div className="flex flex-col gap-8 px-4 py-6 pb-24">
                <button
                    onClick={() => navigate('/transactions/add')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-xl shadow-[0_4px_14px_0_rgba(255,184,80,0.39)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    <Icon name="add" className="text-xl" />
                    <span>Add Payment</span>
                </button>

                {Object.entries(groupedTransactions).map(([dateLabel, dailyTransactions]) => (
                    <section key={dateLabel}>
                        <div className="mb-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{dateLabel}</h2>
                        </div>
                        <div className="space-y-1">
                            {dailyTransactions.map((tx) => (
                                <Link to={`/transactions/edit/${tx.id}`} key={tx.id} className="group flex items-center gap-4 py-4 hover:bg-primary/5 transition-colors cursor-pointer border-b border-slate-100 dark:border-primary/5">
                                    <div className="size-12 min-w-[3rem] rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Icon name={tx.icon} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{tx.payee}</h3>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold ${tx.type === 'expense' ? 'text-rose-500 dark:text-rose-400' : 'text-primary'}`}>
                                                    {tx.type === 'expense' ? '-' : '+'}
                                                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(tx.amount)}
                                                </span>
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors flex-shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                                                    <Icon name="edit" className="text-[18px] text-slate-500 dark:text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{tx.budgetId ? (categoriesMap[budgetsMap[tx.budgetId]?.category] || budgetsMap[tx.budgetId]?.category || 'Uncategorized') : 'Uncategorized'}</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase">{tx.budgetId ? (budgetsMap[tx.budgetId]?.name || 'Unknown') : 'Unknown'}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </AppLayout>
    );
}
