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

export function calculateProjectedTaxableInterest(
    accounts: Account[],
    accruals: InterestAccrual[],
    startTs: number,
    endTs: number
): number {
    const now = Date.now();
    let total = 0;

    for (const account of accounts) {
        if (
            account.category === 'Cash ISA' ||
            account.category === 'Shares ISA' ||
            account.category === 'Premium Bonds' ||
            account.category === 'DC Pension'
        ) {
            continue;
        }

        const accountAccruals = accruals.filter(a => a.accountId === account.id);
        const actuals = accountAccruals.reduce((sum, a) => sum + (a.interestAccrued || 0), 0);

        let daysRemaining = 0;
        if (now > endTs) {
            daysRemaining = 0;
        } else if (now < startTs) {
            daysRemaining = 365;
        } else {
            daysRemaining = (endTs - now) / (1000 * 60 * 60 * 24);
        }

        const balance = account.balance || 0;
        const rate = account.interestRate || 0;
        const forecastAmount = balance * (rate / 100) * (daysRemaining / 365);

        total += actuals + forecastAmount;
    }

    return total;
}

export function calculateBlendedRate(accounts: Account[], allAccruals: InterestAccrual[] = [], taxYear?: string): number {
    const totalSavingsValueForRate = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const { startTs, endTs } = getTaxYearDates(taxYear);

    const totalInterestValue = calculateHybridForecast(accounts, allAccruals, startTs, endTs);

    const blendedRateValue = totalSavingsValueForRate > 0 ? (totalInterestValue / totalSavingsValueForRate) * 100 : 0;

    return blendedRateValue;
}
