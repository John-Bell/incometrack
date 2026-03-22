import { db, getSanitizedDbData } from '@/lib/db';

export interface BackupData {
    version: number;
    data: Record<string, any[]>;
}

export const exportDatabase = async () => {
    try {
        const backup: BackupData = {
            version: 1,
            data: await getSanitizedDbData()
        };

        // Remove cloudHandle from settings before stringifying to avoid serialization issues
        if (backup.data.settings) {
            backup.data.settings = backup.data.settings.map((s: any) => {
                const { cloudHandle, ...rest } = s;
                return rest;
            });
        }

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const suggestedName = `incometrack-backup-${new Date().toISOString().split('T')[0]}.json`;

        const fileHandle = await (window as any).showSaveFilePicker({
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
        } catch (writeError: any) {
            if (writeError.name === 'QuotaExceededError' || (writeError.message && writeError.message.toLowerCase().includes('quota'))) {
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
        let file: File;

        const [fileHandle] = await (window as any).showOpenFilePicker({
            types: [
                {
                    description: 'JSON Files',
                    accept: {
                        'application/json': ['.json'],
                    },
                },
            ],
        });
        file = await fileHandle.getFile();

        const contents = await file.text();
        const backupData: any = JSON.parse(contents);

        let parsedData: any;

        if (backupData.version && backupData.data) {
            if (backupData.version !== 1) {
                throw new Error(`Unsupported backup version: ${backupData.version}`);
            }
            parsedData = backupData.data;
        } else if (backupData.profile && Array.isArray(backupData.profile)) {
            parsedData = backupData;
        } else {
            throw new Error('Unrecognized backup format');
        }

        const tables = [
            'profile', 'accounts', 'incomes', 'scenarios', 'settings',
            'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets',
            'paymentMappings'
        ];
        const dexieTables = tables.map(t => (db as any)[t]);

        // Wrap in a transaction to ensure atomic restore
        await db.transaction('rw', dexieTables, async () => {
            for (const table of tables) {
                if (parsedData[table]) {
                    await (db as any)[table].clear();
                    await (db as any)[table].bulkAdd(parsedData[table]);
                }
            }
        });

        return true;
    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    }
};
