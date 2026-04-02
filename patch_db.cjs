const fs = require('fs');
let code = fs.readFileSync('src/lib/db.ts', 'utf8');

// 1. Add Tombstone interface
if (!code.includes('export interface Tombstone')) {
    code = code.replace('export interface Profile {', `export interface Tombstone {
    id: string;
    deletedId: string;
    tableName: string;
    deletedAt: number;
}

export interface Profile {`);
}

// 2. Add tombstones to DB type
if (!code.includes('tombstones: EntityTable<Tombstone, \'id\'>;')) {
    code = code.replace('propertyOwnership: EntityTable<PropertyOwnership, \'id\'>;\n}', `propertyOwnership: EntityTable<PropertyOwnership, 'id'>;
    tombstones: EntityTable<Tombstone, 'id'>;
}`);
}

// 3. Add version 12
if (!code.includes('db.version(12).stores({')) {
    code = code.replace(/db\.version\(11\)\.stores\(\{[\s\S]*?\}\)\.upgrade\(tx => \{[\s\S]*?\}\);/, match => match + `

db.version(12).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, importId, updatedAt',
    incomes: '&id, ownerId, name, frequency, type, taxCategory, updatedAt',
    scenarios: '&id, name, updatedAt',
    settings: '&id',
    monthlyArchives: '&id, month, year, updatedAt',
    notifications: '&id, date, read, updatedAt',
    taxRules: '&id, updatedAt',
    budgets: '&id, accountId, name, importId, updatedAt',
    transactions: '&id, date, type, budgetId, accountId, importId, updatedAt',
    paymentMappings: '&id, paymentName, *budgetIds, updatedAt',
    interestAccruals: '&id, accountId, date, updatedAt',
    properties: '&id, name, updatedAt',
    propertyExpenses: '&id, propertyId, date, updatedAt',
    propertyIncomes: '&id, propertyId, date, updatedAt',
    propertyOwnership: '&id, propertyId, startDate, updatedAt',
    tombstones: '&id, deletedId, tableName, deletedAt'
});`);
}

// 4. Add tombstones to getSanitizedDbData
if (!code.includes('tombstones: await db.tombstones.toArray()')) {
    code = code.replace('propertyOwnership: await db.propertyOwnership.toArray(),', `propertyOwnership: await db.propertyOwnership.toArray(),
        tombstones: await db.tombstones.toArray(),`);
}
if (!code.includes('if (rawData.tombstones) {')) {
    code = code.replace('return rawData;', `    if (rawData.tombstones) {
        rawData.tombstones = rawData.tombstones.map(t => ({
            ...t,
            deletedAt: Number(t.deletedAt) || 0,
        }));
    }

    return rawData;`);
}

// 5. Update deleting hook
if (!code.includes('db.tombstones.put({')) {
    const search = `    (db as any)[tableName].hook('deleting', function (_primKey: any, _obj: any, _transaction: any) {
        if (!dbHooks.isSyncing) {
            dbHooks.onLocalChange();
        }
    });`;
    const replace = `    (db as any)[tableName].hook('deleting', function (_primKey: any, _obj: any, _transaction: any) {
        if (!dbHooks.isSyncing) {
            dbHooks.onLocalChange();

            const deletedId = typeof _primKey === 'string' ? _primKey : _obj?.id;
            if (deletedId) {
                Promise.resolve().then(() => {
                    db.tombstones.put({
                        id: crypto.randomUUID(),
                        deletedId,
                        tableName,
                        deletedAt: Date.now()
                    }).catch(console.error);
                });
            }
        }
    });`;
    code = code.replace(search, replace);
}

fs.writeFileSync('src/lib/db.ts', code);
console.log('db.ts patched');
