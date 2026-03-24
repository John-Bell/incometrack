import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const DateInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type = 'date', ...props }, ref) => {
        return (
            <input
                ref={ref}
                type={type === 'month' ? 'month' : 'date'}
                className={cn(
                    // Strict structural rules for iOS Safari:
                    "block max-w-full appearance-none min-w-0 dark:[color-scheme:dark]",
                    // User overrides/customization merged gracefully:
                    className
                )}
                {...props}
            />
        );
    }
);
DateInput.displayName = 'DateInput';
