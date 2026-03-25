import { Icon } from '../ui/Icon';
import { type Income } from '@/lib/db';
import { cn } from '@/lib/utils';

interface IncomeEntryCardProps {
    income: Income;
    onEdit: (income: Income) => void;
    onDelete: (id: string) => void;
}

export function IncomeEntryCard({ income, onEdit, onDelete }: IncomeEntryCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getIconInfo = () => {
        switch (income.type) {
            case 'pension':
                return { name: 'account_balance', bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' };
            case 'employment':
                return { name: 'work', bg: 'bg-primary/20 dark:bg-primary/20', text: 'text-primary dark:text-primary' };
            case 'dividends':
                return { name: 'show_chart', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400' };
            default:
                return { name: 'attach_money', bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' };
        }
    };

    const iconInfo = getIconInfo();
    const frequencyLabel = income.frequency === 'monthly' ? '/ MO' : '/ YR';

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", iconInfo.bg)}>
                    <Icon name={iconInfo.name} className={cn("text-2xl", iconInfo.text)} />
                </div>
                <div>
                    <h4 className="text-slate-900 dark:text-white font-bold leading-tight">{income.name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{formatCurrency(income.amount)}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider">{frequencyLabel}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onEdit(income)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <Icon name="edit" className="text-lg" />
                </button>
                <button
                    onClick={() => {
                        if (confirm(`Are you sure you want to delete ${income.name}?`)) {
                            onDelete(income.id);
                        }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    <Icon name="delete" className="text-lg" />
                </button>
            </div>
        </div>
    );
}
