import type { PropertyIncome, PropertyOwnership } from '@/lib/db';

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
