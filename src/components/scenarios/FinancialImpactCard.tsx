import { Icon } from '@/components/ui/Icon';

interface FinancialImpactCardProps {
    title: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    badgeText: string;
    badgeTrend: 'up' | 'down';
    currentValue: string;
    projectedValue: string;
}

export function FinancialImpactCard({
    title,
    icon,
    iconBg,
    iconColor,
    badgeText,
    badgeTrend,
    currentValue,
    projectedValue,
}: FinancialImpactCardProps) {
    return (
        <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-gray-100 dark:border-[#2a3833] shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-[#2a3833] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`${iconBg} p-1.5 rounded-lg ${iconColor}`}>
                        <Icon name={icon} className="text-[20px]" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold text-sm">{title}</span>
                </div>
                <span className="bg-primary/20 text-primary-700 dark:text-primary text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <Icon name={badgeTrend === 'up' ? 'arrow_upward' : 'arrow_downward'} className="text-[14px]" />
                    {badgeText}
                </span>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">Current</p>
                    <p className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">{currentValue}</p>
                </div>
                <div className="relative pl-4 border-l border-gray-100 dark:border-[#2a3833]">
                    <p className="text-primary text-xs mb-1 font-semibold">Projected</p>
                    <p className="text-primary text-2xl font-extrabold tracking-tight">{projectedValue}</p>
                </div>
            </div>
        </div>
    );
}
