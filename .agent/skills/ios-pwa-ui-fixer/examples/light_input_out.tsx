import React from 'react';
import { cn } from '@/lib/utils';

// Best Practice: Core iOS resets applied, no dark mode fix needed
export const LightDateInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ value, onChange }) => {
  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      className={cn(
        "w-full px-3 border border-slate-200",
        "block max-w-full appearance-none min-w-0" // iOS fixes appended cleanly
      )}
    />
  );
};