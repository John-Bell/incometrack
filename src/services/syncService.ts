import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';

class FallbackWritableFileStream {
    private chunks: BlobPart[] = [];
    private filename: string;

    constructor(filename: string) {
        this.filename = filename;
    }

    async write(data: BlobPart | { type: string, data: BlobPart }) {
        if (typeof data === 'object' && 'data' in data) {
             this.chunks.push(data.data);
        } else {
             this.chunks.push(data);
        }
    }

    async close() {
        const blob = new Blob(this.chunks, { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

export const syncService = {
    async connectCloud() {
        try {
            if (!('showOpenFilePicker' in window)) {
                // iOS Safari / Unsupported browser fallback
                return new Promise((resolve) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = async (e: any) => {
                        const file = e.target.files[0];
                        if (!file) {
                            resolve(false);
                            return;
                        }

                        try {
                            let settings = await db.settings.get('default');
                            if (!settings) {
                                settings = {
                                    id: 'default',
                                    currency: 'GBP',
                                    taxYear: '2024-2025',
                                    icloudSync: true,
                                    iosFallbackSync: true,
                                    updatedAt: Date.now()
                                };
                                await db.settings.add(settings);
                            } else {
                                settings.icloudSync = true;
                                settings.iosFallbackSync = true;
                                settings.updatedAt = Date.now();
                                await db.settings.put(settings);
                            }

                            useStore.getState().setSyncStatus('connected');

                            // Perform initial sync using the selected file
                            await this.performFallbackSync(file);

                            resolve(true);
                        } catch (err: any) {
                            console.error('Fallback sync failed:', err);
                            alert('Failed to process sync file.');
                            resolve(false);
                        }
                    };
                    input.click();
                });
            }

            const [fileHandle] = await (window as any).showOpenFilePicker({
                id: 'finance-app-sync', // Remembers the last selected directory
                types: [
                    {
                        description: 'JSON Files',
                        accept: {
                            'application/json': ['.json'],
                        },
                    },
                ],
            });

            // Try to get permissions
            const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const requestPermission = await fileHandle.requestPermission({ mode: 'readwrite' });
                if (requestPermission !== 'granted') {
                    throw new Error('Permission denied to access the file.');
                }
            }

            // Save the handle
            let settings = await db.settings.get('default');
            if (!settings) {
                // Should not happen normally, but just in case
                settings = {
                    id: 'default',
                    currency: 'GBP',
                    taxYear: '2024-2025',
                    icloudSync: true,
                    cloudHandle: fileHandle,
                    updatedAt: Date.now()
                };
                await db.settings.add(settings);
            } else {
                settings.icloudSync = true;
                settings.cloudHandle = fileHandle;
                settings.iosFallbackSync = false;
                settings.updatedAt = Date.now();
                await db.settings.put(settings);
            }

            useStore.getState().setSyncStatus('connected');

            // Initial sync immediately after connecting
            await this.sync();

            return true;
        } catch (error: any) {
            console.error('Failed to connect cloud:', error);
            if (error.name !== 'AbortError') {
                alert(error.message || 'An error occurred while connecting to the cloud.');
            }
            return false;
        }
    },

    async performFallbackSync(file?: File) {
        try {
            let cloudData: Record<string, any[]> = {};

            if (!file) {
                // For manual syncs, prompt user to select the latest file again
                file = await new Promise<File | undefined>((resolve) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e: any) => resolve(e.target.files[0]);
                    input.oncancel = () => resolve(undefined); // handle cancel if possible

                    // Safari iOS might not fire oncancel, so we rely on change.
                    // If user cancels, it will hang the promise, but that's a known limitation of <input type=file>
                    input.click();
                });
            }

            if (!file) return;

            const text = await file.text();
            if (text.trim()) {
                cloudData = JSON.parse(text);
            }

            const hasLocalChanges = await this.mergeData(cloudData);

            const currentData: any = {};
            const tables = ['profile', 'accounts', 'incomes', 'scenarios', 'settings', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets'];

            for (const table of tables) {
                currentData[table] = await (db as any)[table].toArray();
            }

            // Remove internal handles
            if (currentData.settings) {
                currentData.settings = currentData.settings.map((s: any) => {
                    const { cloudHandle, ...rest } = s;
                    return rest;
                });
            }

            if (hasLocalChanges || Object.keys(cloudData).length === 0) {
                const writable = new FallbackWritableFileStream(file.name || 'incometrack-sync.json');
                await writable.write(JSON.stringify(currentData, null, 2));
                await writable.close();

                alert('Sync complete! A new file has been downloaded. Please save it to your iCloud folder to overwrite the old one.');
            } else {
                alert('Sync complete! No local changes to export.');
            }

            // Save to OPFS Safety Mirror
            await this.saveToOPFS(currentData);

            useStore.getState().setSyncStatus('connected');
            useStore.getState().setLastSynced(Date.now());

            const settings = await db.settings.get('default');
            if (settings) {
                settings.lastSynced = Date.now();
                await db.settings.put(settings);
            }
        } catch (e: any) {
            console.error('Fallback sync processing failed:', e);
            alert('Failed to sync with the selected file.');
        }
    },

    async saveToOPFS(data: any) {
        try {
            if (!navigator.storage || !navigator.storage.getDirectory) return;

            const root = await navigator.storage.getDirectory();
            const draftHandle = await root.getFileHandle('incometrack-safetymirror.json', { create: true });

            // Some browsers (like Safari) support createWritable, others use syncAccessHandle
            if ('createWritable' in draftHandle) {
                const writable = await (draftHandle as any).createWritable();
                await writable.write(JSON.stringify(data, null, 2));
                await writable.close();
            } else if ('createSyncAccessHandle' in draftHandle) {
                // Fallback for OPFS in some environments
                const accessHandle = await (draftHandle as any).createSyncAccessHandle();
                const encoder = new TextEncoder();
                const writeBuffer = encoder.encode(JSON.stringify(data, null, 2));
                accessHandle.write(writeBuffer, { at: 0 });
                accessHandle.flush();
                accessHandle.close();
            }
        } catch (error) {
            console.error('Failed to save to OPFS safety mirror:', error);
        }
    },

    async mergeData(cloudData: Record<string, any[]>) {
        let hasLocalChanges = false;
        const tables = ['profile', 'accounts', 'incomes', 'scenarios', 'settings', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets'];

        const tableList = [db.profile, db.accounts, db.incomes, db.scenarios, db.settings, db.monthlyArchives, db.notifications, db.taxRules, db.transactions, db.budgets];

        await db.transaction('rw', tableList, async () => {
            for (const table of tables) {
                const dexieTable = (db as any)[table];
                const localRecords = await dexieTable.toArray();
                const cloudRecords = cloudData[table] || [];

                const localMap = new Map(localRecords.map((r: any) => [r.id, r]));

                for (let i = 0; i < cloudRecords.length; i++) {
                    const cloudRecord = cloudRecords[i] as any;
                    const localRecord = localMap.get(cloudRecord.id);

                    if (!localRecord) {
                        // Record exists in cloud but not local -> Add it
                        await dexieTable.put(cloudRecord);
                    } else {
                        // Record exists in both -> Compare updatedAt
                        const localTime = (localRecord as any).updatedAt || 0;
                        const cloudTime = (cloudRecord as any).updatedAt || 0;

                        if (cloudTime > localTime) {
                            // Cloud is newer -> Update local
                            // Do not overwrite cloudHandle in settings
                            if (table === 'settings' && (localRecord as any).cloudHandle) {
                                (cloudRecord as any).cloudHandle = (localRecord as any).cloudHandle;
                            }
                            await dexieTable.put(cloudRecord);
                        } else if (localTime > cloudTime) {
                            // Local is newer -> Mark for export
                            hasLocalChanges = true;
                        }
                    }
                    localMap.delete(cloudRecord.id);
                }

                // Any remaining in localMap are local-only -> Mark for export
                if (localMap.size > 0) {
                    hasLocalChanges = true;
                }
            }
        });

        return hasLocalChanges;
    },

    async sync() {
        const settings = await db.settings.get('default');

        if (!settings) return;

        // Use iOS fallback flow if active
        if ((settings as any).iosFallbackSync) {
            await this.performFallbackSync();
            return;
        }

        if (!settings.cloudHandle) return;

        try {
            const handle = settings.cloudHandle;

            // Check permission
            if (await handle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
                useStore.getState().setSyncStatus('permission_needed');
                return;
            }

            // Read cloud file
            let cloudData: Record<string, any[]> = {};
            try {
                const file = await handle.getFile();
                const text = await file.text();
                if (text.trim()) {
                    cloudData = JSON.parse(text);
                }
            } catch (e) {
                console.warn('Could not parse cloud file, assuming empty/new.', e);
            }

            // Merge
            const hasLocalChanges = await this.mergeData(cloudData);

            // Fetch current state of DB
            const currentData: any = {};
            const tables = ['profile', 'accounts', 'incomes', 'scenarios', 'settings', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets'];

            for (const table of tables) {
                currentData[table] = await (db as any)[table].toArray();
            }

            // Write back to cloud if we had newer local records or cloud file was empty
            if (hasLocalChanges || Object.keys(cloudData).length === 0) {
                // Remove cloudHandle from settings before stringifying to avoid serialization issues
                if (currentData.settings) {
                    currentData.settings = currentData.settings.map((s: any) => {
                        const { cloudHandle, ...rest } = s;
                        return rest;
                    });
                }

                const writable = await handle.createWritable();
                await writable.write(JSON.stringify(currentData, null, 2));
                await writable.close();
            }

            // Save to OPFS Safety Mirror
            await this.saveToOPFS(currentData);

            // Update state
            useStore.getState().setSyncStatus('connected');
            useStore.getState().setLastSynced(Date.now());

            // Update settings with lastSynced
            settings.lastSynced = Date.now();
            await db.settings.put(settings);

        } catch (error) {
            console.error('Sync failed:', error);
            // Don't set disconnected if it's just a read/write error, could be temporary
        }
    },

    async reconnect() {
        try {
            const settings = await db.settings.get('default');

            if (settings && (settings as any).iosFallbackSync) {
                useStore.getState().setSyncStatus('connected');
                if (settings.lastSynced) {
                    useStore.getState().setLastSynced(settings.lastSynced);
                }
                return;
            }

            if (settings && settings.cloudHandle) {
                const handle = settings.cloudHandle;

                // When reopening app (e.g. from swipe up), handle permission might need re-prompting
                const permission = await handle.queryPermission({ mode: 'readwrite' });

                if (permission === 'granted') {
                    useStore.getState().setSyncStatus('connected');
                    if (settings.lastSynced) {
                        useStore.getState().setLastSynced(settings.lastSynced);
                    }
                    // Background sync
                    this.sync().catch(console.error);
                } else {
                    // Session expired or tab closed, iOS requires re-granting on user interaction
                    useStore.getState().setSyncStatus('permission_needed');
                }
            } else {
                useStore.getState().setSyncStatus('disconnected');
            }
        } catch (error) {
            console.error('Reconnect failed:', error);
            useStore.getState().setSyncStatus('disconnected');
        }
    }
};
