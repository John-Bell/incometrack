import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
    size?: 'sm' | 'md';
}

const variantStyles = {
    primary: 'bg-primary/20 text-primary-700 dark:text-primary',
    secondary: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    outline: 'border border-primary text-primary',
    ghost: 'bg-transparent text-slate-500',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500',
    error: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
};

export function Badge({
    className,
    variant = 'primary',
    size = 'md',
    children,
    ...props
}: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
