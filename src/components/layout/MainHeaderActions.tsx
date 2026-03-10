import { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { useStore } from '@/store/useStore';
import { remoteSyncService } from '@/services/remoteSyncService';

interface MainHeaderActionsProps {
    onSave?: () => void;
    isSaving?: boolean;
}

export function MainHeaderActions({ onSave, isSaving }: MainHeaderActionsProps) {
    const { syncStatus, lastSynced } = useStore();
    const [recentlySaved, setRecentlySaved] = useState(false);

    const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

    // When isSaving goes from true -> false, we show the "Saved" text briefly
    useEffect(() => {
        if (isSaving) {
            setHasAttemptedSave(true);
            setRecentlySaved(false);
        }

        let timeout: NodeJS.Timeout;
        if (isSaving === false && hasAttemptedSave) {
            setRecentlySaved(true);
            timeout = setTimeout(() => {
                setRecentlySaved(false);
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [isSaving, hasAttemptedSave]);

    const handleSyncClick = async () => {
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
                    color: 'text-[#10221c]', // Match button text color for connected
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
        <div className="flex items-center gap-2">
            {!onSave && (
                <button
                    type="button"
                    onClick={handleSyncClick}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors flex items-center justify-center cursor-pointer"
                    title={tooltip}
                    aria-label={tooltip}
                >
                    <Icon name={icon} className={`${color === 'text-[#10221c]' ? 'text-green-500' : color}`} />
                </button>
            )}

            {onSave && (
                <button
                    onClick={() => {
                        onSave();
                        // Optional: we can also trigger sync here if we want,
                        // but usually saving locally triggers sync automatically.
                    }}
                    disabled={isSaving}
                    title={tooltip} // Show sync tooltip on hover for the combined button
                    className="flex items-center gap-2 bg-primary text-[#10221c] px-3 py-1.5 rounded-xl font-bold text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                    <Icon name={isSaving ? "hourglass_empty" : icon} className={`text-lg ${color}`} />
                    {isSaving ? "Saving..." : (recentlySaved ? "Saved" : "Save")}
                </button>
            )}
        </div>
    );
}
