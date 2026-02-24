import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
    value: number; // 0 to 100
    threshold?: number; // point where red line is (e.g., 80)
    variant?: 'primary' | 'danger';
}

export function ProgressBar({
    value,
    threshold,
    variant = 'primary',
    className,
    ...props
}: ProgressBarProps) {
    const isPrimary = variant === 'primary';

    return (
        <div
            className={cn('relative h-6 w-full bg-slate-200 dark:bg-[#2a4038] rounded-full overflow-hidden', className)}
            {...props}
        >
            <div
                className={cn(
                    'absolute left-0 top-0 h-full rounded-l-full flex items-center justify-end pr-2 transition-all duration-1000 ease-out',
                    isPrimary ? 'bg-primary' : 'bg-red-500',
                    value >= 100 && 'rounded-r-full'
                )}
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
            />
            {threshold !== undefined && (
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 h-full z-10"
                    style={{ right: `${100 - threshold}%` }}
                />
            )}
        </div>
    );
}
