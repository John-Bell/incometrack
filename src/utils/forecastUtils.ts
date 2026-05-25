import type { Account, InterestAccrual } from '@/lib/db';

export function calculateHybridForecastForAccount(
    account: Account,
    accountAccruals: InterestAccrual[],
    taxYearStart: number,
    taxYearEnd: number
): number {
    // Step 1: Filter accruals for this account within the tax year
    const relevantAccruals = accountAccruals.filter(
        (accrual) =>
            accrual.date >= taxYearStart &&
            accrual.date <= taxYearEnd
    );

    // Step 2: "YTD Actuals"
    const ytdActuals = relevantAccruals.reduce(
        (sum, accrual) => sum + (accrual.interestAccrued || 0),
        0
    );

    // Step 3: "Projection Start Date"
    let maxAccrualDate = taxYearStart;
    for (const accrual of relevantAccruals) {
        if (accrual.date > maxAccrualDate) {
            maxAccrualDate = accrual.date;
        }
    }
    const projectionStartDate = maxAccrualDate;

    // Step 4: "Projection End Date"
    let projectionEndDate = taxYearEnd;
    if (
        account.interestPayoutFrequency === 'at_maturity' &&
        account.interestPayoutDate
    ) {
        if (account.interestPayoutDate <= taxYearEnd) {
            projectionEndDate = account.interestPayoutDate;
        } else {
            projectionEndDate = projectionStartDate;
        }
    }

    // Step 5: "Future Projection"
    let futureProjection = 0;
    if (projectionStartDate < projectionEndDate) {
        const daysRemaining = (projectionEndDate - projectionStartDate) / 86400000;
        const rate = (account.interestRate || 0) / 100;
        const balance = account.balance || 0;
        const isCompound = account.isCompound === undefined ? true : account.isCompound;

        if (isCompound) {
            // AER daily extraction formula
            futureProjection = balance * (Math.pow(1 + rate, daysRemaining / 365) - 1);
        } else {
            // Simple Interest formula
            futureProjection = balance * rate * (daysRemaining / 365);
        }
    }

    // Step 6: Account Total
    return ytdActuals + futureProjection;
}

export function calculateHybridForecast(
    accounts: Account[],
    accruals: InterestAccrual[],
    taxYearStart: number,
    taxYearEnd: number
): number {
    let grandTotal = 0;

    for (const account of accounts) {
        const accountAccruals = accruals.filter(a => a.accountId === account.id);
        grandTotal += calculateHybridForecastForAccount(account, accountAccruals, taxYearStart, taxYearEnd);
    }

    return grandTotal;
}
