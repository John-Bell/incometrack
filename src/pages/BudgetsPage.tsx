import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';

export function BudgetsPage() {
    const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');

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
                            <MainHeaderActions onSave={() => { }} />
                        }
                    />
                    <div className="px-4 pb-4">
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
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                            <Icon name="directions_car" className="text-xl" />
                            Cars
                        </h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">5 Items</span>
                    </div>
                    <div className="space-y-3">
                        {/* Subcategory Item */}
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Petrol</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Paid from: <span className="text-slate-700 dark:text-slate-300">Monthly Account</span></p>
                                    <div className="flex gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Monthly</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">£120.00</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Annualised</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">£1,440.00</p>
                                        </div>
                                    </div>
                                </div>
                                <Icon name="more_vert" className="text-slate-300 dark:text-slate-600 cursor-pointer" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Car Insurance</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Paid from: <span className="text-slate-700 dark:text-slate-300">Annual Account</span></p>
                                    <div className="flex gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Monthly</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">£45.00</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Annualised</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">£540.00</p>
                                        </div>
                                    </div>
                                </div>
                                <Icon name="more_vert" className="text-slate-300 dark:text-slate-600 cursor-pointer" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Car Tax</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Paid from: <span className="text-slate-700 dark:text-slate-300">Annual Account</span></p>
                                    <div className="flex gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Monthly</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">£15.00</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Annualised</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">£180.00</p>
                                        </div>
                                    </div>
                                </div>
                                <Icon name="more_vert" className="text-slate-300 dark:text-slate-600 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </section>
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                            <Icon name="payments" className="text-xl" />
                            Utilities
                        </h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">3 Items</span>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Electricity &amp; Gas</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Paid from: <span className="text-slate-700 dark:text-slate-300">Monthly Account</span></p>
                                    <div className="flex gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Monthly</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">£185.00</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Annualised</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">£2,220.00</p>
                                        </div>
                                    </div>
                                </div>
                                <Icon name="more_vert" className="text-slate-300 dark:text-slate-600 cursor-pointer" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Water</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Paid from: <span className="text-slate-700 dark:text-slate-300">Monthly Account</span></p>
                                    <div className="flex gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Monthly</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">£32.00</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Annualised</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">£384.00</p>
                                        </div>
                                    </div>
                                </div>
                                <Icon name="more_vert" className="text-slate-300 dark:text-slate-600 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </section>
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                            <Icon name="celebration" className="text-xl" />
                            Socializing
                        </h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">2 Items</span>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Eating Out</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Paid from: <span className="text-slate-700 dark:text-slate-300">Monthly Account</span></p>
                                    <div className="flex gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Monthly</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">£150.00</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Annualised</p>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">£1,800.00</p>
                                        </div>
                                    </div>
                                </div>
                                <Icon name="more_vert" className="text-slate-300 dark:text-slate-600 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
