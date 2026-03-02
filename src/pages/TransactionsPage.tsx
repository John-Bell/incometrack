import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Transaction } from '@/lib/db';

export function TransactionsPage() {
    const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];

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
                    title="Transactions"
                    leftElement={
                        <Icon name="search" className="text-2xl text-primary" />
                    }
                    rightElement={
                        <button className="bg-primary text-background-dark size-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                            <span className="material-symbols-outlined font-bold text-black" style={{ fontVariationSettings: "'FILL' 0, 'wght' 700, 'GRAD' 0, 'opsz' 24" }}>add</span>
                        </button>
                    }
                />
            }
        >
            <div className="px-4 pb-24 space-y-8">
                {Object.entries(groupedTransactions).map(([dateLabel, dailyTransactions]) => (
                    <section key={dateLabel}>
                        <div className="mb-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{dateLabel}</h2>
                        </div>
                        <div className="space-y-1">
                            {dailyTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center gap-4 py-4 hover:bg-primary/5 transition-colors cursor-pointer border-b border-slate-100 dark:border-primary/5">
                                    <div className="size-12 min-w-[3rem] rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Icon name={tx.icon} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{tx.payee}</h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${tx.type === 'expense' ? 'text-rose-500 dark:text-rose-400' : 'text-primary'}`}>
                                                    {tx.type === 'expense' ? '-' : '+'}
                                                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(tx.amount)}
                                                </span>
                                                <Icon name="chevron_right" className="text-slate-400 dark:text-slate-500 text-lg" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{tx.category}</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase">{tx.subCategory}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </AppLayout>
    );
}
