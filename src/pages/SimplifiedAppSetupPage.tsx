import { AppLayout } from '@/components/layout/AppLayout';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { importDatabase } from '@/services/backupService';

export function SimplifiedAppSetupPage() {
    const navigate = useNavigate();
    const { setProfile, initStore } = useStore();
    const [partner1Name, setPartner1Name] = useState('');
    const [partner2Name, setPartner2Name] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleGetStarted = async () => {
        if (!partner1Name.trim()) return; // Require at least one name

        await setProfile({
            id: 'default',
            name: `${partner1Name.trim()} & ${partner2Name.trim() || 'Partner'}`,
            partner1Name: partner1Name.trim(),
            partner2Name: partner2Name.trim() || undefined,
            createdAt: Date.now()
        });

        navigate('/');
    };

    const handleImport = async () => {
        try {
            setIsImporting(true);
            await importDatabase();
            await initStore(); // Refresh the store with imported data
            navigate('/');
        } catch (error) {
            console.error('Failed to import config:', error);
            alert('Failed to import configuration file. Please assure it is a valid backup.');
        } finally {
            setIsImporting(false);
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

                    {/* Load Existing Section */}
                    <section className="space-y-4">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <h3 className="font-bold text-lg">Load Existing Configuration</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 px-4">
                                Already have a setup? Import your config file to restore your names, accounts, and full history instantly.
                            </p>
                        </div>

                        <button
                            onClick={handleImport}
                            disabled={isImporting}
                            className="w-full group bg-slate-100 dark:bg-[#111816] border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 py-8 rounded-xl transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon name={isImporting ? "hourglass_empty" : "cloud_download"} className={`text-primary text-3xl ${isImporting ? 'animate-spin' : ''}`} />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                {isImporting ? 'Importing...' : 'Import Config File'}
                            </span>
                            <span className="text-xs text-slate-500">
                                .json or .chaser files supported
                            </span>
                        </button>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
