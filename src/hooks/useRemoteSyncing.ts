import { useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSanitizedDbData, type Settings } from '@/lib/db';
import { encryptData, decryptData, mergeData } from '@/services/remoteSyncService';
import { useStore } from '@/store/useStore';
import { getSyncHeaders, validateSyncConfig } from '@/utils/remoteSyncUtils';

export interface RemoteSyncStatusMessage {
    type: 'success' | 'error';
    text: string;
}

export interface RemoteSyncingState {
    syncServerUrl: string;
    syncPassphrase: string;
    syncHeaderKey: string;
    isUpdating: boolean;
    isProcessing: boolean;
    statusMessage: RemoteSyncStatusMessage | null;
    syncedSettings: Settings | undefined;
}

const initialRemoteSyncingState: RemoteSyncingState = {
    syncServerUrl: '',
    syncPassphrase: '',
    syncHeaderKey: '',
    isUpdating: false,
    isProcessing: false,
    statusMessage: null,
    syncedSettings: undefined,
};

export function useRemoteSyncing() {
    const navigate = useNavigate();
    const initStore = useStore((state) => state.initStore);
    const settings = useLiveQuery(() => db.settings.toArray());
    const currentSettings = settings?.[0];

    const [state, setState] = useState<RemoteSyncingState>(initialRemoteSyncingState);

    if (currentSettings !== state.syncedSettings) {
        setState((prev) => ({
            ...prev,
            syncedSettings: currentSettings,
            ...(currentSettings
                ? {
                      syncServerUrl: currentSettings.syncServerUrl || '',
                      syncPassphrase: currentSettings.syncPassphrase || '',
                      syncHeaderKey: currentSettings.syncHeaderKey || '',
                  }
                : {}),
        }));
    }

    const {
        syncServerUrl,
        syncPassphrase,
        syncHeaderKey,
        isUpdating,
        isProcessing,
        statusMessage,
    } = state;

    const createFieldSetter =
        <K extends keyof RemoteSyncingState>(field: K): Dispatch<SetStateAction<RemoteSyncingState[K]>> =>
        (value) => {
            setState((prev) => ({
                ...prev,
                [field]:
                    typeof value === 'function'
                        ? (value as (prevVal: RemoteSyncingState[K]) => RemoteSyncingState[K])(prev[field])
                        : value,
            }));
        };

    const setSyncServerUrl = createFieldSetter('syncServerUrl');
    const setSyncPassphrase = createFieldSetter('syncPassphrase');
    const setSyncHeaderKey = createFieldSetter('syncHeaderKey');

    const hasChanges =
        syncServerUrl.trim() !== (currentSettings?.syncServerUrl || '') ||
        syncPassphrase.trim() !== (currentSettings?.syncPassphrase || '') ||
        syncHeaderKey.trim() !== (currentSettings?.syncHeaderKey || '');

    const handleUpdate = async () => {
        if (!currentSettings) return;
        setState((prev) => ({ ...prev, isUpdating: true, statusMessage: null }));
        try {
            await db.settings.update(currentSettings.id, {
                syncServerUrl: syncServerUrl.trim() || undefined,
                syncPassphrase: syncPassphrase.trim() || undefined,
                syncHeaderKey: syncHeaderKey.trim() || undefined,
            });
            setState((prev) => ({
                ...prev,
                statusMessage: { type: 'success', text: 'Settings updated successfully.' },
            }));
        } catch {
            setState((prev) => ({
                ...prev,
                statusMessage: { type: 'error', text: 'Failed to update settings.' },
            }));
        } finally {
            setState((prev) => ({ ...prev, isUpdating: false }));
        }
    };

    const handleLoadFromRemote = async () => {
        if (!validateSyncConfig(syncServerUrl, syncPassphrase, syncHeaderKey)) {
            setState((prev) => ({
                ...prev,
                statusMessage: {
                    type: 'error',
                    text: 'Server URL, Encryption Passphrase, and Header Key are required.',
                },
            }));
            return;
        }

        if (!window.confirm('Are you sure you want to load data from the remote server? This will merge remote data into your local database.')) {
            return;
        }

        setState((prev) => ({ ...prev, isProcessing: true, statusMessage: null }));
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
            setState((prev) => ({
                ...prev,
                statusMessage: { type: 'success', text: 'Data loaded from remote successfully.' },
            }));
        } catch (error) {
            console.error('Load from remote failed:', error);
            setState((prev) => ({
                ...prev,
                statusMessage: {
                    type: 'error',
                    text: error instanceof Error ? error.message : 'An unknown error occurred during load.',
                },
            }));
        } finally {
            setState((prev) => ({ ...prev, isProcessing: false }));
        }
    };

    const handleSaveToRemote = async () => {
        if (!validateSyncConfig(syncServerUrl, syncPassphrase, syncHeaderKey)) {
            setState((prev) => ({
                ...prev,
                statusMessage: {
                    type: 'error',
                    text: 'Server URL, Encryption Passphrase, and Header Key are required.',
                },
            }));
            return;
        }

        if (!window.confirm('Are you sure you want to save your local data to the remote server? This will overwrite the remote database.')) {
            return;
        }

        setState((prev) => ({ ...prev, isProcessing: true, statusMessage: null }));
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

            setState((prev) => ({
                ...prev,
                statusMessage: { type: 'success', text: 'Data saved to remote successfully.' },
            }));
        } catch (error) {
            console.error('Save to remote failed:', error);
            setState((prev) => ({
                ...prev,
                statusMessage: {
                    type: 'error',
                    text: error instanceof Error ? error.message : 'An unknown error occurred during save.',
                },
            }));
        } finally {
            setState((prev) => ({ ...prev, isProcessing: false }));
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
