import { Icon } from '../ui/Icon';
import { SyncStatusIcon } from './SyncStatusIcon';

interface MainHeaderActionsProps {
    onSave?: () => void;
    isSaving?: boolean;
}

export function MainHeaderActions({ onSave, isSaving }: MainHeaderActionsProps) {
    return (
        <div className="flex items-center gap-4">
            <SyncStatusIcon />
            {onSave && (
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 bg-primary text-[#10221c] px-3 py-1.5 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                    <Icon name={isSaving ? "hourglass_empty" : "check"} className="text-sm" />
                    {isSaving ? "Saving..." : "Save"}
                </button>
            )}
        </div>
    );
}
