import { useStore } from '@/store/useStore';
import { syncService } from '@/services/syncService';
import { Icon } from '../ui/Icon';
import { db } from '@/lib/db';

export function SyncStatusIcon() {
    const { syncStatus, lastSynced } = useStore();

    const handleClick = async () => {
        if (syncStatus === 'disconnected') {
            await syncService.connectCloud();
        } else if (syncStatus === 'permission_needed') {
            const settings = await db.settings.get('default');
            if (settings && settings.cloudHandle) {
                try {
                    const permission = await settings.cloudHandle.requestPermission({ mode: 'readwrite' });
                    if (permission === 'granted') {
                        useStore.getState().setSyncStatus('connected');
                        syncService.sync().catch(console.error);
                    } else {
                        // iOS 2026 PWA behavior: If the OS drops the handle or denies permission, fallback to manual pick
                        await syncService.connectCloud();
                    }
                } catch (err) {
                     // If requesting permission fails entirely (e.g., stale handle), trigger manual pick
                     await syncService.connectCloud();
                }
            } else if (settings && (settings as any).iosFallbackSync) {
                useStore.getState().setSyncStatus('connected');
                syncService.sync().catch(console.error);
            }
        } else if (syncStatus === 'connected') {
            // Force a manual sync when tapped if already connected
            syncService.sync().catch(console.error);
        }
    };

    const getStatusDetails = () => {
        switch (syncStatus) {
            case 'disconnected':
                return {
                    color: 'text-red-500',
                    tooltip: 'Cloud not linked. Tap to connect.',
                    icon: 'cloud_off'
                };
            case 'permission_needed':
                return {
                    color: 'text-orange-500',
                    tooltip: 'Permission expired. Tap to reconnect.',
                    icon: 'cloud_sync'
                };
            case 'connected':
                return {
                    color: 'text-green-500',
                    tooltip: `Connected. Last synced: ${lastSynced ? new Date(lastSynced).toLocaleTimeString() : 'never'}`,
                    icon: 'cloud_done'
                };
            default:
                return {
                    color: 'text-slate-500',
                    tooltip: 'Unknown sync status.',
                    icon: 'cloud'
                };
        }
    };

    const { color, tooltip, icon } = getStatusDetails();

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors flex items-center justify-center cursor-pointer`}
            title={tooltip}
            aria-label={tooltip}
        >
            <Icon name={icon} className={`${color}`} />
        </button>
    );
}
