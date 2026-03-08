import { useStore } from '@/store/useStore';
import { remoteSyncService } from '@/services/remoteSyncService';
import { Icon } from '../ui/Icon';


export function SyncStatusIcon() {
    const { syncStatus, lastSynced } = useStore();

    const handleClick = async () => {
        // Force a manual sync when tapped
        remoteSyncService.sync().catch(console.error);
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
