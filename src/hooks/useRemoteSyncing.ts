import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSanitizedDbData } from '@/lib/db';
import { encryptData, decryptData, mergeData } from '@/services/remoteSyncService';
import { useStore } from '@/store/useStore';
import { getSyncHeaders, validateSyncConfig } from '@/utils/remoteSyncUtils';

export function useRemoteSyncing() {
    const navigate = useNavigate();
    const { initStore } = useStore();
    const settings = useLiveQuery(() => db.settings.toArray());
    const currentSettings = settings?.[0];

    const [syncServerUrl, setSyncServerUrl] = useState('');
    const [syncPassphrase, setSyncPassphrase] = useState('');
    const [syncHeaderKey, setSyncHeaderKey] = useState('');

    const [isUpdating, setIsUpdating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        } catch {
            setStatusMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLoadFromRemote = async () => {
        if (!validateSyncConfig(syncServerUrl, syncPassphrase, syncHeaderKey)) {
            setStatusMessage({ type: 'error', text: 'Server URL, Encryption Passphrase, and Header Key are required.' });
            return;
        }

        if (!window.confirm('Are you sure you want to load data from the remote server? This will merge remote data into your local database.')) {
            return;
        }

        setIsProcessing(true);
        setStatusMessage(null);
        try {
            const headers = getSyncHeaders(syncHeaderKey);
            const response = await fetch(syncServerUrl.trim(), { headers, cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            if (buffer.byteLength === 0) {
                throw new Error('Remote sync data is empty.');
            }

            const decryptedData = await decryptData(buffer, syncPassphrase.trim());
            await mergeData(decryptedData);

            if (currentSettings) {
                await db.settings.update(currentSettings.id, {
                    lastSynced: Date.now(),
                });
            }

            await initStore();
            setStatusMessage({ type: 'success', text: 'Data loaded from remote successfully.' });
        } catch (error) {
            console.error('Load from remote failed:', error);
            setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : 'An unknown error occurred during load.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveToRemote = async () => {
        if (!validateSyncConfig(syncServerUrl, syncPassphrase, syncHeaderKey)) {
            setStatusMessage({ type: 'error', text: 'Server URL, Encryption Passphrase, and Header Key are required.' });
            return;
        }

        if (!window.confirm('Are you sure you want to save your local data to the remote server? This will overwrite the remote database.')) {
            return;
        }

        setIsProcessing(true);
        setStatusMessage(null);
        try {
            const allData = await getSanitizedDbData();
            const encryptedBlob = await encryptData(allData, syncPassphrase.trim());
            const headers = getSyncHeaders(syncHeaderKey);

            const response = await fetch(syncServerUrl.trim(), {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/octet-stream',
                },
                body: encryptedBlob,
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`Failed to push data: ${response.status} ${response.statusText}`);
            }

            if (currentSettings) {
                await db.settings.update(currentSettings.id, {
                    lastSynced: Date.now(),
                });
            }

            setStatusMessage({ type: 'success', text: 'Data saved to remote successfully.' });
        } catch (error) {
            console.error('Save to remote failed:', error);
            setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : 'An unknown error occurred during save.' });
        } finally {
            setIsProcessing(false);
        }
    };

    return {
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
    };
}
