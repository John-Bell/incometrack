import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { SyncStatusIcon } from './SyncStatusIcon';

interface MainHeaderActionsProps {
    onSave?: () => void;
    isSaving?: boolean;
}

export function MainHeaderActions({ onSave, isSaving }: MainHeaderActionsProps) {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-4">
            <SyncStatusIcon />
            <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors flex items-center justify-center -mr-2"
                aria-label="Settings"
            >
                <Icon name="settings" className="text-slate-700 dark:text-slate-300" />
            </button>
            <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1 bg-primary text-[#10221c] px-3 py-1.5 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
                <Icon name={isSaving ? "hourglass_empty" : "check"} className="text-sm" />
                {isSaving ? "Saving..." : "Save"}
            </button>
        </div>
    );
}
