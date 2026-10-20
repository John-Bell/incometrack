import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useRemoteSyncing } from '@/hooks/useRemoteSyncing';
import { cn } from '@/lib/utils';

export function RemoteSyncingPage() {
    const {
        navigate,
        syncServerUrl,
        setSyncServerUrl,
        syncPassphrase,
        setSyncPassphrase,
        syncHeaderKey,
        setSyncHeaderKey,
        isUpdating,
        isProcessing,
        statusMessage,
        hasChanges,
        handleUpdate,
        handleLoadFromRemote,
        handleSaveToRemote,
    } = useRemoteSyncing();

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
                            <label htmlFor="sync-server-url" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Sync Server URL
                            </label>
                            <input
                                id="sync-server-url"
                                type="text"
                                placeholder="e.g. https://sync.yourdomain.xyz/sync"
                                value={syncServerUrl}
                                onChange={(e) => setSyncServerUrl(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="encryption-passphrase" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Encryption Passphrase
                            </label>
                            <input
                                id="encryption-passphrase"
                                type="text"
                                placeholder="e.g. four random words"
                                value={syncPassphrase}
                                onChange={(e) => setSyncPassphrase(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-3">
                            <label htmlFor="header-key" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Header Key
                            </label>
                            <input
                                id="header-key"
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
                                disabled={hasChanges || isProcessing || isUpdating || !syncServerUrl.trim() || !syncPassphrase.trim() || !syncHeaderKey.trim()}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="cloud_download" className="text-xl" />
                                Load From Remote
                            </Button>

                            <Button
                                onClick={handleSaveToRemote}
                                disabled={hasChanges || isProcessing || isUpdating || !syncServerUrl.trim() || !syncPassphrase.trim() || !syncHeaderKey.trim()}
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
