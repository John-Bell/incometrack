import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { MonthlyCloseOut } from '../components/settings/MonthlyCloseOut';
import { HistoryLogItem } from '../components/settings/HistoryLogItem';
import { archiveCurrentMonth } from '@/services/archiveService';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';

export function SettingsPage() {
    const navigate = useNavigate();

    const settings = useLiveQuery(() => db.settings.toArray());
    const taxRules = useLiveQuery(() => db.taxRules.toArray());

    const currentSettings = settings?.[0];

    const [isSaving, setIsSaving] = useState(false);
    const [remoteSync, setRemoteSync] = useState(false);

    useEffect(() => {
        if (currentSettings) {
            setRemoteSync(currentSettings.icloudSync || false);
        }
    }, [currentSettings]);

    const handleTaxYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (currentSettings) {
            await db.settings.update(currentSettings.id, { taxYear: e.target.value });
        }
    };

    const handleSave = async () => {
        if (currentSettings) {
            setIsSaving(true);
            try {
                await db.settings.update(currentSettings.id, {
                    icloudSync: remoteSync,
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            } finally {
                setIsSaving(false);
            }
        }
    };

    const formatLastSynced = (timestamp?: number) => {
        if (!timestamp) return 'Never';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(new Date(timestamp));
    };

    return (
        <AppLayout
            header={
                <Header
                    title="Settings"
                    leftElement={
                        <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center cursor-pointer">
                            <Icon name="arrow_back" className="text-primary text-2xl" />
                        </button>
                    }
                    rightElement={<MainHeaderActions onSave={handleSave} isSaving={isSaving} />}
                    className="bg-transparent backdrop-blur-md"
                />
            }
        >
            <div className="flex-1 w-full mx-auto pb-8">
                <section className="mt-6 px-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60 mb-3 px-1">Remote Sync</h2>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                                    <Icon name="cloud_sync" />
                                </div>
                                <div>
                                    <p className="font-semibold">Save to Remote</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Last Synced: {formatLastSynced(currentSettings?.lastSynced)}</p>
                                </div>
                            </div>
                            <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-300 dark:bg-primary/20 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary">
                                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                                <input
                                    type="checkbox"
                                    checked={remoteSync}
                                    onChange={(e) => setRemoteSync(e.target.checked)}
                                    className="invisible absolute"
                                />
                            </label>
                        </div>
                    </div>
                </section>

                <section className="mt-8 px-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60 mb-3 px-1">Data Management</h2>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 rounded-xl divide-y divide-slate-100 dark:divide-primary/5">
                        <Link to="/settings/import/accounts" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-primary/80">
                                    <Icon name="account_balance" />
                                </div>
                                <p className="font-medium">Import Accounts</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                <Icon name="chevron_right" className="text-sm" />
                            </div>
                        </Link>

                        <Link to="/settings/import/budgets" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-primary/80">
                                    <Icon name="account_balance_wallet" />
                                </div>
                                <p className="font-medium">Import Budgets</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                <Icon name="chevron_right" className="text-sm" />
                            </div>
                        </Link>

                        <Link to="/settings/import/transactions" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-primary/80">
                                    <Icon name="receipt_long" />
                                </div>
                                <p className="font-medium">Import Transactions</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                <Icon name="chevron_right" className="text-sm" />
                            </div>
                        </Link>
                    </div>
                </section>

                <section className="mt-8 px-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60 mb-3 px-1">Monthly Close-Out</h2>
                    <MonthlyCloseOut
                        description="Archives current balances and interest rates to history and prepares the ledger for the new month. This action is final."
                        monthString="October 2025"
                        onArchive={() => archiveCurrentMonth()}
                    />
                </section>

                <section className="mt-8 px-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60 mb-3 px-1">General Settings</h2>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 rounded-xl divide-y divide-slate-100 dark:divide-primary/5">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-primary/80">
                                    <Icon name="payments" />
                                </div>
                                <p className="font-medium">Currency</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <span>GBP (£)</span>
                                <Icon name="chevron_right" className="text-sm" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-primary/80">
                                    <Icon name="calendar_today" />
                                </div>
                                <p className="font-medium">Tax Year</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <select
                                    className="bg-transparent text-right text-primary font-semibold appearance-none outline-none cursor-pointer pr-4"
                                    value={currentSettings?.taxYear || ''}
                                    onChange={handleTaxYearChange}
                                >
                                    {taxRules?.map((rule) => (
                                        <option key={rule.id} value={rule.id} className="text-slate-900">
                                            {rule.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-8 px-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60">History Log</h2>
                        <button className="text-xs font-bold text-primary hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        <HistoryLogItem month="September 2025" closedDate="Sep 30, 2025" totalInterest="£1,280.42" />
                        <HistoryLogItem month="August 2025" closedDate="Aug 31, 2025" totalInterest="£1,142.10" />
                        <HistoryLogItem month="July 2025" closedDate="Jul 31, 2025" totalInterest="£988.50" />
                    </div>
                </section>

                <section className="mt-12 px-4 mb-8">
                    <div className="border-t border-slate-200 dark:border-red-900/30 pt-6">
                        <button className="w-full text-red-500 dark:text-red-400 font-semibold py-3 border border-red-500/20 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors">
                            Reset App Data
                        </button>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
