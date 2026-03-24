import React from 'react';

// Anti-pattern: Missing iOS resets
export const DarkMonthInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ value, onChange }) => {
  return (
    <input
      type="month"
      value={value}
      onChange={onChange}
      className="w-full px-3 bg-white dark:bg-primary/10 border dark:border-primary/20"
    />
  );
};