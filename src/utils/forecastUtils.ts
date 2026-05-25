import type { Account, InterestAccrual } from '@/lib/db';

export function calculateHybridForecastForAccount(
    account: Account,
    accountAccruals: InterestAccrual[],
    taxYearStart: number,
    taxYearEnd: number
): number {
    const rate = (account.interestRate || 0) / 100;
    const balance = account.balance || 0;
    const isCompound = account.isCompound === undefined ? true : account.isCompound;

    let totalInterest = 0;

    const startDate = new Date(taxYearStart);

    // Iterate month by month for exactly 12 months (April to March)
    let currentMonth = startDate.getMonth();
    let currentYear = startDate.getFullYear();

    for (let i = 0; i < 12; i++) {
        // Find accruals for this specific month
        const monthAccruals = accountAccruals.filter(a => {
            const d = new Date(a.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });

        if (monthAccruals.length > 0) {
            // "If they have actuals logged, use exactly the manual override"
            const sum = monthAccruals.reduce((s, a) => s + (a.interestAccrued || 0), 0);
            totalInterest += sum;
        } else {
            // "If empty, automated forecast"
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            // Handle maturity logic
            let activeDaysInMonth = daysInMonth;

            if (account.interestPayoutFrequency === 'at_maturity' && account.interestPayoutDate) {
                const payoutDate = new Date(account.interestPayoutDate);

                if (payoutDate.getFullYear() < currentYear || (payoutDate.getFullYear() === currentYear && payoutDate.getMonth() < currentMonth)) {
                    // Past maturity month
                    activeDaysInMonth = 0;
                } else if (payoutDate.getFullYear() === currentYear && payoutDate.getMonth() === currentMonth) {
                    // Maturity month
                    activeDaysInMonth = payoutDate.getDate();
                }
            }

            if (activeDaysInMonth > 0) {
                let monthlyForecast = 0;
                if (isCompound) {
                    // Balance * ((1 + Rate)^ (1/12) - 1)
                    monthlyForecast = balance * (Math.pow(1 + rate, 1/12) - 1);
                } else {
                    // Simple interest forecast per month = (Balance * Rate) / 12
                    monthlyForecast = (balance * rate) / 12;
                }

                // Pro-rate if partial month (due to maturity)
                if (activeDaysInMonth < daysInMonth) {
                    monthlyForecast = monthlyForecast * (activeDaysInMonth / daysInMonth);
                }

                totalInterest += monthlyForecast;
            }
        }

        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }

    return totalInterest;
}
export function calculateHybridForecast(
    accounts: Account[],
    accruals: InterestAccrual[],
    taxYearStart: number,
    taxYearEnd: number
): number {
    let grandTotal = 0;

    for (const account of accounts) {
        // Step 1: Filter accruals for this account within the tax year
        const accountAccruals = accruals.filter(
            (accrual) =>
                accrual.accountId === account.id &&
                accrual.date >= taxYearStart &&
                accrual.date <= taxYearEnd
        );

        grandTotal += calculateHybridForecastForAccount(account, accountAccruals, taxYearStart, taxYearEnd);
    }

    return grandTotal;
}
