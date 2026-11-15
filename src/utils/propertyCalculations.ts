import type { PropertyIncome, PropertyOwnership, PropertyExpense } from '@/lib/db';

export function calculatePropertyIncomeForTaxYear(

    propertyIncomes: PropertyIncome[],
    propertyOwnerships: PropertyOwnership[],
    startTs: number,
    endTs: number
): { p1Rental: number; p2Rental: number } {
    let p1Rental = 0;
    let p2Rental = 0;

    for (const income of propertyIncomes) {
        if (income.date >= startTs && income.date <= endTs) {
            // Find ownership for this property at the time of income
            // Assuming ownerships are sorted by startDate descending (latest first)
            // or we need to find the one that applies (startDate <= income.date)
            // Let's filter by propertyId and find the latest one before or on income.date
            const ownershipsForProperty = propertyOwnerships.filter(o => o.propertyId === income.propertyId);
            // sort by start date descending
            ownershipsForProperty.sort((a, b) => b.startDate - a.startDate);

            const applicableOwnership = ownershipsForProperty.find(o => o.startDate <= income.date);

            if (applicableOwnership) {
                p1Rental += income.amount * (applicableOwnership.person1Percent / 100);
                p2Rental += income.amount * (applicableOwnership.person2Percent / 100);
            }
        }
    }

    return { p1Rental, p2Rental };
}

export function calculatePropertyExpensesForTaxYear(
    propertyExpenses: PropertyExpense[],
    propertyOwnerships: PropertyOwnership[],
    startTs: number,
    endTs: number
): { p1Expenses: number; p2Expenses: number } {
    let p1Expenses = 0;
    let p2Expenses = 0;

    for (const expense of propertyExpenses) {
        if (expense.date >= startTs && expense.date <= endTs) {
            const ownershipsForProperty = propertyOwnerships.filter(o => o.propertyId === expense.propertyId);
            ownershipsForProperty.sort((a, b) => b.startDate - a.startDate);

            const applicableOwnership = ownershipsForProperty.find(o => o.startDate <= expense.date);

            if (applicableOwnership) {
                p1Expenses += expense.amount * (applicableOwnership.person1Percent / 100);
                p2Expenses += expense.amount * (applicableOwnership.person2Percent / 100);
            }
        }
    }

    return { p1Expenses, p2Expenses };
}

export function calculatePropertyTotalsForRange(
    propertyId: string,
    incomes: PropertyIncome[],
    expenses: PropertyExpense[],
    startTs: number,
    endTs: number
): { totalIncomes: number; totalExpenses: number } {
    const totalIncomes = incomes
        .filter(i => i.propertyId === propertyId && i.date >= startTs && i.date <= endTs)
        .reduce((sum, i) => sum + i.amount, 0);

    const totalExpenses = expenses
        .filter(e => e.propertyId === propertyId && e.date >= startTs && e.date <= endTs)
        .reduce((sum, e) => sum + e.amount, 0);

    return { totalIncomes, totalExpenses };
}

export function filterPropertyRecordsByTaxYearAndProperty<T extends { propertyId: string; date: number }>(
    records: T[],
    propertyIdFilter: string,
    startTs: number,
    endTs: number
): T[] {
    return [...records]
        .sort((a, b) => b.date - a.date)
        .filter(record => {
            const matchesProperty = propertyIdFilter === 'all' || record.propertyId === propertyIdFilter;
            const matchesTaxYear = record.date >= startTs && record.date <= endTs;
            return matchesProperty && matchesTaxYear;
        });
}

export function filterPropertyOwnerships(
    ownerships: PropertyOwnership[],
    propertyIdFilter: string
): PropertyOwnership[] {
    const sorted = [...ownerships].sort((a, b) => b.startDate - a.startDate);
    if (propertyIdFilter === 'all') return sorted;
    return sorted.filter(o => o.propertyId === propertyIdFilter);
}

export function calculateComplementaryOwnershipSplit(
    person1Input: string
): { person1Percent: string; person2Percent: string } | null {
    if (person1Input === '') {
        return { person1Percent: '', person2Percent: '' };
    }
    const numVal = Number(person1Input);
    if (!isNaN(numVal) && numVal >= 0 && numVal <= 100) {
        return {
            person1Percent: person1Input,
            person2Percent: (100 - numVal).toString(),
        };
    }
    return null;
}

export function buildPropertyListRedirectUrl(
    basePath: string,
    propertyId?: string | null
): string {
    if (propertyId && propertyId !== 'all') {
        return `${basePath}?propertyId=${propertyId}`;
    }
    return basePath;
}
