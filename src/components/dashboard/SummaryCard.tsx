import { Icon } from '@/components/ui/Icon';

interface SummaryCardProps {
    icon: string;
    iconBgColor: string;
    iconColor: string;
    label: string;
    value: string;
    trendIcon: string;
    trendText: string;
    trendColor: string;
    isTrendFill?: boolean;
}

export function SummaryCard({
    icon,
    iconBgColor,
    iconColor,
    label,
    value,
    trendIcon,
    trendText,
    trendColor,
    isTrendFill = false,
}: SummaryCardProps) {
    return (
        <div className="bg-surface-dark p-5 rounded-2xl flex flex-col justify-between h-36 border border-white/5">
            <div className={`w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor} mb-2`}>
                <Icon name={icon} className="text-lg" />
            </div>
            <div>
                <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                <div className="flex items-center gap-1 mt-1">
                    <Icon name={trendIcon} className={`${trendColor} text-sm font-bold`} fill={isTrendFill} />
                    <span className={`${trendColor} text-xs font-bold`}>{trendText}</span>
                </div>
            </div>
        </div>
    );
}
