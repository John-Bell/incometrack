import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';

export function BudgetsPage() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');

    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
    const budgetCategories = useLiveQuery(() => db.budgetCategories.toArray()) || [];
    const categoryNameMap = Object.fromEntries(budgetCategories.map(c => [c.id, c.name]));

    // Group budgets by category
    const groupedBudgets = budgets.reduce((acc, budget) => {
        if (!acc[budget.category]) {
            acc[budget.category] = [];
        }
        acc[budget.category].push(budget);
        return acc;
    }, {} as Record<string, typeof budgets>);

    const categoryIcons: Record<string, string> = {
        transport: 'directions_car',
        utilities: 'payments',
        socializing: 'celebration',
        housing: 'home',
        groceries: 'shopping_cart',
        leisure: 'attractions',
        default: 'label'
    };

    const getIconForCategory = (categoryId: string) => {
        const catName = categoryNameMap[categoryId]?.toLowerCase() || '';
        // Find if any key in categoryIcons is contained in the name (e.g. 'leisure & lifestyle' -> 'leisure')
        for (const [key, icon] of Object.entries(categoryIcons)) {
            if (key !== 'default' && catName.includes(key)) {
                return icon;
            }
        }
        return categoryIcons.default;
    };

    return (
        <AppLayout
            header={
                <div className="flex flex-col w-full">
                    <Header
                        title="The Chaser"
                        subtitle="Monthly Budget"
                        leftElement={
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Icon name="pie_chart" className="text-2xl" />
                            </div>
                        }
                        rightElement={
                            <MainHeaderActions showSaveButton />
                        }
                    />
                    <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 pb-4">
                        <div className="flex h-11 items-center justify-center rounded-xl bg-slate-200 dark:bg-border-dark p-1">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`flex-1 flex items-center justify-center rounded-lg py-1.5 text-sm transition-colors ${viewMode === 'monthly'
                                    ? 'bg-white dark:bg-background-dark shadow-sm text-slate-900 dark:text-white font-semibold'
                                    : 'text-slate-500 dark:text-slate-400 font-medium'
                                    }`}
                            >
                                Monthly View
                            </button>
                            <button
                                onClick={() => setViewMode('annual')}
                                className={`flex-1 flex items-center justify-center rounded-lg py-1.5 text-sm transition-colors ${viewMode === 'annual'
                                    ? 'bg-white dark:bg-background-dark shadow-sm text-slate-900 dark:text-white font-semibold'
                                    : 'text-slate-500 dark:text-slate-400 font-medium'
                                    }`}
                            >
                                Annual View
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-8 px-4 py-6 pb-24">
                <button
                    onClick={() => navigate('/budgets/add')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-xl shadow-[0_4px_14px_0_rgba(255,184,80,0.39)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    <Icon name="add" className="text-xl" />
                    <span>Add Budget</span>
                </button>

                {Object.entries(groupedBudgets).map(([category, categoryBudgets]) => (
                    <section key={category} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-primary flex items-center gap-2 capitalize">
                                <Icon name={getIconForCategory(category)} className="text-xl" />
                                {categoryNameMap[category] || category}
                            </h2>
                            <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">
                                {categoryBudgets.length} {categoryBudgets.length === 1 ? 'Item' : 'Items'}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {categoryBudgets.map(budget => {
                                const isAnnual = budget.frequency === 'annual';
                                const monthlyAmount = isAnnual ? budget.amount / 12 : budget.amount;
                                const annualAmount = isAnnual ? budget.amount : budget.amount * 12;

                                const budgetTransactions = transactions.filter(t => t.budgetId === budget.id && t.type === 'expense');

                                let actualAmount = 0;
                                if (viewMode === 'monthly') {
                                    const now = new Date();
                                    const currentMonth = now.getMonth();
                                    const currentYear = now.getFullYear();
                                    actualAmount = budgetTransactions
                                        .filter(t => {
                                            const d = new Date(t.date);
                                            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                                        })
                                        .reduce((sum, t) => sum + t.amount, 0);
                                } else {
                                    const currentYear = new Date().getFullYear();
                                    actualAmount = budgetTransactions
                                        .filter(t => new Date(t.date).getFullYear() === currentYear)
                                        .reduce((sum, t) => sum + t.amount, 0);
                                }

                                const targetNum = viewMode === 'annual' ? annualAmount : monthlyAmount;
                                const ratio = targetNum > 0 ? actualAmount / targetNum : 0;
                                const percent = Math.min(ratio * 100, 100);

                                let status = 'ON TRACK';
                                let barColor = 'bg-blue-500';
                                let chipClass = 'bg-blue-500/10 text-blue-500';

                                if (ratio >= 1) {
                                    status = 'OVERSPENT';
                                    barColor = 'bg-red-500';
                                    chipClass = 'bg-red-500/10 text-red-500';
                                } else if (ratio >= 0.90) {
                                    status = 'OVERSPEND RISK';
                                    barColor = 'bg-orange-500';
                                    chipClass = 'bg-orange-500/10 text-orange-500';
                                } else if (ratio <= 0.75) {
                                    status = 'PLENTY OF CAPACITY';
                                    barColor = 'bg-emerald-500';
                                    chipClass = 'bg-emerald-500/10 text-emerald-500';
                                }

                                return (
                                    <div key={budget.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1 w-full">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{budget.name}</p>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${chipClass}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Location: <span className="text-slate-700 dark:text-slate-300 capitalize">{budget.paymentSource}</span></p>
                                                <div className="flex gap-4 mt-2">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{isAnnual ? 'As Monthly' : 'Monthly'}</p>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">£{monthlyAmount.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{isAnnual ? 'Annual' : 'Annualised'}</p>
                                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">£{annualAmount.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 ml-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0" onClick={() => navigate(`/budgets/edit/${budget.id}`)}>
                                                <Icon name="edit" className="text-[18px] text-slate-500 dark:text-slate-400" />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{viewMode === 'annual' ? 'Annualised Actual' : 'Monthly Actual'}</span>
                                                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">£{actualAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    Target: £{targetNum.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${barColor}`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}

                {budgets.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="account_balance_wallet" className="text-3xl text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No Budgets Yet</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Add your first budget item to start tracking your expenses.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
