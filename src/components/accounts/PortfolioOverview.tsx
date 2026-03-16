interface PortfolioOverviewProps {
    totalSavings: string;
    nonPensionSavings: string;
}

export function PortfolioOverview({ totalSavings, nonPensionSavings }: PortfolioOverviewProps) {
    return (
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl p-3 border border-gray-100 dark:border-[#283933] shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-xs font-medium text-slate-500 dark:text-[#9db9b0] mb-1">Total Savings</p>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalSavings}</p>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl p-3 border border-gray-100 dark:border-[#283933] shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10"></div>
                <p className="text-xs font-medium text-slate-500 dark:text-[#9db9b0] mb-1">Total non Pensions Savings</p>
                <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold tracking-tight text-primary">{nonPensionSavings}</p>
                </div>
            </div>
        </div>
    );
}
