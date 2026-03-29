import { db, dbHooks, getSanitizedDbData } from '@/lib/db';
import { useStore } from '@/store/useStore';

/**
 * Derives a key from a passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 600000,
            hash: 'SHA-256',
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// ==========================================
// PART 2: Merge Logic
// ==========================================

export async function mergeData(cloudData: Record<string, any[]>): Promise<boolean> {
    let hasLocalChanges = false;
    const tables = ['profile', 'accounts', 'incomes', 'scenarios', 'settings', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets', 'paymentMappings', 'interestAccruals', 'properties', 'propertyExpenses', 'propertyIncomes', 'propertyOwnership'];

    const tableList = [db.profile, db.accounts, db.incomes, db.scenarios, db.settings, db.monthlyArchives, db.notifications, db.taxRules, db.transactions, db.budgets, db.paymentMappings, db.interestAccruals, db.properties, db.propertyExpenses, db.propertyIncomes, db.propertyOwnership];

    dbHooks.isSyncing = true;
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

    dbHooks.isSyncing = false;
    return hasLocalChanges;
}

// ==========================================
// PART 1: Web Crypto Utilities
// ==========================================

export async function encryptData(data: any, passphrase: string): Promise<Blob> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(passphrase, salt);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
        },
        key,
        encodedData as BufferSource
    );

    // Concatenate salt (16 bytes), iv (12 bytes), and ciphertext
    return new Blob([salt, iv, encryptedBuffer], { type: 'application/octet-stream' });
}

export async function decryptData(buffer: ArrayBuffer, passphrase: string): Promise<any> {
    if (buffer.byteLength < 28) {
        throw new Error('Invalid encrypted data format.');
    }

    const salt = new Uint8Array(buffer.slice(0, 16));
    const iv = new Uint8Array(buffer.slice(16, 28));
    const ciphertext = buffer.slice(28);

    const key = await deriveKey(passphrase, salt);

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv as BufferSource,
            },
            key,
            ciphertext as BufferSource
        );

        const decoder = new TextDecoder();
        const decryptedString = decoder.decode(decryptedBuffer);

        return JSON.parse(decryptedString);
    } catch (error) {
        throw new Error('Decryption failed. Incorrect passphrase or corrupted data.');
    }
}

// ==========================================
// PART 3: Smart Sync Workflow
// ==========================================

export const remoteSyncService = {
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

    async reconnect() {
        // Just try to sync once on boot
        try {
            await this.sync();
        } catch (e) {
            // ignore
        }
    },

    async sync() {
        try {
            const settingsArray = await db.settings.toArray();
            const settings = settingsArray[0];

            if (!settings) {
                console.warn('Sync aborted: settings not initialized.');
                return false;
            }

            const syncUrl = settings.syncServerUrl || (settings as any).syncUrl;
            const syncPassphrase = settings.syncPassphrase;
            const syncHeaderKey = settings.syncHeaderKey;

            if (!syncUrl || !syncPassphrase || !syncHeaderKey) {
                console.warn('Sync aborted: syncUrl, syncPassphrase, or syncHeaderKey is not configured.');
                useStore.getState().setSyncStatus('disconnected');
                return false;
            }

            // 1. Check Version
            let serverLastUpdated = 0;
            const customHeaders: Record<string, string> = {};
            if (syncHeaderKey) {
                customHeaders['x-chaser-token'] = syncHeaderKey;
            }

            const versionResponse = await fetch(`${syncUrl}/version`, { headers: customHeaders, cache: 'no-store' });
            if (versionResponse.ok) {
                const versionData = await versionResponse.json();
                serverLastUpdated = versionData.lastUpdated || 0;
            } else if (versionResponse.status === 404) {
                serverLastUpdated = 0;
            } else {
                throw new Error(`Failed to check version: ${versionResponse.status} ${versionResponse.statusText}`);
            }

            const localLastSynced = settings.lastSynced || 0;

            let hasLocalChanges = false;

            // 2. Pull & Merge (If Needed)
            if (serverLastUpdated > localLastSynced) {
                const pullResponse = await fetch(syncUrl, { headers: customHeaders, cache: 'no-store' });
                if (pullResponse.ok) {
                    const buffer = await pullResponse.arrayBuffer();
                    if (buffer.byteLength > 0) {
                        const decryptedData = await decryptData(buffer, syncPassphrase);
                        // Merge data to Dexie
                        hasLocalChanges = await mergeData(decryptedData);
                    }
                } else if (pullResponse.status !== 404) {
                    throw new Error(`Failed to pull data: ${pullResponse.status} ${pullResponse.statusText}`);
                }
            } else {
                hasLocalChanges = true;
            }

            // 3. Extract full database and 4. Encrypt & Push (If Needed)
            if (hasLocalChanges || serverLastUpdated === 0) {
                // 3. Extract full database, including numeric sanitization for strict clients
                const allData = await getSanitizedDbData();

                // 4. Encrypt & Push
                const encryptedBlob = await encryptData(allData, syncPassphrase);

                const pushResponse = await fetch(syncUrl, {
                    method: 'POST',
                    headers: {
                        ...customHeaders,
                        'Content-Type': 'application/octet-stream',
                    },
                    body: encryptedBlob,
                    cache: 'no-store'
                });

                if (!pushResponse.ok) {
                    throw new Error(`Failed to push data: ${pushResponse.status} ${pushResponse.statusText}`);
                }
            }

            // 5. Update State
            settings.lastSynced = Date.now();
            await db.settings.put(settings);

            useStore.getState().setSyncStatus('connected');
            useStore.getState().setLastSynced(Date.now());

            return true;
        } catch (error) {
            console.error('Sync failed:', error);
            // We intentionally do not set status to 'disconnected' here.
            // If the failure was just a temporary network drop, we don't want to
            // break the autoSync background loop which only triggers if 'connected'
            throw error;
        }
    }
};
