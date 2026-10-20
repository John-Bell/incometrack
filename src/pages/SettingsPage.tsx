import { useSettings } from '@/hooks/useSettings';
import { formatLastSynced } from '@/utils/settingsUtils';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { DateInput } from '@/components/ui/DateInput';

export function SettingsPage() {
    const {
        navigate,
        currentSettings,
        taxRules,
        isSaving,
        remoteSync,
        setRemoteSync,
        defaultGrowthRate,
        setDefaultGrowthRate,
        partner1Name,
        setPartner1Name,
        partner1Dob,
        setPartner1Dob,
        partner2Name,
        setPartner2Name,
        partner2Dob,
        setPartner2Dob,
        handleTaxYearChange,
        handleSave,
        handleResetAppData,
    } = useSettings();

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
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60 mb-3 px-1">Profile</h2>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 rounded-xl divide-y divide-slate-100 dark:divide-primary/5 p-4 space-y-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="partner1Name" className="text-xs font-bold text-slate-500 dark:text-primary/60 uppercase">Partner 1 Name</label>
                                    <input
                                        id="partner1Name"
                                        type="text"
                                        value={partner1Name}
                                        onChange={(e) => setPartner1Name(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="partner1Dob" className="text-xs font-bold text-slate-500 dark:text-primary/60 uppercase">Partner 1 DOB</label>
                                    <DateInput
                                        id="partner1Dob"
                                        value={partner1Dob}
                                        onChange={(e) => setPartner1Dob(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="partner2Name" className="text-xs font-bold text-slate-500 dark:text-primary/60 uppercase">Partner 2 Name</label>
                                    <input
                                        id="partner2Name"
                                        type="text"
                                        value={partner2Name}
                                        onChange={(e) => setPartner2Name(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="partner2Dob" className="text-xs font-bold text-slate-500 dark:text-primary/60 uppercase">Partner 2 DOB</label>
                                    <DateInput
                                        id="partner2Dob"
                                        value={partner2Dob}
                                        onChange={(e) => setPartner2Dob(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
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
                                    <Icon name="trending_up" />
                                </div>
                                <p className="font-medium">Default Real Growth Rate (%)</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={defaultGrowthRate}
                                    onChange={(e) => setDefaultGrowthRate(parseFloat(e.target.value) || 0)}
                                    className="w-20 bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30 text-right"
                                />
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

                <section className="mt-12 px-4 mb-8">
                    <div className="border-t border-slate-200 dark:border-red-900/30 pt-6">
                        <button
                            type="button"
                            onClick={handleResetAppData}
                            className="w-full text-red-500 dark:text-red-400 font-semibold py-3 border border-red-500/20 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                            Reset App Data
                        </button>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
