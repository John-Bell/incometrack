import React from 'react';
import { cn } from '@/lib/utils';

// Best Practice: Core iOS resets applied, plus conditional dark mode color-scheme fix
export const DarkMonthInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ value, onChange }) => {
  return (
    <input
      type="month"
      value={value}
      onChange={onChange}
      className={cn(
        "w-full px-3 bg-white dark:bg-primary/10 border dark:border-primary/20",
        "block max-w-full appearance-none min-w-0 dark:[color-scheme:dark]" // iOS fixes appended cleanly
      )}
    />
  );
};