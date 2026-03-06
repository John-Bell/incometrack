import { db } from '@/lib/db';

export interface BackupData {
    version: number;
    data: {
        profile: any[];
        accounts: any[];
        incomes: any[];
        scenarios: any[];
    };
}

export const exportDatabase = async () => {
    try {
        const backup: BackupData = {
            version: 1,
            data: {
                profile: await db.profile.toArray(),
                accounts: await db.accounts.toArray(),
                incomes: await db.incomes.toArray(),
                scenarios: await db.scenarios.toArray(),
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const suggestedName = `incometrack-backup-${new Date().toISOString().split('T')[0]}.json`;

        if (!('showSaveFilePicker' in window)) {
            // Fallback for browsers that don't support showSaveFilePicker (like iOS Safari)
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = suggestedName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            return true;
        }

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

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        return true;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
};

export const importDatabase = async () => {
    try {
        let file: File;

        if (!('showOpenFilePicker' in window)) {
            // Fallback for browsers that don't support showOpenFilePicker (like iOS Safari)
            file = await new Promise<File>((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.chaser';
                input.onchange = (e: any) => {
                    const selectedFile = e.target.files[0];
                    if (selectedFile) {
                        resolve(selectedFile);
                    } else {
                        reject(new Error('No file selected'));
                    }
                };
                input.oncancel = () => {
                    reject(new Error('File selection cancelled'));
                };
                input.click();
            });
        } else {
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
        }

        const contents = await file.text();
        const backup: BackupData = JSON.parse(contents);

        if (backup.version !== 1) {
            throw new Error(`Unsupported backup version: ${backup.version}`);
        }

        // Wrap in a transaction to ensure atomic restore
        await db.transaction('rw', db.profile, db.accounts, db.incomes, db.scenarios, async () => {
            await db.profile.clear();
            await db.accounts.clear();
            await db.incomes.clear();
            await db.scenarios.clear();

            await db.profile.bulkAdd(backup.data.profile || []);
            await db.accounts.bulkAdd(backup.data.accounts || []);
            await db.incomes.bulkAdd(backup.data.incomes || []);
            await db.scenarios.bulkAdd(backup.data.scenarios || []);
        });

        return true;
    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    }
};
