import { type Account } from '@/lib/db';

export function calculateTotalSavings(accounts: Account[]): number {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
}

export function calculateBlendedRate(accounts: Account[]): number {
    const accountsWithRate = accounts.filter(acc => acc.interestRate && acc.interestRate > 0);
    const totalSavingsValueForRate = accountsWithRate.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalInterestValue = accountsWithRate.reduce((sum, acc) => sum + ((acc.balance || 0) * (acc.interestRate / 100)), 0);
    const blendedRateValue = totalSavingsValueForRate > 0 ? (totalInterestValue / totalSavingsValueForRate) * 100 : 0;

    return blendedRateValue;
}
