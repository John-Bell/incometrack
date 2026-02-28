import { db } from '@/lib/db'; // Adjust this import path to where your Dexie instance lives
import type { Account, Income } from '@/lib/db';
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
            category: "Easy Access Savings",
            balance: 85000,
            interestRate: 5.20,
            updatedAt: 1708722000000,
            alertText: "Bonus ends Oct 24",
            alertType: "warning",
            bonusRateActive: true,
            bonusEndDate: 1730332800000,
            notes: "Joint account for house deposit"
        },
        {
            id: "acc-barclays-002",
            ownerId: "person1",
            name: "Barclays Rainy Day",
            category: "Easy Access Savings",
            balance: 5000,
            interestRate: 5.12,
            updatedAt: 1697068800000,
            bonusRateActive: false,
            notes: "Emergency fund"
        },
        {
            id: "acc-nationwide-003",
            ownerId: "person2",
            name: "Nationwide FlexDirect",
            category: "Current Account",
            balance: 1500,
            interestRate: 1.00,
            updatedAt: 1708894800000,
            alertText: "Rate dropped",
            alertType: "error",
            bonusRateActive: false,
            notes: "Everyday spending"
        },
        {
            id: "acc-lloyds-004",
            ownerId: "joint",
            name: "Lloyds Club",
            category: "Easy Access Savings",
            balance: 50000,
            interestRate: 4.50,
            updatedAt: 1696032000000,
            bonusRateActive: false,
            notes: "Holiday fund"
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

export const seedDummyIncomes = async () => {
    const dummyIncomes: Income[] = [
        {
            id: "inc-p1-employment",
            ownerId: "person1",
            name: "Employment / Other",
            amount: 21070,
            frequency: "annual",
            type: "employment",
            taxCategory: "Earned"
        },
        {
            id: "inc-p1-pension",
            ownerId: "person1",
            name: "State / Private Pension",
            amount: 11500,
            frequency: "annual",
            type: "pension",
            taxCategory: "Pension"
        },
        {
            id: "inc-p1-rental",
            ownerId: "person1",
            name: "Rental Income (Net)",
            amount: 12000,
            frequency: "annual",
            type: "rental",
            taxCategory: "Earned"
        },
        {
            id: "inc-p1-dividends",
            ownerId: "person1",
            name: "Total Dividends",
            amount: 0,
            frequency: "annual",
            type: "dividends",
            taxCategory: "Dividend"
        },
        {
            id: "inc-p2-employment",
            ownerId: "person2",
            name: "Employment / Other",
            amount: 0,
            frequency: "annual",
            type: "employment",
            taxCategory: "Earned"
        },
        {
            id: "inc-p2-pension",
            ownerId: "person2",
            name: "State / Private Pension",
            amount: 0,
            frequency: "annual",
            type: "pension",
            taxCategory: "Pension"
        },
        {
            id: "inc-p2-rental",
            ownerId: "person2",
            name: "Rental Income (Net)",
            amount: 0,
            frequency: "annual",
            type: "rental",
            taxCategory: "Earned"
        },
        {
            id: "inc-p2-dividends",
            ownerId: "person2",
            name: "Total Dividends",
            amount: 0,
            frequency: "annual",
            type: "dividends",
            taxCategory: "Dividend"
        }
    ];

    try {
        await db.incomes.bulkPut(dummyIncomes);
        console.log('Successfully seeded dummy incomes into Dexie.');
    } catch (error) {
        console.error('Failed to seed dummy incomes:', error);
    }
};