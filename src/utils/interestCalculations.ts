import type { Account, InterestAccrual } from '../lib/db';

export const calculateProjectedAnnualInterest = (
    account: Account,
    currentYearAccruals: InterestAccrual[] = [],
    taxYearStartTs: number,
    taxYearEndTs: number
): number => {
    // 1. Determine the end of the runway for this tax year
    // Safely fallback to taxYearEndTs if bonusEndDate is missing or falls outside this tax year
    const runwayEndTs = (account.bonusEndDate && account.bonusEndDate < taxYearEndTs)
        ? account.bonusEndDate
        : taxYearEndTs;

    // --- MANUAL TRACKING ---
    if (account.interestTrackingMethod === 'manual') {
        if (!currentYearAccruals || currentYearAccruals.length === 0) return 0;

        const sortedAccruals = [...currentYearAccruals].sort((a, b) => a.date - b.date);
        const latestAccrual = sortedAccruals[sortedAccruals.length - 1];

        const actualInterestSoFar = sortedAccruals.reduce(
            (sum, accrual) => sum + (accrual.interestAccrued || 0),
            0
        );

        const latestDate = new Date(latestAccrual.date);
        const endDate = new Date(runwayEndTs);

        // Calculate remaining months. Will be <= 0 if the latest entry is past the runway end.
        const monthsRemaining = (endDate.getFullYear() - latestDate.getFullYear()) * 12
                              + (endDate.getMonth() - latestDate.getMonth());

        const safeRemainingMonths = Math.max(0, monthsRemaining);
        const projectedRemaining = (latestAccrual.interestAccrued || 0) * safeRemainingMonths;

        return actualInterestSoFar + projectedRemaining;
    }

    // --- AUTOMATIC AER TRACKING ---
    const balance = account.balance || 0;
    const rate = (account.interestRate || 0) / 100;
    const fullYearInterest = balance * rate;

    // If there is no bonusEndDate, or it extends past the tax year, they get the full year AER.
    if (!account.bonusEndDate || account.bonusEndDate >= taxYearEndTs) {
        return fullYearInterest;
    }

    // If there IS a bonusEndDate that cuts off during the tax year, pro-rate the AER.
    const start = new Date(taxYearStartTs);
    const end = new Date(runwayEndTs);
    const activeMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    const safeActiveMonths = Math.max(0, Math.min(12, activeMonths));
    return (fullYearInterest / 12) * safeActiveMonths;
};
