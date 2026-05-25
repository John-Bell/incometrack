import { type Account, type InterestAccrual } from '@/lib/db';
import { calculateHybridForecast, calculateHybridForecastForAccount } from '@/utils/forecastUtils';
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

export function calculateProjectedInterestForAccount(
    account: Account,
    accruals: InterestAccrual[],
    startTs: number,
    endTs: number
): number {
    const accountAccruals = accruals.filter(
        a => a.accountId === account.id && a.date >= startTs && a.date <= endTs
    );
    return calculateHybridForecastForAccount(account, accountAccruals, startTs, endTs);
}

export function calculateProjectedTaxableInterestForAccount(
    account: Account,
    accruals: InterestAccrual[],
    startTs: number,
    endTs: number
): number {
    if (account.category && TAX_FREE_CATEGORIES.includes(account.category as any)) {
        return 0;
    }
    return calculateProjectedInterestForAccount(account, accruals, startTs, endTs);
}

export function calculateProjectedTaxableInterest(
    accounts: Account[],
    accruals: InterestAccrual[],
    startTs: number,
    endTs: number
): number {
    return accounts.reduce((total, account) => {
        return total + calculateProjectedTaxableInterestForAccount(account, accruals, startTs, endTs);
    }, 0);
}

export function calculateBlendedRate(accounts: Account[], allAccruals: InterestAccrual[] = [], taxYear?: string): number {
    const totalSavingsValueForRate = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const { startTs, endTs } = getTaxYearDates(taxYear);

    const totalInterestValue = calculateHybridForecast(accounts, allAccruals, startTs, endTs);

    const blendedRateValue = totalSavingsValueForRate > 0 ? (totalInterestValue / totalSavingsValueForRate) * 100 : 0;

    return blendedRateValue;
}
