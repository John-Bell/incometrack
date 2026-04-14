import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { calculateProjectedTaxableInterest } from '@/services/accountCalculations';

export function useHybridForecast(taxYearStart: number, taxYearEnd: number) {
    const accounts = useLiveQuery(
        () => db.accounts
            .filter(a =>
                a.balance > 0 &&
                a.interestRate > 0
            )
            .toArray(),
        []
    );

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
