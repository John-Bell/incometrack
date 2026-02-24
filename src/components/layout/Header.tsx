import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
    title?: string;
    subtitle?: string;
    leftElement?: ReactNode;
    rightElement?: ReactNode;
    className?: string;
}

export function Header({
    title,
    subtitle,
    leftElement,
    rightElement,
    className,
}: HeaderProps) {
    return (
        <header className={cn('flex items-center justify-between px-6 py-4', className)}>
            <div className="flex items-center gap-3">
                {leftElement}
                <div className="flex flex-col">
                    {subtitle && (
                        <h1 className="text-sm font-medium text-slate-500 dark:text-[#9db9b0]">
                            {subtitle}
                        </h1>
                    )}
                    {title && (
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                            {title}
                        </h2>
                    )}
                </div>
            </div>
            {rightElement && <div>{rightElement}</div>}
        </header>
    );
}
