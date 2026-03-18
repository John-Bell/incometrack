import type { Account, InterestAccrual } from '../lib/db';

export const calculateProjectedAnnualInterest = (
    account: Account,
    currentYearAccruals: InterestAccrual[] = [],
    taxYearStartTs: number,
    taxYearEndTs: number
): number => {
    // Schema defaults based on the new fields
    const frequency = account.interestPayoutFrequency || 'monthly';
    const payoutTs = account.interestPayoutDate;

    // Determine the end of the runway for this tax year
    // Cap the runway if there's a specific payout/maturity date within this tax year
    const runwayEndTs = (payoutTs && payoutTs < taxYearEndTs)
        ? payoutTs
        : taxYearEndTs;

    // --- MANUAL TRACKING ---
    if (account.interestTrackingMethod === 'manual') {
        const actualInterestSoFar = currentYearAccruals.reduce(
            (sum, accrual) => sum + (accrual.interestAccrued || 0), 0
        );

        // 1. Lump Sum Intervals (Annually / At Maturity)
        if (frequency === 'annually' || frequency === 'at_maturity') {
            // If they already logged the lump sum this year, there's no more runway needed
            if (currentYearAccruals.length > 0) return actualInterestSoFar;

            // If they haven't logged it, but it pays out this tax year, estimate the lump sum using AER
            if (payoutTs && payoutTs >= taxYearStartTs && payoutTs <= taxYearEndTs) {
                const balance = account.balance || 0;
                const rate = (account.interestRate || 0) / 100;
                return balance * rate;
            }

            // If it doesn't pay this year, and nothing is logged, project 0
            return actualInterestSoFar;
        }

        // 2. Monthly Interval
        if (!currentYearAccruals || currentYearAccruals.length === 0) return 0;

        const sortedAccruals = [...currentYearAccruals].sort((a, b) => a.date - b.date);
        const latestAccrual = sortedAccruals[sortedAccruals.length - 1];

        const latestDate = new Date(latestAccrual.date);
        const endDate = new Date(runwayEndTs);

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

    // 1. Lump Sum Intervals (Annually / At Maturity)
    if (frequency === 'annually' || frequency === 'at_maturity') {
        // If the payout date is in this tax year, they get the full lump sum. Otherwise, 0.
        if (payoutTs && payoutTs >= taxYearStartTs && payoutTs <= taxYearEndTs) {
            return fullYearInterest;
        }
        return 0;
    }

    // 2. Monthly Interval
    if (!payoutTs || payoutTs >= taxYearEndTs) {
        return fullYearInterest;
    }

    // If there IS a payout date that cuts off during the tax year (e.g. a monthly fix maturing), pro-rate the AER.
    const start = new Date(taxYearStartTs);
    const end = new Date(runwayEndTs);
    const activeMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    const safeActiveMonths = Math.max(0, Math.min(12, activeMonths));
    return (fullYearInterest / 12) * safeActiveMonths;
};
