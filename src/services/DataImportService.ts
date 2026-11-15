import Papa, { type ParseResult } from 'papaparse';
import type { Table } from 'dexie';
import { db, type Budget } from '../lib/db';

export type ImportRow = Record<string, unknown>;

export class DataImportService {
    /**
     * Parse a CSV or JSON file and return an array of objects.
     */
    static async parseFile(file: File): Promise<ImportRow[]> {
        return new Promise((resolve, reject) => {
            if (file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const json = JSON.parse(e.target?.result as string) as ImportRow | ImportRow[];
                        resolve(Array.isArray(json) ? json : [json]);
                    } catch {
                        reject(new Error('Failed to parse JSON file'));
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            } else if (file.name.endsWith('.csv')) {
                Papa.parse<ImportRow>(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results: ParseResult<ImportRow>) => {
                        resolve(results.data);
                    },
                    error: (error: Error) => {
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
    static generateDeterministicId(row: ImportRow, targetTable: string): string {
        let sourceString = '';
        if (targetTable === 'transactions') {
            sourceString = `${row.date || ''}-${row.amount || ''}-${row.payee || ''}-${row.rawDesc || ''}-${row.importCategory || ''}`;
        } else if (targetTable === 'budgets') {
            sourceString = `${row.importCategory || ''}-${row.name || ''}-${row.amount || ''}`;
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
        data: ImportRow[],
        filename: string,
        fieldMapping: Record<string, string>
    ): Promise<number> {
        if (!data || data.length === 0) return 0;

        const importId = filename;
        const now = Date.now();
        const recordsToInsert: ImportRow[] = [];

        // Pre-fetch budgets if we are importing transactions to handle linking
        let budgets: Budget[] = [];
        if (targetTable === 'transactions') {
            budgets = await db.budgets.toArray();
        }

        for (const row of data) {
            // Map the source row to our database schema using fieldMapping
            const mappedRow: ImportRow = {};

            for (const [sourceKey, targetKey] of Object.entries(fieldMapping)) {
                if (targetKey && row[sourceKey] !== undefined && row[sourceKey] !== '') {
                    // Type conversions based on target keys
                    if (targetKey === 'amount' || targetKey === 'balance' || targetKey === 'interestRate') {
                        const parsed = parseFloat(String(row[sourceKey]).replace(/[^0-9.-]+/g, ""));
                        mappedRow[targetKey] = isNaN(parsed) ? 0 : parsed;
                    } else if (targetKey === 'date' || targetKey === 'bonusEndDate' || targetKey === 'budgetStartDate') {
                        const parsedDate = new Date(String(row[sourceKey])).getTime();
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
                if (!mappedRow.type) mappedRow.type = Number(mappedRow.amount) >= 0 ? 'income' : 'expense';

                // Transaction Linking logic
                if (typeof mappedRow.importCategory === 'string' && !mappedRow.budgetId) {
                    const categoryLower = mappedRow.importCategory.toLowerCase();
                    const matchedBudget = budgets.find(b =>
                        (b.importMappingName && b.importMappingName.toLowerCase() === categoryLower) ||
                        (b.name && b.name.toLowerCase() === categoryLower)
                    );

                    if (matchedBudget) {
                        mappedRow.budgetId = matchedBudget.id;
                    }
                }

                // Cleanup temporary mapping field
                delete mappedRow.importCategory;
            } else if (targetTable === 'budgets') {
                if (!mappedRow.frequency) mappedRow.frequency = 'monthly';
                if (!mappedRow.budgetStartDate) mappedRow.budgetStartDate = new Date(2026, 3, 1).getTime();
                if (mappedRow.oneOffBudget === undefined) mappedRow.oneOffBudget = false;

                // Cleanup temporary mapping field
                delete mappedRow.importCategory;
            } else if (targetTable === 'accounts') {
                if (!mappedRow.ownerId) mappedRow.ownerId = 'default';
                if (mappedRow.balance === undefined) mappedRow.balance = 0;
                if (mappedRow.interestRate === undefined) mappedRow.interestRate = 0;
            }

            recordsToInsert.push(mappedRow);
        }

        // Perform bulk upsert in a transaction
        const tableRef = db.table(targetTable) as Table<ImportRow, string>;
        await db.transaction('rw', db[targetTable], async () => {
            await tableRef.bulkPut(recordsToInsert);
        });

        return recordsToInsert.length;
    }
}
