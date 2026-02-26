import { db } from '@/lib/db'; // Adjust this import path to where your Dexie instance lives
import type { Account } from '@/lib/db';
import { TAX_YEAR_CONSTANTS } from '@/constants/taxConstants';

export const syncTaxRules = async () => {
    try {
        // 1. Fetch only the primary keys (the 'id' strings like "2024-2025") 
        // This is very fast and avoids loading whole objects into memory.
        const existingYears = await db.taxRules.toCollection().primaryKeys();

        // 2. Filter your constants to find only the years missing from the database
        const missingYears = Object.keys(TAX_YEAR_CONSTANTS).filter(
            (year) => !existingYears.includes(year as string)
        );

        // 3. If there's nothing new, exit silently
        if (missingYears.length === 0) {
            return;
        }

        // 4. Construct the new records using your constants
        const recordsToAdd = missingYears.map((year) => ({
            id: year,
            ...TAX_YEAR_CONSTANTS[year],
        }));

        // 5. Use bulkAdd to insert them. 
        // Because we pre-filtered, we won't hit any Duplicate Key errors, 
        // and your manual edits on existing years are completely ignored and safe.
        await db.taxRules.bulkAdd(recordsToAdd);

        console.log(`Successfully added new tax year rules for: ${missingYears.join(', ')}`);

    } catch (error) {
        console.error('Failed to sync tax rules:', error);
    }
};

export const seedDummyAccounts = async () => {
    const dummyAccounts: Account[] = [
        {
            id: "acc-santander-001",
            ownerId: "joint",
            name: "Santander eSaver",
            type: "Savings",
            balance: 85000,
            institutionName: "Santander",
            institutionCode: "S",
            interestRate: 5.20,
            updatedAt: 1708722000000,
            alertText: "Bonus ends Oct 24",
            alertType: "warning",
            taxWrapper: "Standard"
        },
        {
            id: "acc-barclays-002",
            ownerId: "person1",
            name: "Barclays Rainy Day",
            type: "Savings",
            balance: 5000,
            institutionName: "Barclays",
            institutionCode: "B",
            interestRate: 5.12,
            updatedAt: 1697068800000,
            taxWrapper: "Standard"
        },
        {
            id: "acc-nationwide-003",
            ownerId: "person2",
            name: "Nationwide FlexDirect",
            type: "Current",
            balance: 1500,
            institutionName: "Nationwide",
            institutionCode: "N",
            interestRate: 1.00,
            updatedAt: 1708894800000,
            alertText: "Rate dropped",
            alertType: "error",
            taxWrapper: "Standard"
        },
        {
            id: "acc-lloyds-004",
            ownerId: "joint",
            name: "Lloyds Club",
            type: "Savings",
            balance: 50000,
            institutionName: "Lloyds",
            institutionCode: "L",
            interestRate: 4.50,
            updatedAt: 1696032000000,
            taxWrapper: "Standard"
        }
    ];

    try {
        // bulkPut will insert new records or update existing ones with matching IDs
        await db.accounts.bulkPut(dummyAccounts);
        console.log('Successfully seeded dummy accounts into Dexie.');
    } catch (error) {
        console.error('Failed to seed dummy accounts:', error);
    }
};