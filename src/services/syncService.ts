import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';



// Helper for custom UI prompts since native confirm/prompt is limited
const promptOptions = (title: string, message: string, options: { label: string, value: string }[]): Promise<string | null> => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4';

        const dialog = document.createElement('div');
        dialog.className = 'bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col';

        const header = document.createElement('div');
        header.className = 'p-6 pb-4';
        header.innerHTML = `
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">${title}</h3>
            <p class="text-sm text-slate-600 dark:text-slate-300">${message}</p>
        `;

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex flex-col gap-2 p-6 pt-0';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors active:scale-[0.98]';
            btn.textContent = opt.label;
            btn.onclick = () => {
                document.body.removeChild(overlay);
                resolve(opt.value);
            };
            buttonsContainer.appendChild(btn);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-[0.98] mt-2';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(null);
        };
        buttonsContainer.appendChild(cancelBtn);

        dialog.appendChild(header);
        dialog.appendChild(buttonsContainer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    });
};

export const syncService = {
    _syncTimeout: null as ReturnType<typeof setTimeout> | null,

    autoSync() {
        if (this._syncTimeout) {
            clearTimeout(this._syncTimeout);
        }
        this._syncTimeout = setTimeout(async () => {
            const status = useStore.getState().syncStatus;
            if (status === 'connected') {
                await this.sync();
            }
        }, 2000);
    },

    async createNewCloudFile() {
        try {
            if (!('showSaveFilePicker' in window)) {
                throw new Error('File System Access API is not supported in this browser.');
            }

            const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: 'incometrack-sync.json',
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


            // Fetch current state of DB to write initial data
            const currentData: any = {};
            const tables = ['profile', 'accounts', 'incomes', 'scenarios', 'settings', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets'];

            for (const table of tables) {
                currentData[table] = await (db as any)[table].toArray();
            }

            // Remove cloudHandle from settings before stringifying
            if (currentData.settings) {
                currentData.settings = currentData.settings.map((s: any) => {
                    const { cloudHandle, ...rest } = s;
                    return rest;
                });
            }

            // Write initial state to the newly created file using Native File System Access API
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(currentData, null, 2));
            await writable.close();

            // Save the handle
            let settings = await db.settings.get('default');
            if (!settings) {
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
                settings.updatedAt = Date.now();
                await db.settings.put(settings);
            }

            useStore.getState().setSyncStatus('connected');

            // Initial sync immediately after connecting
            await this.sync();

            return true;

        } catch (error: any) {
            console.error('Failed to create new cloud file:', error);
            if (error.name !== 'AbortError') {
                alert(error.message || 'An error occurred while creating the sync file.');
            }
            return false;
        }
    },

    async connectCloud() {
        try {


            const choice = await promptOptions(
                'Setup iCloud Sync',
                'Would you like to create a new sync file or link an existing one?',
                [
                    { label: 'Create New Sync File', value: 'create' },
                    { label: 'Link Existing Sync File', value: 'link' }
                ]
            );

            if (!choice) return false;

            if (choice === 'create') {
                return await this.createNewCloudFile();
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
            if (Object.keys(cloudData).length > 0) {
                await this.mergeData(cloudData);
            }

            // Fetch current state of DB
            const currentData: any = {};
            const tables = ['profile', 'accounts', 'incomes', 'scenarios', 'settings', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets'];

            for (const table of tables) {
                currentData[table] = await (db as any)[table].toArray();
            }

            // Write back to cloud if we had newer local records or cloud file was empty

            // In-place overwrite for iPadOS 2026 Native File System Access
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
