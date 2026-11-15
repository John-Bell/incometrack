import type { Table } from 'dexie';
import { db, getSanitizedDbData } from '@/lib/db';

export interface BackupData {
    version: number;
    data: Record<string, unknown[]>;
}

interface FilePickerWindow extends Window {
    showSaveFilePicker: (options: unknown) => Promise<{
        createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>;
            close: () => Promise<void>;
        }>;
    }>;
    showOpenFilePicker: (options: unknown) => Promise<
        Array<{
            getFile: () => Promise<File>;
        }>
    >;
}

export const exportDatabase = async () => {
    try {
        const backup: BackupData = {
            version: 1,
            data: await getSanitizedDbData()
        };

        // Remove cloudHandle from settings before stringifying to avoid serialization issues
        if (backup.data.settings) {
            backup.data.settings = backup.data.settings.map((s) => {
                const record = { ...(s as Record<string, unknown>) };
                delete record.cloudHandle;
                return record;
            });
        }

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const suggestedName = `incometrack-backup-${new Date().toISOString().split('T')[0]}.json`;

        const fileHandle = await (window as unknown as FilePickerWindow).showSaveFilePicker({
            suggestedName,
            types: [
                {
                    description: 'JSON Files',
                    accept: {
                        'application/json': ['.json'],
                    },
                },
            ],
        });

        try {
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (writeError: unknown) {
            const err = writeError as { name?: string; message?: string };
            if (err.name === 'QuotaExceededError' || (err.message && err.message.toLowerCase().includes('quota'))) {
                alert('Storage quota exceeded. Please free up space on your device.');
                throw writeError;
            } else {
                throw writeError;
            }
        }

        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

export const importDatabase = async () => {
    try {
        const [fileHandle] = await (window as unknown as FilePickerWindow).showOpenFilePicker({
            types: [
                {
                    description: 'JSON Files',
                    accept: {
                        'application/json': ['.json'],
                    },
                },
            ],
        });
        const file = await fileHandle.getFile();

        const contents = await file.text();
        const backupData = JSON.parse(contents) as {
            version?: number;
            data?: Record<string, unknown[]>;
            profile?: unknown[];
            [key: string]: unknown;
        };

        let parsedData: Record<string, unknown[]>;

        if (backupData.version && backupData.data) {
            if (backupData.version !== 1) {
                throw new Error(`Unsupported backup version: ${backupData.version}`);
            }
            parsedData = backupData.data;
        } else if (backupData.profile && Array.isArray(backupData.profile)) {
            parsedData = backupData as Record<string, unknown[]>;
        } else {
            throw new Error('Unrecognized backup format');
        }

        const tables = [
            'profile', 'accounts', 'incomes', 'scenarios', 'settings',
            'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets',
            'paymentMappings', 'interestAccruals', 'properties', 'propertyExpenses', 'propertyIncomes', 'propertyOwnership'
        ];
        const dexieTables = tables.map(t => db.table(t));

        // Wrap in a transaction to ensure atomic restore
        await db.transaction('rw', dexieTables, async () => {
            for (const table of tables) {
                if (parsedData[table]) {
                    const tableRef = db.table(table) as Table<unknown, string>;
                    await tableRef.clear();
                    await tableRef.bulkAdd(parsedData[table]);
                }
            }
        });

        return true;
    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    }
};
