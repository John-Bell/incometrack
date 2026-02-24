import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
    options: string[];
    selected: string;
    onValueChange: (option: string) => void;
    fullWidth?: boolean;
}

export function Tabs({
    options,
    selected,
    onValueChange,
    fullWidth = true,
    className,
    ...props
}: TabsProps) {
    return (
        <div
            className={cn(
                'flex bg-slate-200 dark:bg-[#1c2723] rounded-lg p-1',
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {options.map((option) => {
                const isActive = option === selected;
                return (
                    <button
                        key={option}
                        onClick={() => onValueChange(option)}
                        className={cn(
                            'flex-1 py-1.5 px-3 text-sm font-semibold rounded-[0.2rem] transition-all duration-200 truncate',
                            isActive
                                ? 'bg-white dark:bg-[#2f3e37] text-primary shadow-sm'
                                : 'text-slate-500 dark:text-[#9db9b0] hover:text-slate-700 dark:hover:text-[#bde3d4]'
                        )}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
}
