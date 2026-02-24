import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'highlight' | 'highlightSubtle';
}

const variantStyles = {
    default: 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#283933]',
    highlight: 'bg-surface-dark border border-white/5',
    highlightSubtle: 'bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-2xl p-4 shadow-sm',
                    variantStyles[variant],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Card.displayName = 'Card';
