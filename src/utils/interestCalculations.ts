import type { Account, InterestAccrual } from '../lib/db';

export const calculateProjectedAnnualInterest = (account: Account, accruals: InterestAccrual[] = []): number => {
    if (account.interestTrackingMethod === 'manual') {
        if (!accruals || accruals.length === 0) return 0;

        // Find the most recent accrual to calculate the annual run-rate
        const latestAccrual = accruals.reduce((latest, current) =>
            current.date > latest.date ? current : latest
        , accruals[0]);

        return (latestAccrual.interestAccrued || 0) * 12;
    }

    // Default AER calculation
    const balance = account.balance || 0;
    const rate = account.interestRate || 0;
    return balance * (rate / 100);
};
