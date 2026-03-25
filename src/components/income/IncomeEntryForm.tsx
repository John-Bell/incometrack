import { type Income } from '@/lib/db';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';

interface IncomeEntryFormProps {
    formData: Partial<Income>;
    isEditing: boolean;
    onChange: (field: keyof Income, value: any) => void;
    onSave: () => void;
    onCancel: () => void;
}

export const INCOME_OPTIONS = [
    { label: 'Private Pension', type: 'pension', taxCategory: 'Pension' },
    { label: 'State Pension', type: 'pension', taxCategory: 'State Pension' },
    { label: 'Employment', type: 'employment', taxCategory: 'Earned' },
    { label: 'Other Income', type: 'employment', taxCategory: 'Earned' },
    { label: 'Dividends', type: 'dividends', taxCategory: 'Dividend' },
];

export function IncomeEntryForm({ formData, isEditing, onChange, onSave, onCancel }: IncomeEntryFormProps) {
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const option = INCOME_OPTIONS.find(opt => opt.label === e.target.value);
        if (option) {
            onChange('name', option.label);
            onChange('type', option.type);
            onChange('taxCategory', option.taxCategory);
        }
    };

    // Ensure amount renders as string in input to allow empty clearing
    const displayAmount = formData.amount === 0 ? '' : formData.amount?.toString() || '';

    return (
        <div id="modify-entry-form" className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">
                    {isEditing ? 'Modify Entry' : 'New Entry'}
                </h3>
                {isEditing && (
                    <button 
                        onClick={onCancel}
                        className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Type Selection */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-1">Type</label>
                    <div className="relative">
                        <select
                            value={formData.name || ''}
                            onChange={handleTypeChange}
                            className={cn(
                                "w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5",
                                "text-slate-900 dark:text-white font-medium appearance-none min-w-0 max-w-full block dark:[color-scheme:dark]"
                            )}
                        >
                            <option value="" disabled>Select income type</option>
                            {INCOME_OPTIONS.map(opt => (
                                <option key={opt.label} value={opt.label}>{opt.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Icon name="expand_more" className="text-slate-400 text-xl" />
                        </div>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-1">Amount</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</div>
                        <input
                            type="number"
                            value={displayAmount}
                            onChange={(e) => onChange('amount', e.target.value)}
                            placeholder="0.00"
                            className={cn(
                                "w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3.5",
                                "text-slate-900 dark:text-white font-bold min-w-0 max-w-full block appearance-none dark:[color-scheme:dark]"
                            )}
                        />
                    </div>
                </div>

                {/* Frequency Toggle */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-1">Frequency</label>
                    <div className="flex bg-slate-200/50 dark:bg-slate-900/50 rounded-xl p-1">
                        <button
                            onClick={() => onChange('frequency', 'monthly')}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                                formData.frequency === 'monthly'
                                    ? "bg-white dark:bg-background-dark text-primary shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => onChange('frequency', 'annual')}
                            className={cn(
                                "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                                formData.frequency === 'annual'
                                    ? "bg-white dark:bg-background-dark text-primary shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            Yearly
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={onSave}
                disabled={!formData.name || !formData.amount}
                className="w-full mt-2 h-12 bg-primary text-background-dark font-bold rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
                {isEditing ? 'Update Entry' : 'Add to Portfolio'}
            </button>
        </div>
    );
}
