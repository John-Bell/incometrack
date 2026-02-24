import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    leftElement?: ReactNode;
    rightElement?: ReactNode;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ className, leftElement, rightElement, ...props }, ref) => {
        return (
            <div className="relative flex-1 flex items-center">
                {leftElement && (
                    <div className="absolute left-3 flex items-center justify-center text-slate-400 dark:text-[#9db9b0] pointer-events-none">
                        {leftElement}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'w-full bg-slate-100 dark:bg-[#111816] text-slate-900 dark:text-white rounded-lg border-0 py-3 focus:ring-2 focus:ring-primary placeholder:text-slate-400 dark:placeholder:text-[#3b544b] font-medium text-lg',
                        leftElement ? 'pl-8' : 'pl-3',
                        rightElement ? 'pr-12' : 'pr-3',
                        className
                    )}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute right-3 flex items-center justify-center">
                        {rightElement}
                    </div>
                )}
            </div>
        );
    }
);
InputField.displayName = 'InputField';
