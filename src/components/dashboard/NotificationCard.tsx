import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

interface NotificationCardProps {
    title: string;
    description: string;
    icon: string;
    buttonText: string;
    onClick: () => void;
}

export function NotificationCard({
    title,
    description,
    icon,
    buttonText,
    onClick,
}: NotificationCardProps) {
    return (
        <div className="mb-6 bg-surface-dark border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Icon name={icon} />
                </div>
                <div>
                    <p className="text-white font-bold text-sm">{title}</p>
                    <p className="text-slate-400 text-xs">{description}</p>
                </div>
            </div>
            <Button variant="primary" size="sm" onClick={onClick}>
                {buttonText}
            </Button>
        </div>
    );
}
