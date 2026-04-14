import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { calculateProjectedTaxableInterest } from '@/services/accountCalculations';

export function useHybridForecast(taxYearStart: number, taxYearEnd: number) {
    const accounts = useLiveQuery(() => db.accounts.toArray(), []);

    const accruals = useLiveQuery(
        () => db.interestAccruals.where('date').between(taxYearStart, taxYearEnd, true, true).toArray(),
        [taxYearStart, taxYearEnd]
    );

    const isLoading = accounts === undefined || accruals === undefined;

    let forecastedTotal = 0;
    if (!isLoading && accounts && accruals) {
        forecastedTotal = calculateProjectedTaxableInterest(accounts, accruals, taxYearStart, taxYearEnd);
    }

    return { forecastedTotal, isLoading };
}
