import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useStore } from '@/store/useStore';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { DateInput } from '@/components/ui/DateInput';

export function SettingsPage() {
    const navigate = useNavigate();
    const { setTaxYear } = useStore();

    const settings = useLiveQuery(() => db.settings.toArray());
    const taxRules = useLiveQuery(() => db.taxRules.toArray());
    const profiles = useLiveQuery(() => db.profile.toArray());

    const currentSettings = settings?.[0];
    const currentProfile = profiles?.[0];

    const [isSaving, setIsSaving] = useState(false);
    const [remoteSync, setRemoteSync] = useState(false);

    const [partner1Name, setPartner1Name] = useState('');
    const [partner1Dob, setPartner1Dob] = useState('');
    const [partner2Name, setPartner2Name] = useState('');
    const [partner2Dob, setPartner2Dob] = useState('');

    useEffect(() => {
        if (currentSettings) {
            setRemoteSync(currentSettings.icloudSync || false);
        }
    }, [currentSettings]);

    useEffect(() => {
        if (currentProfile) {
            setPartner1Name(currentProfile.partner1Name || '');
            setPartner1Dob(currentProfile.partner1Dob ? new Date(currentProfile.partner1Dob).toISOString().split('T')[0] : '');
            setPartner2Name(currentProfile.partner2Name || '');
            setPartner2Dob(currentProfile.partner2Dob ? new Date(currentProfile.partner2Dob).toISOString().split('T')[0] : '');
        }
    }, [currentProfile]);

    const handleTaxYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (currentSettings) {
            await db.settings.update(currentSettings.id, { taxYear: e.target.value });
            setTaxYear(e.target.value);
        }
    };

    const handleSave = async () => {
        if (currentSettings || currentProfile) {
            setIsSaving(true);
            try {
                if (currentSettings) {
                    await db.settings.update(currentSettings.id, {
                        icloudSync: remoteSync,
                    });
                }

                if (currentProfile) {
                    await db.profile.update(currentProfile.id, {
                        name: `${partner1Name.trim()} & ${partner2Name.trim() || 'Partner'}`,
                        partner1Name: partner1Name.trim(),
                        partner1Dob: partner1Dob ? new Date(partner1Dob).getTime() : undefined,
                        partner2Name: partner2Name.trim() || undefined,
                        partner2Dob: partner2Dob ? new Date(partner2Dob).getTime() : undefined,
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleResetAppData = async () => {
        if (window.confirm('Are you sure you want to permanently delete all app data? This action cannot be undone.')) {
            await Promise.all(db.tables.map(table => table.clear()));
            localStorage.clear();
            const basePath = import.meta.env.BASE_URL;
            window.location.replace(`${basePath}setup`);
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
