import { AppLayout } from '@/components/layout/AppLayout';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { DateInput } from '@/components/ui/DateInput';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/db';
import { getTaxYearOrLatest } from '@/constants/taxConstants';
import { decryptData, mergeData } from '@/services/remoteSyncService';

export function SimplifiedAppSetupPage() {
    const navigate = useNavigate();
    const { setProfile, initStore } = useStore();
    const [partner1Name, setPartner1Name] = useState('');
    const [partner1Dob, setPartner1Dob] = useState('');
    const [partner2Name, setPartner2Name] = useState('');
    const [partner2Dob, setPartner2Dob] = useState('');
    const [syncServerUrl, setSyncServerUrl] = useState('');
    const [syncPassphrase, setSyncPassphrase] = useState('');
    const [syncHeaderKey, setSyncHeaderKey] = useState('');

    // For the Restore section
    const [restoreSyncServerUrl, setRestoreSyncServerUrl] = useState('');
    const [restoreSyncPassphrase, setRestoreSyncPassphrase] = useState('');
    const [restoreSyncHeaderKey, setRestoreSyncHeaderKey] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreError, setRestoreError] = useState<string | null>(null);

    const handleGetStarted = async () => {
        if (!partner1Name.trim()) return; // Require at least one name

        await setProfile({
            id: 'default',
            name: `${partner1Name.trim()} & ${partner2Name.trim() || 'Partner'}`,
            partner1Name: partner1Name.trim(),
            partner1Dob: partner1Dob ? new Date(partner1Dob).getTime() : undefined,
            partner2Name: partner2Name.trim() || undefined,
            partner2Dob: partner2Dob ? new Date(partner2Dob).getTime() : undefined,
            createdAt: Date.now()
        });

        const existingSettings = await db.settings.get('default');

        await db.settings.put({
            id: 'default',
            currency: existingSettings?.currency || 'GBP',
            taxYear: existingSettings?.taxYear || getTaxYearOrLatest(),
            icloudSync: existingSettings?.icloudSync || false,
            syncServerUrl: syncServerUrl.trim() || undefined,
            syncPassphrase: syncPassphrase.trim() || undefined,
            syncHeaderKey: syncHeaderKey.trim() || undefined,
            defaultGrowthRate: existingSettings?.defaultGrowthRate ?? 1.75,
            updatedAt: Date.now()
        });

        navigate('/');
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        setRestoreError(null);
        try {
            const customHeaders: Record<string, string> = {};
            if (restoreSyncHeaderKey.trim()) {
                customHeaders['x-chaser-token'] = restoreSyncHeaderKey.trim();
            }

            const response = await fetch(restoreSyncServerUrl.trim(), { headers: customHeaders });
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            if (buffer.byteLength === 0) {
                throw new Error('Remote sync data is empty.');
            }

            const decryptedData = await decryptData(buffer, restoreSyncPassphrase.trim());

            await mergeData(decryptedData);

            const existingSettings = await db.settings.get('default');

            await db.settings.put({
                id: 'default',
                currency: existingSettings?.currency || 'GBP',
                taxYear: existingSettings?.taxYear || getTaxYearOrLatest(),
                icloudSync: existingSettings?.icloudSync || false,
                syncServerUrl: restoreSyncServerUrl.trim() || undefined,
                syncPassphrase: restoreSyncPassphrase.trim() || undefined,
                syncHeaderKey: restoreSyncHeaderKey.trim() || undefined,
                defaultGrowthRate: existingSettings?.defaultGrowthRate ?? 1.75,
                lastSynced: Date.now(),
                updatedAt: Date.now()
            });

            await initStore();
            navigate('/');
        } catch (error) {
            console.error("Restore failed:", error);
            setRestoreError(error instanceof Error ? error.message : "An unknown error occurred during restore.");
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <AppLayout hideBottomNav={true}>
            <div className="relative flex flex-col items-center">
                {/* Header */}
                <div className="w-full flex items-center p-4 justify-between sticky top-0 z-10 border-b border-primary/10">
                    <div className="text-primary flex size-12 shrink-0 items-center justify-start">
                        <Icon name="account_balance_wallet" className="text-3xl" />
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
                        The Chaser
                    </h2>
                </div>

                <div className="w-full mx-auto px-6 py-8 flex flex-col gap-8">
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center mb-6">
                            <Icon name="rocket_launch" className="text-primary text-5xl" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Welcome to The Chaser
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-base">
                            Let&apos;s get your financial tracking configured to start chasing your goals.
                        </p>
                    </div>

                    {/* Start New Setup Section */}
                    <section className="bg-primary/5 dark:bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <Icon name="person_add" className="text-primary" />
                            <h3 className="font-bold text-lg">Start New Setup</h3>
                        </div>

                        <div className="space-y-5">
                            {/* Partner 1 */}
                            <div className="space-y-3">
                                <label htmlFor="partner1Name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Partner 1 Name{' '}
                                    <Icon
                                        name="info"
                                        className="text-[14px] align-middle ml-1 text-slate-400 cursor-help"
                                        title="Used to calculate your £500 or £1,000 tax-free savings allowance."
                                    />
                                </label>
                                <input
                                    id="partner1Name"
                                    type="text"
                                    placeholder="e.g. Alex"
                                    value={partner1Name}
                                    onChange={(e) => setPartner1Name(e.target.value)}
                                    className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            {/* Partner 1 DOB */}
                            <div className="space-y-3 pt-2">
                                <label htmlFor="partner1Dob" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Partner 1 Date of Birth (Optional)
                                </label>
                                <DateInput
                                    id="partner1Dob"
                                    value={partner1Dob}
                                    onChange={(e) => setPartner1Dob(e.target.value)}
                                    className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            {/* Partner 2 */}
                            <div className="space-y-3 pt-2 border-t border-primary/10">
                                <label htmlFor="partner2Name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Partner 2 Name{' '}
                                    <Icon
                                        name="info"
                                        className="text-[14px] align-middle ml-1 text-slate-400 cursor-help"
                                        title="Used to calculate your £500 or £1,000 tax-free savings allowance."
                                    />
                                </label>
                                <input
                                    id="partner2Name"
                                    type="text"
                                    placeholder="e.g. Sam"
                                    value={partner2Name}
                                    onChange={(e) => setPartner2Name(e.target.value)}
                                    className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            {/* Partner 2 DOB */}
                            <div className="space-y-3 pt-2">
                                <label htmlFor="partner2Dob" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Partner 2 Date of Birth (Optional)
                                </label>
                                <DateInput
                                    id="partner2Dob"
                                    value={partner2Dob}
                                    onChange={(e) => setPartner2Dob(e.target.value)}
                                    className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            {/* Advanced / Remote Sync */}
                            <div className="pt-2 border-t border-primary/10">
                                <span className="block mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Advanced / Remote Sync (Optional)
                                </span>

                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Sync Server URL
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. https://sync.yourdomain.xyz/sync"
                                            value={syncServerUrl}
                                            onChange={(e) => setSyncServerUrl(e.target.value)}
                                            className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Header Key
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. my-secret-token"
                                            value={syncHeaderKey}
                                            onChange={(e) => setSyncHeaderKey(e.target.value)}
                                            className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Encryption Passphrase
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. four random words"
                                            value={syncPassphrase}
                                            onChange={(e) => setSyncPassphrase(e.target.value)}
                                            className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleGetStarted}
                                disabled={!partner1Name.trim()}
                                className="w-full bg-primary hover:bg-primary/90 text-background-dark font-extrabold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 text-base h-auto"
                            >
                                Get Started
                                <Icon name="arrow_forward" className="font-bold" />
                            </Button>
                        </div>
                    </section>

                    {/* Divider */}
                    <div className="relative flex items-center mt-2 mb-2">
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium">
                            OR
                        </span>
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    </div>

                    {/* Restore from Remote Server Section */}
                    <section className="space-y-4">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <h3 className="font-bold text-lg">Restore from Remote Server</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 px-4">
                                Already have a setup? Connect to your sync server to restore your names, accounts, and full history instantly.
                            </p>
                        </div>

                        <div className="bg-primary/5 dark:bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-5 transition-all">
                            {restoreError && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
                                    {restoreError}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Sync Server URL
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. https://sync.yourdomain.xyz/sync"
                                        value={restoreSyncServerUrl}
                                        onChange={(e) => setRestoreSyncServerUrl(e.target.value)}
                                        className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Encryption Passphrase
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. four random words"
                                        value={restoreSyncPassphrase}
                                        onChange={(e) => setRestoreSyncPassphrase(e.target.value)}
                                        className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Header Key
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. my-secret-token"
                                        value={restoreSyncHeaderKey}
                                        onChange={(e) => setRestoreSyncHeaderKey(e.target.value)}
                                        className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleRestore}
                                disabled={!restoreSyncServerUrl.trim() || !restoreSyncPassphrase.trim() || isRestoring}
                                className="w-full bg-primary hover:bg-primary/90 text-background-dark font-extrabold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 text-base h-auto"
                            >
                                {isRestoring ? 'Restoring...' : 'Remote Load'}
                                <Icon name="cloud_download" className="font-bold" />
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
