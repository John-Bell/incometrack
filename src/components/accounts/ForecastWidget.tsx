import { useHybridForecast } from '@/hooks/useHybridForecast';

interface ForecastWidgetProps {
    startTs: number;
    endTs: number;
}

export function ForecastWidget({ startTs, endTs }: ForecastWidgetProps) {
    const { forecastedTotal, isLoading } = useHybridForecast(startTs, endTs);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-primary/10 shadow-sm animate-pulse">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
        );
    }

    const formattedTotal = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(forecastedTotal);

    return (
        <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-2xl border border-primary/20 shadow-sm flex flex-col gap-1">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Projected Tax Year Interest
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {formattedTotal}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Based on actuals + forecasted AER/Simple interest
            </p>
        </div>
    );
}
