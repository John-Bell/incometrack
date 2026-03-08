import Papa from 'papaparse';
import { db, type Budget } from '../lib/db';

export class DataImportService {
    /**
     * Parse a CSV or JSON file and return an array of objects.
     */
    static async parseFile(file: File): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const json = JSON.parse(e.target?.result as string);
                        resolve(Array.isArray(json) ? json : [json]);
                    } catch (err) {
                        reject(new Error('Failed to parse JSON file'));
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            } else if (file.name.endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results: any) => {
                        resolve(results.data);
                    },
                    error: (error: any) => {
                        reject(error);
                    }
                });
            } else {
                reject(new Error('Unsupported file type. Please use CSV or JSON.'));
            }
        });
    }

    /**
     * Generate a deterministic string hash for ID fallback.
     */
    static generateDeterministicId(row: any, targetTable: string): string {
        let sourceString = '';
        if (targetTable === 'transactions') {
            sourceString = `${row.date || ''}-${row.amount || ''}-${row.payee || ''}-${row.rawDesc || ''}-${row.category || ''}`;
        } else if (targetTable === 'budgets') {
            sourceString = `${row.category || ''}-${row.name || ''}-${row.amount || ''}`;
        } else if (targetTable === 'accounts') {
            sourceString = `${row.name || ''}-${row.category || ''}-${row.ownerId || ''}`;
        } else {
            sourceString = JSON.stringify(row);
        }

        let hash = 0;
        for (let i = 0; i < sourceString.length; i++) {
            const char = sourceString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `import-${targetTable}-${Math.abs(hash)}`;
    }

    static async importData(
        targetTable: 'accounts' | 'budgets' | 'transactions',
        data: any[],
        filename: string,
        fieldMapping: Record<string, string>
    ): Promise<number> {
        if (!data || data.length === 0) return 0;

        const importId = filename;
        const now = Date.now();
        const recordsToInsert: any[] = [];

        // Pre-fetch budgets if we are importing transactions to handle linking
        let budgets: Budget[] = [];
        if (targetTable === 'transactions') {
            budgets = await db.budgets.toArray();
        }

        for (const row of data) {
            // Map the source row to our database schema using fieldMapping
            const mappedRow: any = {};

            for (const [sourceKey, targetKey] of Object.entries(fieldMapping)) {
                if (targetKey && row[sourceKey] !== undefined && row[sourceKey] !== '') {
                    // Type conversions based on target keys
                    if (targetKey === 'amount' || targetKey === 'balance' || targetKey === 'interestRate') {
                        const parsed = parseFloat(String(row[sourceKey]).replace(/[^0-9.-]+/g, ""));
                        mappedRow[targetKey] = isNaN(parsed) ? 0 : parsed;
                    } else if (targetKey === 'date' || targetKey === 'bonusEndDate') {
                        const parsedDate = new Date(row[sourceKey]).getTime();
                        mappedRow[targetKey] = isNaN(parsedDate) ? Date.now() : parsedDate;
                    } else if (targetKey === 'bonusRateActive') {
                        mappedRow[targetKey] = String(row[sourceKey]).toLowerCase() === 'true';
                    } else {
                        mappedRow[targetKey] = row[sourceKey];
                    }
                }
            }

            // Determine ID
            if (!mappedRow.id) {
                mappedRow.id = this.generateDeterministicId(mappedRow, targetTable);
            }

            // Set metadata
            mappedRow.importId = importId;
            mappedRow.updatedAt = now;

            // Table-specific logic
            if (targetTable === 'transactions') {
                if (!mappedRow.date) mappedRow.date = now;
                if (!mappedRow.type) mappedRow.type = mappedRow.amount >= 0 ? 'income' : 'expense';

                // Transaction Linking logic
                if (mappedRow.category && !mappedRow.budgetId) {
                    const categoryLower = mappedRow.category.toLowerCase();
                    const matchedBudget = budgets.find(b =>
                        (b.importMappingName && b.importMappingName.toLowerCase() === categoryLower) ||
                        (b.name && b.name.toLowerCase() === categoryLower) ||
                        (b.category && b.category.toLowerCase() === categoryLower)
                    );

                    if (matchedBudget) {
                        mappedRow.budgetId = matchedBudget.id;
                    }
                }
            } else if (targetTable === 'budgets') {
                if (!mappedRow.frequency) mappedRow.frequency = 'monthly';
                if (!mappedRow.paymentSource) mappedRow.paymentSource = 'Monthly Bills';
            } else if (targetTable === 'accounts') {
                if (!mappedRow.ownerId) mappedRow.ownerId = 'default';
                if (mappedRow.balance === undefined) mappedRow.balance = 0;
                if (mappedRow.interestRate === undefined) mappedRow.interestRate = 0;
            }

            recordsToInsert.push(mappedRow);
        }

        // Perform bulk upsert in a transaction
        await db.transaction('rw', db[targetTable], async () => {
            await (db as any)[targetTable].bulkPut(recordsToInsert);
        });

        return recordsToInsert.length;
    }
}
