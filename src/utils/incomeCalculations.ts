import type { Income } from '@/lib/db';

/**
 * Checks if an income record is valid (overlaps) during a given tax year.
 *
 * If no start date is set then it means it has started before the current tax year.
 * If no end date is set then it means the income has no current end date.
 *
 * @param income The income record to check.
 * @param taxYearStartTs Start timestamp of the tax year (inclusive).
 * @param taxYearEndTs End timestamp of the tax year (inclusive).
 * @returns True if the income is valid during the tax year.
 */
export function isIncomeValidInTaxYear(
    income: Income,
    taxYearStartTs: number,
    taxYearEndTs: number
): boolean {
    const incomeStart = income.startDate ?? -Infinity;
    const incomeEnd = income.endDate ?? Infinity;

    // Overlap logic:
    // (Income starts before or at the end of the tax year) AND (Income ends after or at the start of the tax year)
    return incomeStart <= taxYearEndTs && incomeEnd >= taxYearStartTs;
}
