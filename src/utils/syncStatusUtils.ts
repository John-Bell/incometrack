import type { Settings } from '@/lib/db';

export interface SyncStatusDetails {
    color: string;
    iconButtonColor: string;
    tooltip: string;
    icon: string;
}

export function isSyncSettingsConfigured(settings?: Settings | null): boolean {
    return !!(
        settings?.syncServerUrl?.trim() &&
        settings?.syncPassphrase?.trim() &&
        settings?.syncHeaderKey?.trim()
    );
}

export function getSyncStatusDetails(
    syncStatus: string | undefined,
    lastSynced: number | null | undefined
): SyncStatusDetails {
    switch (syncStatus) {
        case 'disconnected':
            return {
                color: 'text-red-500',
                iconButtonColor: 'text-red-500',
                tooltip: 'Cloud not linked. Tap to connect.',
                icon: 'cloud_off'
            };
        case 'permission_needed':
            return {
                color: 'text-orange-500',
                iconButtonColor: 'text-orange-500',
                tooltip: 'Permission expired. Tap to reconnect.',
                icon: 'cloud_sync'
            };
        case 'connected':
            return {
                color: 'text-[#10221c]',
                iconButtonColor: 'text-green-500',
                tooltip: `Connected. Last synced: ${lastSynced ? new Date(lastSynced).toLocaleTimeString() : 'never'}`,
                icon: 'cloud_done'
            };
        default:
            return {
                color: 'text-slate-500',
                iconButtonColor: 'text-slate-500',
                tooltip: 'Unknown sync status.',
                icon: 'cloud'
            };
    }
}
