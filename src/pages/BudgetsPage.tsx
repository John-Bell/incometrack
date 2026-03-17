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
    const [cardLayout, setCardLayout] = useState<'detailed' | 'compact'>('detailed');

    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

    // Removed budget category grouping, all budgets displayed in one list
    // You could sort them alphabetically if you want, but for now just use the array.
    const sortedBudgets = [...budgets].sort((a, b) => a.name.localeCompare(b.name));

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
                        <div className="mt-4 flex justify-end">
                            <div className="flex bg-[#E8F8EE] dark:bg-[#1A2E22] rounded-xl p-1 shadow-sm border border-slate-200 dark:border-border-dark">
                                <button
                                    onClick={() => setCardLayout('detailed')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        cardLayout === 'detailed'
                                            ? 'bg-white dark:bg-surface-dark text-[#1DAF61] shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Icon name="view_list" className="text-lg" />
                                    Detailed
                                </button>
                                <button
                                    onClick={() => setCardLayout('compact')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        cardLayout === 'compact'
                                            ? 'bg-white dark:bg-surface-dark text-[#1DAF61] shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Icon name="view_headline" className="text-lg" />
                                    Compact
                                </button>
                            </div>
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

                {sortedBudgets.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-primary flex items-center gap-2 capitalize">
                                <Icon name="label" className="text-xl" />
                                All Budgets
                            </h2>
                            <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">
                                {sortedBudgets.length} {sortedBudgets.length === 1 ? 'Item' : 'Items'}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {sortedBudgets.map(budget => {
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

                                const actualRound = Math.round(actualAmount * 100);
                                const targetRound = Math.round(targetNum * 100);

                                let status = 'ON TRACK';
                                let barColor = 'bg-blue-500';
                                let chipClass = 'bg-blue-500/10 text-blue-500';

                                if (actualRound > targetRound) {
                                    status = 'OVERSPENT';
                                    barColor = 'bg-red-500';
                                    chipClass = 'bg-red-500/10 text-red-500';
                                } else if (actualRound === targetRound && targetRound > 0) {
                                    status = 'FULLY SPENT';
                                    barColor = 'bg-orange-500';
                                    chipClass = 'bg-orange-500/10 text-orange-500';
                                } else if (ratio >= 0.90) {
                                    status = 'OVERSPEND RISK';
                                    barColor = 'bg-orange-500';
                                    chipClass = 'bg-orange-500/10 text-orange-500';
                                } else if (ratio <= 0.75) {
                                    status = 'PLENTY OF CAPACITY';
                                    barColor = 'bg-emerald-500';
                                    chipClass = 'bg-emerald-500/10 text-emerald-500';
                                }

                                if (cardLayout === 'compact') {
                                    return (
                                        <div key={budget.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-border-dark flex flex-col gap-3 relative overflow-hidden">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] dark:bg-[#1A2E22] flex items-center justify-center flex-shrink-0">
                                                    <Icon name={budget.icon || "label"} className="text-[#1DAF61] text-xl" />
                                                </div>
                                                <div className="flex-1 flex flex-col min-w-0">
                                                    <div className="flex justify-between items-center w-full">
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{budget.name}</h3>
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5 mt-0.5">
                                                        <span>Monthly: £{monthlyAmount.toFixed(2)}</span>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <span>Annual: £{annualAmount.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end mt-1">
                                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                    £{actualAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/budgets/edit/${budget.id}`)}
                                                    className="w-8 h-8 rounded-full bg-[#1DAF61] flex items-center justify-center cursor-pointer hover:bg-[#189653] transition-colors"
                                                >
                                                    <Icon name="edit" className="text-white text-sm" />
                                                </button>
                                            </div>

                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                                <div
                                                    className={`h-full rounded-full ${barColor}`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={budget.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1 w-full">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <Icon name={budget.icon || "label"} className="text-[#1DAF61] text-lg" />
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{budget.name}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${chipClass}`}>
                                                        {status}
                                                    </span>
                                                </div>
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
                )}

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
