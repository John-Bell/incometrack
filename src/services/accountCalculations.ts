import { type Account, type InterestAccrual } from '@/lib/db';
import { calculateHybridForecast } from '@/utils/forecastUtils';
import { getTaxYearDates, TAX_FREE_CATEGORIES } from '@/constants/taxConstants';

export function calculateTotalSavings(accounts: Account[]): number {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
}

export function calculateNonPensionSavings(accounts: Account[]): number {
    return accounts.reduce((sum, acc) => acc.category !== 'DC Pension' ? sum + (acc.balance || 0) : sum, 0);
}

export function calculateTaxableSavings(accounts: Account[]): number {
    return accounts.reduce((sum, acc) => {
        if (acc.category && TAX_FREE_CATEGORIES.includes(acc.category as any)) {
            return sum;
        }
        return sum + (acc.balance || 0);
    }, 0);
}

export function calculateProjectedTaxableInterest(accounts: Account[], allAccruals: InterestAccrual[] = [], startTs: number, endTs: number): number {
    const filteredAccounts = accounts.filter(acc => !acc.category || !TAX_FREE_CATEGORIES.includes(acc.category as any));

    return calculateHybridForecast(filteredAccounts, allAccruals, startTs, endTs);
}

export function calculateBlendedRate(accounts: Account[], allAccruals: InterestAccrual[] = [], taxYear?: string): number {
    const totalSavingsValueForRate = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const { startTs, endTs } = getTaxYearDates(taxYear);

    const totalInterestValue = calculateHybridForecast(accounts, allAccruals, startTs, endTs);

    const blendedRateValue = totalSavingsValueForRate > 0 ? (totalInterestValue / totalSavingsValueForRate) * 100 : 0;

    return blendedRateValue;
}
