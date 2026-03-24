import React from 'react';

// Anti-pattern: Missing iOS resets
export const LightDateInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ value, onChange }) => {
  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      className="w-full px-3 border border-slate-200"
    />
  );
};