import { type Income } from '@/lib/db';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';
import { DateInput } from '../ui/DateInput';
import { useIncomeEntryForm, type IncomeFieldValue } from '@/hooks/useIncomeForm';

interface IncomeEntryFormProps {
    formData: Partial<Income>;
    isEditing: boolean;
    onChange: (field: keyof Income, value: IncomeFieldValue) => void;
    onSave: () => void;
    onCancel: () => void;
}

export function IncomeEntryForm({ formData, isEditing, onChange, onSave, onCancel }: IncomeEntryFormProps) {
    const {
        selectedDropdownPath,
        showCustomName,
        displayAmount,
        startDateValue,
        endDateValue,
        pensionOptions,
        employmentOptions,
        dividendOptions,
        handleTypeChange,
        handleStartDateChange,
        handleEndDateChange
    } = useIncomeEntryForm(formData, isEditing, onChange);

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
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-1">Category</label>
                    <div className="relative">
                        <select
                            value={selectedDropdownPath || ''}
                            onChange={handleTypeChange}
                            className={cn(
                                'w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5',
                                'text-slate-900 dark:text-white font-medium appearance-none min-w-0 max-w-full block dark:[color-scheme:dark]'
                            )}
                        >
                            <option value="" disabled>Select income category</option>
                            <optgroup label="Pensions">
                                {pensionOptions.map(opt => (
                                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Employment & Other">
                                {employmentOptions.map(opt => (
                                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Dividends">
                                {dividendOptions.map(opt => (
                                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                                ))}
                            </optgroup>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Icon name="expand_more" className="text-slate-400 text-xl" />
                        </div>
                    </div>
                </div>

                {/* Time-bounded Fields */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label htmlFor="startDate" className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-1">Starts (Optional)</label>
                        <DateInput
                            id="startDate"
                            value={startDateValue}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className={cn(
                                'w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5',
                                'text-slate-900 dark:text-white font-medium block'
                            )}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="endDate" className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-1">Ends (Optional)</label>
                        <DateInput
                            id="endDate"
                            value={endDateValue}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className={cn(
                                'w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5',
                                'text-slate-900 dark:text-white font-medium block'
                            )}
                        />
                    </div>
                </div>

                {/* Custom Name */}
                {showCustomName && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-1">Custom Name</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder="e.g. Side Hustle"
                            className={cn(
                                'w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5',
                                'text-slate-900 dark:text-white font-medium min-w-0 max-w-full block dark:[color-scheme:dark]'
                            )}
                        />
                    </div>
                )}

                {/* Amount Input */}
                <div className="space-y-1.5">
                    <label htmlFor="incomeAmount" className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-1">Amount</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</div>
                        <input
                            id="incomeAmount"
                            type="number"
                            value={displayAmount}
                            onChange={(e) => onChange('amount', e.target.value)}
                            placeholder="0.00"
                            className={cn(
                                'w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3.5',
                                'text-slate-900 dark:text-white font-bold min-w-0 max-w-full block appearance-none dark:[color-scheme:dark]'
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
                                'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all',
                                formData.frequency === 'monthly'
                                    ? 'bg-white dark:bg-background-dark text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => onChange('frequency', 'annual')}
                            className={cn(
                                'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all',
                                formData.frequency === 'annual'
                                    ? 'bg-white dark:bg-background-dark text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
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
