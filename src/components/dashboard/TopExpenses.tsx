import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Icon } from '../ui/Icon';
import type { Transaction } from '@/lib/db';


interface TopExpensesProps {
    expenses: Transaction[];
}

export function TopExpenses({ expenses }: TopExpensesProps) {
    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const budgetsMap = Object.fromEntries(budgets.map(b => [b.id, b]));

    if (!expenses || expenses.length === 0) {
        return null; 
    }

    return (
        <section className="px-4 py-6">
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-4">Top Expenses This Month</h2>
            <div className="flex flex-col gap-3">
                {expenses.map((expense) => {
                    const formattedAmount = new Intl.NumberFormat('en-GB', { 
                        style: 'currency', 
                        currency: 'GBP', 
                        minimumFractionDigits: 2 
                    }).format(expense.amount);

                    return (
                        <div key={expense.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 border border-primary/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                                    <Icon name={expense.icon || 'receipt'} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{expense.payee}</p>
                                    <p className="text-xs text-slate-500 capitalize">{expense.budgetId ? (budgetsMap[expense.budgetId]?.name || 'Uncategorized') : 'Uncategorized'}</p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 pl-2">
                                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{formattedAmount}</p>
                                <p className="text-[10px] text-slate-400">{new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
