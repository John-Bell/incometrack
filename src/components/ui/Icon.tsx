import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface IconProps extends HTMLAttributes<HTMLSpanElement> {
    name: string;
    fill?: boolean;
}

export function Icon({ name, fill = false, className, ...props }: IconProps) {
    return (
        <span
            className={cn(
                'material-symbols-outlined',
                fill && 'fill',
                className
            )}
            {...props}
        >
            {name}
        </span>
    );
}
