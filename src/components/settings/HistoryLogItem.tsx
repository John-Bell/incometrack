interface HistoryLogItemProps {
    month: string;
    closedDate: string;
    totalInterest: string;
}

export function HistoryLogItem({ month, closedDate, totalInterest }: HistoryLogItemProps) {
    return (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 rounded-xl p-4 flex items-center justify-between">
            <div>
                <p className="font-bold">{month}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Closed: {closedDate}</p>
            </div>
            <div className="text-right">
                <p className="text-primary font-bold">{totalInterest}</p>
                <p className="text-[10px] uppercase tracking-tighter text-slate-400">Total Interest</p>
            </div>
        </div>
    );
}
