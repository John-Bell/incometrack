import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
}

const variantStyles = {
    primary: 'bg-primary hover:bg-[#0fd693] text-[#10221c] shadow-lg shadow-primary/20',
    secondary: 'bg-slate-200 dark:bg-surface-dark hover:bg-slate-300 dark:hover:bg-surface-dark-lighter text-slate-900 dark:text-white border border-transparent dark:border-white/10',
    danger: 'bg-red-500/5 hover:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20',
    ghost: 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
    icon: 'bg-slate-200 dark:bg-surface-dark text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-surface-dark-lighter',
};

const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-md',
    md: 'px-4 py-2 text-sm font-bold rounded-lg',
    lg: 'px-6 py-4 text-base font-bold rounded-xl',
    icon: 'w-10 h-10 rounded-full flex items-center justify-center p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
                    variantStyles[variant],
                    sizeStyles[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
