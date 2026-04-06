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
        return currentYearAccruals
            .filter(a => a.date >= taxYearStartTs && a.date <= taxYearEndTs)
            .reduce(
                (sum, accrual) => sum + (accrual.interestAccrued || 0), 0
            );
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
    if (!payoutTs) {
        return fullYearInterest;
    }


    // If there IS a payout date that cuts off during the tax year (e.g. a monthly fix maturing), pro-rate the AER.
    const start = new Date(taxYearStartTs);
    const end = new Date(runwayEndTs);
    const activeMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    const safeActiveMonths = Math.max(0, Math.min(12, activeMonths));
    return (fullYearInterest / 12) * safeActiveMonths;
};
