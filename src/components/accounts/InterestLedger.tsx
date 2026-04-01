import { useState } from 'react';
import { useInterestAccruals, addInterestAccrual, updateInterestAccrual, deleteInterestAccrual } from '@/hooks/useInterestAccruals';
import { Icon } from '@/components/ui/Icon';
import type { InterestAccrual } from '@/lib/db';
import { DateInput } from '@/components/ui/DateInput';

interface InterestLedgerProps {
    accountId: string;
}

export function InterestLedger({ accountId }: InterestLedgerProps) {
    const { accruals, isLoading } = useInterestAccruals(accountId);

    // For "MONTH & YEAR" we can use a string input of "YYYY-MM"
    const [editingId, setEditingId] = useState<string | null>(null);
    const [monthYear, setMonthYear] = useState('');
    const [interest, setInterest] = useState('');

    const handleAddOrEdit = async () => {
        if (!monthYear || !interest || !accountId) return;

        // Convert "YYYY-MM" to a Date object. Use the 1st of the month, or the end of the month?
        // Let's use the 1st of the month
        const [year, month] = monthYear.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1).getTime();

        if (editingId) {
            await updateInterestAccrual(editingId, {
                accountId,
                date,
                interestAccrued: parseFloat(interest),
            });
            setEditingId(null);
        } else {
            await addInterestAccrual({
                accountId,
                date,
                interestAccrued: parseFloat(interest),
            });
        }

        setInterest('');
        setMonthYear('');
    };

    const handleEditClick = (accrual: InterestAccrual) => {
        setEditingId(accrual.id);

        const dateObj = new Date(accrual.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');

        setMonthYear(`${year}-${month}`);
        setInterest(accrual.interestAccrued.toString());
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setInterest('');
        setMonthYear('');
    };

    const formatMonthYear = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="bg-white dark:bg-primary/5 rounded-2xl border border-slate-200 dark:border-primary/20 flex flex-col h-full shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-primary/10 flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                        Monthly Interest History
                    </h3>
                    <p className="text-sm text-slate-400">Track accruals over time</p>
                </div>
                <span className="bg-[#bdf3d5] text-[#139454] px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                    LEDGER
                </span>
            </div>

            {/* Add New Entry Form */}
            <div className="p-5 border-b border-slate-100 dark:border-primary/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="min-w-0 w-full">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Month & Year</label>
                        <DateInput
                            type="month"
                            className="w-full h-11 px-3 rounded-xl bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                            value={monthYear}
                            onChange={(e) => setMonthYear(e.target.value)}
                        />
                    </div>
                    <div className="min-w-0 w-full">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interest Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">£</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full h-11 pl-7 pr-3 rounded-xl bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                value={interest}
                                onChange={(e) => setInterest(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddOrEdit}
                        disabled={!interest || !monthYear}
                        className="flex-1 h-12 rounded-xl bg-[#1ce86f] text-slate-900 font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icon name={editingId ? "save" : "add_circle"} className="text-[18px]" />
                        {editingId ? "Save Changes" : "Log Interest Entry"}
                    </button>
                    {editingId && (
                        <button
                            onClick={handleCancelEdit}
                            className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-primary/10 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center"
                        >
                            <Icon name="close" className="text-[18px]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Ledger List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="text-center text-sm text-slate-500 py-8">Loading ledger...</div>
                ) : !accruals || accruals.length === 0 ? (
                    <div className="text-center text-sm text-slate-500 py-8">
                        No interest recorded yet.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-primary/10">
                        {accruals.map((accrual) => (
                            <div key={accrual.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
                                        {formatMonthYear(accrual.date)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="font-bold text-[#1ce86f] text-base mb-1">
                                            + £{accrual.interestAccrued.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                            Accrued Interest
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(accrual)}
                                            className="text-slate-300 hover:text-blue-500 transition-colors"
                                        >
                                            <Icon name="edit" className="text-[24px]" />
                                        </button>
                                        <button
                                            onClick={() => deleteInterestAccrual(accrual.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Icon name="delete" className="text-[24px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
