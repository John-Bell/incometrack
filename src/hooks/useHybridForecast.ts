import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { calculateHybridForecast } from '@/utils/forecastUtils';
import { TAX_FREE_CATEGORIES } from '@/constants/taxConstants';

export function useHybridForecast(taxYearStart: number, taxYearEnd: number) {
    const accounts = useLiveQuery(
        () => db.accounts
            .filter(a =>
                a.balance > 0 &&
                a.interestRate > 0 &&
                (!a.category || !TAX_FREE_CATEGORIES.includes(a.category as any))
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
        forecastedTotal = calculateHybridForecast(accounts, accruals, taxYearStart, taxYearEnd);
    }

    return { forecastedTotal, isLoading };
}
