import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/lib/db';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import AssetBurndownChart from '../components/scenarios/AssetBurndownChart';
import { FinancialImpactCard } from '../components/scenarios/FinancialImpactCard';
import { useLifetimeProjection } from '../hooks/useLifetimeProjection';
import type { DrawdownStrategy } from '../utils/projectionEngine';
import { cn } from '@/lib/utils';

export function AssetBurndownPage() {
    const [strategy, setStrategy] = useState<DrawdownStrategy>('taxable_first');
    const { data, isReady, protectionFloor, settingsId } = useLifetimeProjection(strategy);

    const firstPoint = isReady && data.length > 0 ? data[0] : null;
    const lastPoint = isReady && data.length > 0 ? data[data.length - 1] : null;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);

    const strategies: { id: DrawdownStrategy; label: string; icon: string }[] = [
        { id: 'taxable_first', label: 'Taxable First', icon: 'account_balance' },
        { id: 'tax_free_first', label: 'Tax-Free First', icon: 'savings' },
        { id: 'pensions_first', label: 'Pensions First', icon: 'history_edu' },
        { id: 'proportional', label: 'Proportional', icon: 'balance' },
    ];

    return (
        <AppLayout
            header={
                <Header
                    title="Asset Burndown"
                    subtitle="Drawdown Strategy Optimization"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="bar_chart" className="text-2xl" />
                        </div>
                    }
                    rightElement={
                        <Link
                            to="/milestones"
                            className="flex items-center gap-2 bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl transition-colors font-semibold text-sm border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                            <Icon name="flag" className="text-lg text-primary" />
                            <span>Milestones</span>
                        </Link>
                    }
                />
            }
        >
            <div className="mx-auto p-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Strategy Selector */}
                        <div className="bg-white dark:bg-slate-900/50 p-1.5 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-wrap gap-1">
                            {strategies.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStrategy(s.id)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                                        strategy === s.id
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Icon name={s.icon} className="text-lg" />
                                    <span className="hidden sm:inline">{s.label}</span>
                                    <span className="sm:hidden">{s.label.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>

                        {/* Simulation Configuration */}
                        <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon name="settings" className="text-primary text-lg" />
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Simulation Config</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="protectionFloor" className="text-[10px] font-bold text-slate-500 dark:text-primary/60 uppercase ml-1">
                                        Cash & ISA Protection Floor (£)
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <Icon name="account_balance_wallet" className="text-lg" />
                                        </div>
                                        <input
                                            id="protectionFloor"
                                            type="number"
                                            value={protectionFloor ?? ''}
                                            onChange={(e) => {
                                                if (settingsId) {
                                                    db.settings.update(settingsId, { protectionFloor: Number(e.target.value) || 0 });
                                                }
                                            }}
                                            placeholder="e.g. 20000"
                                            className="w-full bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-lg pl-10 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                        Minimum combined balance to keep in taxable and tax-free (ISA) accounts before drawing from pensions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40">Burndown Analysis</h2>
                            </div>
                            <AssetBurndownChart drawdownStrategy={strategy} />
                        </div>

                        {/* Strategy Description */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <div className="flex gap-3">
                                <Icon name="info" className="text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                    {strategy === 'taxable_first' && "Withdraws from taxable accounts first, preserving tax-free and pension growth as long as possible."}
                                    {strategy === 'tax_free_first' && "Uses ISAs and other tax-free assets first. Generally less efficient for long-term tax planning."}
                                    {strategy === 'pensions_first' && "Draws from pension pots first. Useful if you expect higher tax rates in later life."}
                                    {strategy === 'proportional' && "Withdraws from all pots relative to their current size, maintaining the same asset allocation over time."}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40">Terminal Pot Values</h2>
                        </div>

                        <FinancialImpactCard
                            title="Taxable Assets"
                            icon="account_balance"
                            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                            iconColor="text-indigo-600 dark:text-indigo-400"
                            badgeText="Terminal"
                            badgeTrend={lastPoint && lastPoint.potBalances.taxable > (firstPoint?.potBalances.taxable || 0) ? 'up' : 'down'}
                            currentValue={formatCurrency(firstPoint?.potBalances.taxable || 0)}
                            projectedValue={formatCurrency(lastPoint?.potBalances.taxable || 0)}
                        />

                        <FinancialImpactCard
                            title="Tax-Free Assets"
                            icon="savings"
                            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                            iconColor="text-emerald-600 dark:text-emerald-400"
                            badgeText="Terminal"
                            badgeTrend={lastPoint && lastPoint.potBalances.taxFree > (firstPoint?.potBalances.taxFree || 0) ? 'up' : 'down'}
                            currentValue={formatCurrency(firstPoint?.potBalances.taxFree || 0)}
                            projectedValue={formatCurrency(lastPoint?.potBalances.taxFree || 0)}
                        />

                        <FinancialImpactCard
                            title="Pension Assets"
                            icon="history_edu"
                            iconBg="bg-amber-100 dark:bg-amber-900/30"
                            iconColor="text-amber-600 dark:text-amber-400"
                            badgeText="Terminal"
                            badgeTrend={lastPoint && lastPoint.potBalances.pensions > (firstPoint?.potBalances.pensions || 0) ? 'up' : 'down'}
                            currentValue={formatCurrency(firstPoint?.potBalances.pensions || 0)}
                            projectedValue={formatCurrency(lastPoint?.potBalances.pensions || 0)}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
