import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BottomNavigation } from './BottomNavigation';

interface AppLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    hideBottomNav?: boolean;
    className?: string;
    mainClassName?: string;
}

export function AppLayout({
    children,
    header,
    hideBottomNav = false,
    className,
    mainClassName,
}: AppLayoutProps) {
    return (
        <div
            className={cn(
                'bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col antialiased selection:bg-primary selection:text-background-dark overflow-hidden',
                className
            )}
        >
            {header && (
                <div className="flex-none z-20 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-[#283933]">
                    {header}
                </div>
            )}

            <main
                className={cn(
                    'flex-1 overflow-y-auto w-full max-w-md mx-auto relative',
                    !hideBottomNav && 'pb-24', // Ensure space for bottom navigation
                    mainClassName
                )}
            >
                {children}
            </main>

            {!hideBottomNav && <BottomNavigation />}
        </div>
    );
}
