const fs = require('fs');
let code = fs.readFileSync('src/services/remoteSyncService.ts', 'utf8');

const searchTables = `const tables = ['profile', 'accounts', 'incomes', 'scenarios', 'settings', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets', 'paymentMappings', 'interestAccruals', 'properties', 'propertyExpenses', 'propertyIncomes', 'propertyOwnership'];`;
const replaceTables = `const tables = ['tombstones', 'profile', 'accounts', 'incomes', 'scenarios', 'settings', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets', 'paymentMappings', 'interestAccruals', 'properties', 'propertyExpenses', 'propertyIncomes', 'propertyOwnership'];`;

const searchTableList = `const tableList = [db.profile, db.accounts, db.incomes, db.scenarios, db.settings, db.monthlyArchives, db.notifications, db.taxRules, db.transactions, db.budgets, db.paymentMappings, db.interestAccruals, db.properties, db.propertyExpenses, db.propertyIncomes, db.propertyOwnership];`;
const replaceTableList = `const tableList = [db.tombstones, db.profile, db.accounts, db.incomes, db.scenarios, db.settings, db.monthlyArchives, db.notifications, db.taxRules, db.transactions, db.budgets, db.paymentMappings, db.interestAccruals, db.properties, db.propertyExpenses, db.propertyIncomes, db.propertyOwnership];`;

code = code.replace(searchTables, replaceTables);
code = code.replace(searchTableList, replaceTableList);

const searchLoopBlock = `                if (!localRecord) {
                    // Record exists in cloud but not local -> Add it
                    await dexieTable.put(cloudRecord);
                } else {
                    // Record exists in both -> Compare updatedAt
                    const localTime = (localRecord as any).updatedAt || 0;
                    const cloudTime = (cloudRecord as any).updatedAt || 0;

                    if (cloudTime > localTime) {
                        // Cloud is newer -> Update local
                        // Do not overwrite cloudHandle in settings
                        if (table === 'settings' && (localRecord as any).cloudHandle) {
                            (cloudRecord as any).cloudHandle = (localRecord as any).cloudHandle;
                        }
                        await dexieTable.put(cloudRecord);
                    } else if (localTime > cloudTime) {
                        // Local is newer -> Mark for export
                        hasLocalChanges = true;
                    }
                }`;

const replaceLoopBlock = `                if (table === 'tombstones') {
                    if (!localRecord) {
                        await dexieTable.put(cloudRecord);
                        const targetTable = (db as any)[cloudRecord.tableName];
                        if (targetTable) {
                            const existingRecord = await targetTable.get(cloudRecord.deletedId);
                            if (existingRecord && (existingRecord.updatedAt || 0) < cloudRecord.deletedAt) {
                                await targetTable.delete(cloudRecord.deletedId);
                            }
                        }
                    } else {
                        const localTime = localRecord.deletedAt || 0;
                        const cloudTime = cloudRecord.deletedAt || 0;
                        if (cloudTime > localTime) {
                            await dexieTable.put(cloudRecord);
                        } else if (localTime > cloudTime) {
                            hasLocalChanges = true;
                        }
                    }
                    localMap.delete(cloudRecord.id);
                    continue;
                }

                if (!localRecord) {
                    // Record exists in cloud but not local
                    const tombstone = await db.tombstones.where('deletedId').equals(cloudRecord.id).first();
                    if (tombstone) {
                        if (tombstone.deletedAt > (cloudRecord.updatedAt || 0)) {
                            hasLocalChanges = true;
                        } else {
                            await dexieTable.put(cloudRecord);
                            await db.tombstones.delete(tombstone.id);
                            hasLocalChanges = true;
                        }
                    } else {
                        await dexieTable.put(cloudRecord);
                    }
                } else {
                    // Record exists in both -> Compare updatedAt
                    const localTime = (localRecord as any).updatedAt || 0;
                    const cloudTime = (cloudRecord as any).updatedAt || 0;

                    const tombstone = await db.tombstones.where('deletedId').equals(cloudRecord.id).first();
                    if (tombstone && tombstone.deletedAt < Math.max(localTime, cloudTime)) {
                        await db.tombstones.delete(tombstone.id);
                        hasLocalChanges = true;
                    }

                    if (cloudTime > localTime) {
                        // Cloud is newer -> Update local
                        // Do not overwrite cloudHandle in settings
                        if (table === 'settings' && (localRecord as any).cloudHandle) {
                            (cloudRecord as any).cloudHandle = (localRecord as any).cloudHandle;
                        }
                        await dexieTable.put(cloudRecord);
                    } else if (localTime > cloudTime) {
                        // Local is newer -> Mark for export
                        hasLocalChanges = true;
                    }
                }`;

code = code.replace(searchLoopBlock, replaceLoopBlock);

fs.writeFileSync('src/services/remoteSyncService.ts', code);
console.log('remoteSyncService.ts patched');
