import { type ChangeEvent } from 'react';
import { InputField } from '@/components/ui/InputField';
import { Icon } from '@/components/ui/Icon';

interface IncomeInputCardProps {
    label: string;
    value: string;
    frequency?: 'annual' | 'monthly';
    tooltipText?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    onFrequencyChange?: (frequency: 'annual' | 'monthly') => void;
}

export function IncomeInputCard({ label, value, frequency = 'annual', tooltipText, onChange, onFrequencyChange }: IncomeInputCardProps) {
    const inputProps = onChange ? { value, onChange } : { defaultValue: value };

    return (
        <div className="bg-white dark:bg-[#1c2723] rounded-xl p-4 border border-slate-200 dark:border-[#2f3e37] shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold">{label}</label>
                <div className="group relative">
                    <Icon name="info" className="text-slate-400 dark:text-[#3b544b] text-[20px] cursor-pointer" />
                    {tooltipText && (
                        <span className="absolute bottom-full right-0 mb-2 hidden w-48 rounded bg-gray-800 p-2 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 text-center z-50">
                            {tooltipText}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <InputField
                    type="number"
                    leftElement={<span className="font-medium">£</span>}
                    {...inputProps}
                />
                <div className="flex bg-slate-100 dark:bg-[#111816] rounded-lg p-1 h-[52px]">
                    <button
                        className={`px-3 rounded-[0.2rem] text-xs font-semibold shadow-sm h-full transition-colors ${frequency === 'annual' ? 'bg-white dark:bg-[#2f3e37] text-slate-900 dark:text-white' : 'text-slate-400 dark:text-[#5f7e73] hover:text-slate-600 dark:hover:text-[#9db9b0] bg-transparent'}`}
                        onClick={() => onFrequencyChange && onFrequencyChange('annual')}
                    >Yr</button>
                    <button
                        className={`px-3 rounded-[0.2rem] text-xs font-semibold shadow-sm h-full transition-colors ${frequency === 'monthly' ? 'bg-white dark:bg-[#2f3e37] text-slate-900 dark:text-white' : 'text-slate-400 dark:text-[#5f7e73] hover:text-slate-600 dark:hover:text-[#9db9b0] bg-transparent'}`}
                        onClick={() => onFrequencyChange && onFrequencyChange('monthly')}
                    >Mo</button>
                </div>
            </div>
        </div>
    );
}
