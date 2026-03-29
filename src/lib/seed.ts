import { db } from '@/lib/db'; 
import { TAX_YEAR_CONSTANTS } from '@/constants/taxConstants';

export const syncTaxRules = async () => {
    try {
        // 1. Instantly load the current DB state
        const existingRules = await db.taxRules.toArray();
        const recordsToSync: any[] = [];

        for (const year of Object.keys(TAX_YEAR_CONSTANTS)) {
            const constantRule = TAX_YEAR_CONSTANTS[year] as Record<string, any>;
            const existingRule = existingRules.find(r => r.id === year) as Record<string, any> | undefined;

            // 2. If the year is completely missing from the DB, queue it for addition
            if (!existingRule) {
                recordsToSync.push({ 
                    id: year, 
                    ...constantRule, 
                    updatedAt: Date.now() 
                });
                continue;
            }

            // 3. If it exists, check if any of the actual tax rates/bands have changed.
            // We loop over the keys in the constant (ignoring DB-only keys like updatedAt)
            const needsUpdate = Object.keys(constantRule).some(
                (key) => constantRule[key] !== existingRule[key]
            );

            if (needsUpdate) {
                recordsToSync.push({ 
                    id: year, 
                    ...constantRule, 
                    updatedAt: Date.now() 
                });
            }
        }

        // 4. Only hit the database with a write operation if there are actual changes
        if (recordsToSync.length > 0) {
            await db.taxRules.bulkPut(recordsToSync);
            console.log(`Successfully synced ${recordsToSync.length} updated tax year(s).`);
        } else {
            // Failsafe exit: do nothing!
            console.log('Tax rules are already up to date. Skipping DB write.');
        }

    } catch (error) {
        console.error('Failed to sync tax rules:', error);
    }
};
