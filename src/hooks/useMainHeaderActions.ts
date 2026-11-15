import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { remoteSyncService } from '@/services/remoteSyncService';
import { getSyncStatusDetails, isSyncSettingsConfigured } from '@/utils/syncStatusUtils';

interface MainHeaderActionsState {
    recentlySaved: boolean;
    internalIsSaving: boolean;
    hasAttemptedSave: boolean;
    prevIsSaving: boolean;
}

export function useMainHeaderActions(onSave?: () => void, externalIsSaving?: boolean) {
    const rawSyncStatus = useStore(state => state.syncStatus) as
        | string
        | { syncStatus?: string; lastSynced?: number | null }
        | undefined;
    const rawLastSynced = useStore(state => state.lastSynced) as
        | number
        | { lastSynced?: number | null }
        | null
        | undefined;

    const syncStatus =
        rawSyncStatus && typeof rawSyncStatus === 'object' && 'syncStatus' in rawSyncStatus
            ? rawSyncStatus.syncStatus
            : (rawSyncStatus as string | undefined);

    const lastSynced =
        rawLastSynced && typeof rawLastSynced === 'object' && 'lastSynced' in rawLastSynced
            ? rawLastSynced.lastSynced
            : (rawLastSynced as number | null | undefined);

    const settingsArray = useLiveQuery(() => db.settings.toArray());
    const settings = Array.isArray(settingsArray) ? settingsArray[0] : undefined;
    const isSyncConfigured = isSyncSettingsConfigured(settings);

    const [state, setState] = useState<MainHeaderActionsState>({
        recentlySaved: false,
        internalIsSaving: false,
        hasAttemptedSave: false,
        prevIsSaving: false
    });

    const isSaving = externalIsSaving !== undefined ? externalIsSaving : state.internalIsSaving;

    if (isSaving !== state.prevIsSaving) {
        if (isSaving) {
            setState(prev => ({
                ...prev,
                prevIsSaving: true,
                hasAttemptedSave: true,
                recentlySaved: false
            }));
        } else {
            setState(prev => ({
                ...prev,
                prevIsSaving: false,
                recentlySaved: prev.hasAttemptedSave
            }));
        }
    }

    useEffect(() => {
        if (!state.recentlySaved) return;
        const timeout = setTimeout(() => {
            setState(prev => ({ ...prev, recentlySaved: false }));
        }, 3000);
        return () => clearTimeout(timeout);
    }, [state.recentlySaved]);

    const handleSyncClick = async () => {
        if (onSave) {
            onSave();
            return;
        }

        setState(prev => ({ ...prev, internalIsSaving: true }));
        try {
            await remoteSyncService.sync();
        } catch (error) {
            console.error('Failed to sync:', error);
        } finally {
            setState(prev => ({ ...prev, internalIsSaving: false }));
        }
    };

    const { color, iconButtonColor, tooltip, icon } = getSyncStatusDetails(syncStatus, lastSynced);

    return {
        isSaving,
        recentlySaved: state.recentlySaved,
        isSyncConfigured,
        color,
        iconButtonColor,
        tooltip,
        icon,
        handleSyncClick
    };
}
