import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '../ui/Icon';
import { SideMenu } from './SideMenu';

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className={cn('w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between px-6 py-4', className)}>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
                    className="p-1 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors cursor-pointer flex items-center justify-center"
                    aria-label="Open menu"
                >
                    <Icon name="menu" className="text-2xl text-slate-700 dark:text-slate-300" />
                </button>
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

            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </header>
    );
}
