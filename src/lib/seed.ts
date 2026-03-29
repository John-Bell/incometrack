import { db } from '@/lib/db';
import { TAX_YEAR_CONSTANTS } from '@/constants/taxConstants';

export const syncTaxRules = async () => {
    try {
        // Since there is no UI for users to edit rules yet, we treat 
        // TAX_YEAR_CONSTANTS as the absolute source of truth.

        // 1. Map all hardcoded constants into the database format
        const recordsToSync = Object.keys(TAX_YEAR_CONSTANTS).map((year) => ({
            id: year,
            ...TAX_YEAR_CONSTANTS[year],
            updatedAt: Date.now()
        }));

        // 2. Use bulkPut instead of bulkAdd. 
        // bulkPut will create the record if it's missing, OR completely 
        // overwrite it if it already exists, ensuring the DB perfectly 
        // matches your updated constants on every app load.
        await db.taxRules.bulkPut(recordsToSync);

        console.log('Successfully synced all tax rules with the latest constants.');

    } catch (error) {
        console.error('Failed to sync tax rules:', error);
    }
};