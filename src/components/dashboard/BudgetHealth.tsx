

interface BudgetHealthProps {
    targetAmount: number;
    actualAmount: number;
}

export function BudgetHealth({ targetAmount, actualAmount }: BudgetHealthProps) {
    const ratio = targetAmount > 0 ? actualAmount / targetAmount : 0;
    const percent = Math.min(ratio * 100, 100);

    let statusText = 'On Track';
    let statusClass = 'text-blue-500 bg-blue-500/10';
    let barColor = 'bg-blue-500';

    if (ratio >= 1) {
        statusText = 'Overspent';
        statusClass = 'text-red-500 bg-red-500/10';
        barColor = 'bg-red-500';
    } else if (ratio >= 0.90) {
        statusText = 'Overspend Risk';
        statusClass = 'text-orange-500 bg-orange-500/10';
        barColor = 'bg-orange-500';
    } else if (ratio <= 0.75) {
        statusText = 'Plenty of Capacity';
        statusClass = 'text-emerald-500 bg-emerald-500/10';
        barColor = 'bg-emerald-500';
    }

    const formattedTarget = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(targetAmount);
    const formattedActual = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(actualAmount);

    return (
        <section className="px-4 py-2">
            <div className="bg-white dark:bg-slate-900/50 rounded-xl p-6 border border-primary/5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Monthly Progress</h2>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${statusClass}`}>
                        {statusText}
                    </span>
                </div>

                <div className="flex flex-col gap-1 mb-6">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Budget Utilisation</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                            {Math.round(ratio * 100)}%
                        </span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Spent</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{formattedActual}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Target: {formattedTarget}
                        </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
