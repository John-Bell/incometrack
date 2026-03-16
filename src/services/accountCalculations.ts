import { type Account, type InterestAccrual } from '@/lib/db';
import { calculateProjectedAnnualInterest } from '@/utils/interestCalculations';

export function calculateTotalSavings(accounts: Account[]): number {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
}

export function calculateNonPensionSavings(accounts: Account[]): number {
    return accounts.reduce((sum, acc) => acc.category !== 'DC Pension' ? sum + (acc.balance || 0) : sum, 0);
}

export function calculateTaxableSavings(accounts: Account[]): number {
    const excludedCategories = ['DC Pension', 'Premium Bonds', 'Cash ISA'];
    return accounts.reduce((sum, acc) => {
        if (acc.category && excludedCategories.includes(acc.category)) {
            return sum;
        }
        return sum + (acc.balance || 0);
    }, 0);
}

export function calculateBlendedRate(accounts: Account[], allAccruals: InterestAccrual[] = []): number {
    const totalSavingsValueForRate = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalInterestValue = accounts.reduce((sum, acc) => {
        const accountAccruals = allAccruals.filter(a => a.accountId === acc.id);
        return sum + calculateProjectedAnnualInterest(acc, accountAccruals);
    }, 0);

    const blendedRateValue = totalSavingsValueForRate > 0 ? (totalInterestValue / totalSavingsValueForRate) * 100 : 0;

    return blendedRateValue;
}
