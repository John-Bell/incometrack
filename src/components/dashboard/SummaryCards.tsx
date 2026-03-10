import { Icon } from '../ui/Icon';

interface SummaryCardsProps {
    totalSavings: number;
    netIncome: number;
}

export function SummaryCards({ totalSavings, netIncome }: SummaryCardsProps) {
    const formattedSavings = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(totalSavings);
    const formattedIncome = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(netIncome);

    return (
        <div className="flex flex-wrap gap-4 p-4">
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-5 bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                    <Icon name="savings" className="text-primary text-xl" />
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">Total Savings</p>
                </div>
                <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold leading-tight">{formattedSavings}</p>
            </div>
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-5 bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                    <Icon name="account_balance_wallet" className="text-primary text-xl" />
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">Net Income</p>
                </div>
                <p className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl font-bold leading-tight">{formattedIncome}</p>
            </div>
        </div>
    );
}
