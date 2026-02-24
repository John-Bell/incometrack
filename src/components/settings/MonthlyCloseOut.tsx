import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
interface MonthlyCloseOutProps {
    description: string;
    monthString: string;
    onArchive: () => void;
}

export function MonthlyCloseOut({ description, monthString, onArchive }: MonthlyCloseOutProps) {
    return (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 rounded-xl p-5">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {description}
            </p>
            <Button variant="primary" fullWidth className="py-4" onClick={onArchive}>
                <Icon name="archive" className="font-bold" />
                Close {monthString}
            </Button>
        </div>
    );
}
