import type { HTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';

interface AccountCardProps extends HTMLAttributes<HTMLDivElement> {
    id: string;
    ownerId: string;
    institutionCode: string;
    institutionColor: 'red' | 'blue' | 'gray' | 'green' | 'pink' | 'purple';
    accountName: string;
    ownerTag: string;
    ownerTagColor: 'purple' | 'blue' | 'pink';
    balance: string;
    rate: string;
    isStale?: boolean;
    isWarned?: boolean;
    updatedAt: string;
    alertText?: string;
    alertType?: 'warning' | 'error' | 'info';
}

const instColorMap = {
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    gray: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

const ownerTagColorMap = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
};

const alertColorMap = {
    warning: 'text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20',
    error: 'text-red-500 bg-red-100 dark:bg-red-900/20',
    info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20',
};

export function AccountCard({
    id,
    institutionCode,
    institutionColor,
    accountName,
    ownerTag,
    ownerTagColor,
    balance,
    rate,
    isStale = false,
    isWarned = false,
    updatedAt,
    alertText,
    alertType = 'warning',
    className,
    ownerId, // destructure ownerId to prevent it being passed to DOM via ...props
    ...props
}: AccountCardProps) {
    const navigate = useNavigate();

    return (
        <div
            className={cn(
                'group relative bg-white dark:bg-[#18221f] rounded-2xl p-4 border border-gray-100 dark:border-[#283933] shadow-sm active:scale-[0.98] transition-transform duration-200',
                isStale && 'opacity-80',
                className
            )}
            {...props}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg', instColorMap[institutionColor])}>
                        {institutionCode}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{accountName}</h3>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', ownerTagColorMap[ownerTagColor])}>
                            {ownerTag}
                        </span>
                    </div>
                </div>
                <button
                    aria-label="Quick Update"
                    onClick={() => navigate(`/accounts/edit/${id}`)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-black transition-colors"
                >
                    <Icon name="edit" />
                </button>
            </div>

            <div className="flex items-baseline justify-between mb-4">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-[#9db9b0] mb-0.5">Current Balance</span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{balance}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 dark:text-[#9db9b0] mb-0.5">AER</span>
                    <span className={cn('text-2xl font-bold', isWarned ? 'text-slate-400 dark:text-slate-500' : 'text-primary')}>{rate}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#283933]">
                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Icon name="calendar_today" className="text-[14px]" />
                    Updated: {updatedAt}
                </div>

                {alertText && (
                    <div className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-md', alertColorMap[alertType])}>
                        <Icon name={alertType === 'warning' ? 'warning' : alertType === 'error' ? 'arrow_downward' : 'info'} className="text-[14px]" />
                        {alertText}
                    </div>
                )}
            </div>
        </div>
    );
}
