import { db } from '@/lib/db'; // Adjust this import path to where your Dexie instance lives
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

