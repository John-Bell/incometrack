import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { encryptData, decryptData, mergeData } from '@/services/remoteSyncService';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export function RemoteSyncingPage() {
    const navigate = useNavigate();
    const { initStore } = useStore();
    const settings = useLiveQuery(() => db.settings.toArray());
    const currentSettings = settings?.[0];

    const [syncServerUrl, setSyncServerUrl] = useState('');
    const [syncPassphrase, setSyncPassphrase] = useState('');
    const [syncHeaderKey, setSyncHeaderKey] = useState('');

    const [isUpdating, setIsUpdating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const hasChanges =
        syncServerUrl.trim() !== (currentSettings?.syncServerUrl || '') ||
        syncPassphrase.trim() !== (currentSettings?.syncPassphrase || '') ||
        syncHeaderKey.trim() !== (currentSettings?.syncHeaderKey || '');

    useEffect(() => {
        if (currentSettings) {
            setSyncServerUrl(currentSettings.syncServerUrl || '');
            setSyncPassphrase(currentSettings.syncPassphrase || '');
            setSyncHeaderKey(currentSettings.syncHeaderKey || '');
        }
    }, [currentSettings]);

    const handleUpdate = async () => {
        if (!currentSettings) return;
        setIsUpdating(true);
        setStatusMessage(null);
        try {
            await db.settings.update(currentSettings.id, {
                syncServerUrl: syncServerUrl.trim() || undefined,
                syncPassphrase: syncPassphrase.trim() || undefined,
                syncHeaderKey: syncHeaderKey.trim() || undefined,
            });
            setStatusMessage({ type: 'success', text: 'Settings updated successfully.' });
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const getHeaders = () => {
        const headers: Record<string, string> = {};
        if (syncHeaderKey.trim()) {
            headers['x-chaser-token'] = syncHeaderKey.trim();
        }
        return headers;
    };

    const handleLoadFromRemote = async () => {
        if (!syncServerUrl.trim() || !syncPassphrase.trim()) {
            setStatusMessage({ type: 'error', text: 'Server URL and Encryption Passphrase are required.' });
            return;
        }

        setIsProcessing(true);
        setStatusMessage(null);
        try {
            const response = await fetch(syncServerUrl.trim(), { headers: getHeaders() });
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            if (buffer.byteLength === 0) {
                throw new Error('Remote sync data is empty.');
            }

            const decryptedData = await decryptData(buffer, syncPassphrase.trim());
            await mergeData(decryptedData);

            // Update lastSynced locally
            if (currentSettings) {
                await db.settings.update(currentSettings.id, {
                    lastSynced: Date.now()
                });
            }

            await initStore();
            setStatusMessage({ type: 'success', text: 'Data loaded from remote successfully.' });
        } catch (error) {
            console.error("Load from remote failed:", error);
            setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : "An unknown error occurred during load." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveToRemote = async () => {
        if (!syncServerUrl.trim() || !syncPassphrase.trim()) {
            setStatusMessage({ type: 'error', text: 'Server URL and Encryption Passphrase are required.' });
            return;
        }

        setIsProcessing(true);
        setStatusMessage(null);
        try {
            // Extract full database
            const allData: Record<string, any[]> = {
                profile: await db.profile.toArray(),
                accounts: await db.accounts.toArray(),
                incomes: await db.incomes.toArray(),
                scenarios: await db.scenarios.toArray(),
                settings: await db.settings.toArray(),
                monthlyArchives: await db.monthlyArchives.toArray(),
                notifications: await db.notifications.toArray(),
                taxRules: await db.taxRules.toArray(),
                transactions: await db.transactions.toArray(),
                budgets: await db.budgets.toArray(),
            };

            // Encrypt
            const encryptedBlob = await encryptData(allData, syncPassphrase.trim());

            // Push
            const response = await fetch(syncServerUrl.trim(), {
                method: 'POST',
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'application/octet-stream',
                },
                body: encryptedBlob,
            });

            if (!response.ok) {
                throw new Error(`Failed to push data: ${response.status} ${response.statusText}`);
            }

            // Update lastSynced locally
            if (currentSettings) {
                await db.settings.update(currentSettings.id, {
                    lastSynced: Date.now()
                });
            }

            setStatusMessage({ type: 'success', text: 'Data saved to remote successfully.' });
        } catch (error) {
            console.error("Save to remote failed:", error);
            setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : "An unknown error occurred during save." });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AppLayout
            header={
                <Header
                    title="Remote Syncing"
                    leftElement={
                        <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center cursor-pointer">
                            <Icon name="arrow_back" className="text-primary text-2xl" />
                        </button>
                    }
                    className="bg-transparent backdrop-blur-md"
                />
            }
        >
            <div className="flex-1 w-full mx-auto pb-8 px-4 mt-6">

                {statusMessage && (
                    <div className={`p-4 mb-6 rounded-lg text-sm border ${
                        statusMessage.type === 'success'
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    }`}>
                        {statusMessage.text}
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 rounded-xl p-6 space-y-6">
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
                                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
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
                                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
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
                                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                        <Button
                            onClick={handleUpdate}
                            disabled={!hasChanges || isUpdating || isProcessing}
                            className={cn(
                                "w-full font-semibold py-3 rounded-lg transition-all",
                                hasChanges
                                    ? "bg-primary text-white hover:bg-primary/90 shadow-md scale-[1.02]"
                                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                            )}
                        >
                            {isUpdating ? 'Updating...' : 'Update'}
                        </Button>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={handleLoadFromRemote}
                                disabled={hasChanges || isProcessing || isUpdating || !syncServerUrl.trim() || !syncPassphrase.trim()}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="cloud_download" className="text-xl" />
                                Load From Remote
                            </Button>

                            <Button
                                onClick={handleSaveToRemote}
                                disabled={hasChanges || isProcessing || isUpdating || !syncServerUrl.trim() || !syncPassphrase.trim()}
                                className="w-full bg-primary text-white hover:bg-primary/90 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="cloud_upload" className="text-xl" />
                                Save To Remote
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
