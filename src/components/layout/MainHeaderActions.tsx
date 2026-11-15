import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';
import { useMainHeaderActions } from '@/hooks/useMainHeaderActions';

interface MainHeaderActionsProps {
    onSave?: () => void;
    isSaving?: boolean;
    showSaveButton?: boolean;
}

export function MainHeaderActions({ onSave, isSaving: externalIsSaving, showSaveButton = false }: MainHeaderActionsProps) {
    const {
        isSaving,
        recentlySaved,
        isSyncConfigured,
        color,
        iconButtonColor,
        tooltip,
        icon,
        handleSyncClick
    } = useMainHeaderActions(onSave, externalIsSaving);

    return (
        <div className="flex items-center gap-2">
            {!showSaveButton && !onSave && (
                <button
                    type="button"
                    onClick={handleSyncClick}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors flex items-center justify-center cursor-pointer"
                    title={tooltip}
                    aria-label={tooltip}
                >
                    <Icon name={icon} className={iconButtonColor} />
                </button>
            )}

            {(showSaveButton || onSave) && (
                <button
                    onClick={handleSyncClick}
                    disabled={isSaving || (!onSave && !isSyncConfigured)}
                    title={tooltip}
                    className="flex items-center gap-2 bg-primary text-[#10221c] px-3 py-1.5 rounded-xl font-bold text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                    <Icon name={isSaving ? 'hourglass_empty' : icon} className={cn('text-lg', color)} />
                    {isSaving ? 'Saving...' : (recentlySaved ? 'Saved' : 'Save')}
                </button>
            )}
        </div>
    );
}
