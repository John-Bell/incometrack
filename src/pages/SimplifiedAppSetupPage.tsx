import { AppLayout } from '@/components/layout/AppLayout';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/db';
import { getDefaultTaxYear } from '@/constants/taxConstants';

export function SimplifiedAppSetupPage() {
    const navigate = useNavigate();
    const { setProfile } = useStore();
    const [partner1Name, setPartner1Name] = useState('');
    const [partner2Name, setPartner2Name] = useState('');
    const [syncServerUrl, setSyncServerUrl] = useState('');
    const [syncPassphrase, setSyncPassphrase] = useState('');
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

    // For the Restore section
    const [restoreSyncServerUrl, setRestoreSyncServerUrl] = useState('');
    const [restoreSyncPassphrase, setRestoreSyncPassphrase] = useState('');

    const handleGetStarted = async () => {
        if (!partner1Name.trim()) return; // Require at least one name

        await setProfile({
            id: 'default',
            name: `${partner1Name.trim()} & ${partner2Name.trim() || 'Partner'}`,
            partner1Name: partner1Name.trim(),
            partner2Name: partner2Name.trim() || undefined,
            createdAt: Date.now()
        });

        const existingSettings = await db.settings.get('default');

        await db.settings.put({
            id: 'default',
            currency: existingSettings?.currency || 'GBP',
            taxYear: existingSettings?.taxYear || getDefaultTaxYear(),
            icloudSync: existingSettings?.icloudSync || false,
            syncServerUrl: syncServerUrl.trim() || undefined,
            syncPassphrase: syncPassphrase.trim() || undefined,
            updatedAt: Date.now()
        });

        navigate('/');
    };

    const handleRestore = async () => {
        // Empty fetch/restore logic for now
        console.log("Fetching and Restoring backup from:", restoreSyncServerUrl);
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
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Partner 1 Name{' '}
                                    <Icon
                                        name="info"
                                        className="text-[14px] align-middle ml-1 text-slate-400 cursor-help"
                                        title="Used to calculate your £500 or £1,000 tax-free savings allowance."
                                    />
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Alex"
                                    value={partner1Name}
                                    onChange={(e) => setPartner1Name(e.target.value)}
                                    className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            {/* Partner 2 */}
                            <div className="space-y-3 pt-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Partner 2 Name{' '}
                                    <Icon
                                        name="info"
                                        className="text-[14px] align-middle ml-1 text-slate-400 cursor-help"
                                        title="Used to calculate your £500 or £1,000 tax-free savings allowance."
                                    />
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sam"
                                    value={partner2Name}
                                    onChange={(e) => setPartner2Name(e.target.value)}
                                    className="w-full bg-white dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            {/* Advanced / Remote Sync Accordion */}
                            <div className="pt-2 border-t border-primary/10">
                                <button
                                    type="button"
                                    onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                                    className="flex items-center justify-between w-full text-left focus:outline-none group cursor-pointer"
                                >
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                                        Advanced / Remote Sync (Optional)
                                    </span>
                                    <Icon
                                        name={isAdvancedExpanded ? "expand_less" : "expand_more"}
                                        className="text-slate-400 group-hover:text-primary transition-colors"
                                    />
                                </button>

                                {isAdvancedExpanded && (
                                    <div className="mt-4 space-y-4">
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
                                )}
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

                        <div className="bg-slate-100 dark:bg-[#111816] border-2 border-primary/30 rounded-xl p-6 space-y-5 transition-all">
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
                            <Button
                                onClick={handleRestore}
                                disabled={!restoreSyncServerUrl.trim() || !restoreSyncPassphrase.trim()}
                                className="w-full bg-primary hover:bg-primary/90 text-background-dark font-extrabold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 text-base h-auto"
                            >
                                Fetch & Restore Backup
                                <Icon name="cloud_download" className="font-bold" />
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
