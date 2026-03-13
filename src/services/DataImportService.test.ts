import { describe, it, expect, beforeEach } from 'vitest';
import { DataImportService } from './DataImportService';
import { db } from '../lib/db';

describe('DataImportService', () => {
    describe('generateDeterministicId', () => {
        it('should generate deterministic ID for transactions', () => {
            const row1 = { date: '2023-01-01', amount: '100', payee: 'Store', rawDesc: 'Groceries', category: 'Food' };
            const row2 = { date: '2023-01-01', amount: '100', payee: 'Store', rawDesc: 'Groceries', category: 'Food' };
            const row3 = { date: '2023-01-02', amount: '100', payee: 'Store', rawDesc: 'Groceries', category: 'Food' };

            const id1 = DataImportService.generateDeterministicId(row1, 'transactions');
            const id2 = DataImportService.generateDeterministicId(row2, 'transactions');
            const id3 = DataImportService.generateDeterministicId(row3, 'transactions');

            expect(id1).toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id1).toMatch(/^import-transactions-\d+$/);
        });

        it('should generate deterministic ID for budgets', () => {
            const row1 = { importCategory: 'Food', name: 'Groceries', amount: '500' };
            const row2 = { importCategory: 'Food', name: 'Groceries', amount: '500' };
            const row3 = { importCategory: 'Food', name: 'Dining Out', amount: '500' };

            const id1 = DataImportService.generateDeterministicId(row1, 'budgets');
            const id2 = DataImportService.generateDeterministicId(row2, 'budgets');
            const id3 = DataImportService.generateDeterministicId(row3, 'budgets');

            expect(id1).toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id1).toMatch(/^import-budgets-\d+$/);
        });

        it('should generate deterministic ID for accounts', () => {
            const row1 = { name: 'Checking', category: 'Bank', ownerId: 'user1' };
            const row2 = { name: 'Checking', category: 'Bank', ownerId: 'user1' };
            const row3 = { name: 'Savings', category: 'Bank', ownerId: 'user1' };

            const id1 = DataImportService.generateDeterministicId(row1, 'accounts');
            const id2 = DataImportService.generateDeterministicId(row2, 'accounts');
            const id3 = DataImportService.generateDeterministicId(row3, 'accounts');

            expect(id1).toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id1).toMatch(/^import-accounts-\d+$/);
        });

        it('should fallback to JSON.stringify for unknown tables', () => {
            const row1 = { unknownField: 'test' };
            const row2 = { unknownField: 'test' };
            const row3 = { unknownField: 'other' };

            const id1 = DataImportService.generateDeterministicId(row1, 'unknownTable');
            const id2 = DataImportService.generateDeterministicId(row2, 'unknownTable');
            const id3 = DataImportService.generateDeterministicId(row3, 'unknownTable');

            expect(id1).toBe(id2);
            expect(id1).not.toBe(id3);
            expect(id1).toMatch(/^import-unknownTable-\d+$/);
        });
    });

    describe('parseFile', () => {
        it('should parse a JSON file', async () => {
            const data = [{ key: 'value' }, { key2: 'value2' }];
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const file = new File([blob], 'test.json', { type: 'application/json' });

            const result = await DataImportService.parseFile(file);
            expect(result).toEqual(data);
        });

        it('should parse a single object JSON file into an array', async () => {
            const data = { key: 'value' };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const file = new File([blob], 'test.json', { type: 'application/json' });

            const result = await DataImportService.parseFile(file);
            expect(result).toEqual([data]);
        });

        it('should reject invalid JSON', async () => {
            const blob = new Blob(['invalid json'], { type: 'application/json' });
            const file = new File([blob], 'test.json', { type: 'application/json' });

            await expect(DataImportService.parseFile(file)).rejects.toThrow('Failed to parse JSON file');
        });

        it('should parse a CSV file', async () => {
            const csvData = 'name,age\nAlice,30\nBob,25';
            const blob = new Blob([csvData], { type: 'text/csv' });
            const file = new File([blob], 'test.csv', { type: 'text/csv' });

            const result = await DataImportService.parseFile(file);
            expect(result).toEqual([
                { name: 'Alice', age: '30' },
                { name: 'Bob', age: '25' }
            ]);
        });

        it('should reject unsupported file types', async () => {
            const blob = new Blob(['some text'], { type: 'text/plain' });
            const file = new File([blob], 'test.txt', { type: 'text/plain' });

            await expect(DataImportService.parseFile(file)).rejects.toThrow('Unsupported file type. Please use CSV or JSON.');
        });
    });

    describe('importData', () => {
        beforeEach(async () => {
            await db.transactions.clear();
            await db.budgets.clear();
            await db.accounts.clear();
        });

        it('should return 0 when no data is provided', async () => {
            const result = await DataImportService.importData('transactions', [], 'test.csv', {});
            expect(result).toBe(0);
        });

        it('should map fields, apply type conversions, and assign default values for transactions', async () => {
            // Seed a budget to test linking
            const budgetId = 'test-budget-id';
            await db.budgets.add({
                id: budgetId,
                accountId: 'test-account',
                name: 'Groceries',
                amount: 500,
                frequency: 'monthly',
                updatedAt: Date.now()
            });

            const data = [
                {
                    rawDate: '2023-01-01T12:00:00Z',
                    rawAmount: '-$100.50',
                    desc: 'Supermarket',
                    cat: 'Groceries'
                }
            ];
            const mapping = {
                rawDate: 'date',
                rawAmount: 'amount',
                desc: 'payee',
                cat: 'importCategory'
            };

            const result = await DataImportService.importData('transactions', data, 'import-file-1', mapping);
            expect(result).toBe(1);

            const transactions = await db.transactions.toArray();
            expect(transactions).toHaveLength(1);

            const t = transactions[0];
            expect(t.date).toBe(new Date('2023-01-01T12:00:00Z').getTime());
            expect(t.amount).toBe(-100.50);
            expect(t.payee).toBe('Supermarket');
            expect((t as any).importCategory).toBeUndefined(); // importCategory should be deleted
            expect(t.type).toBe('expense'); // derived from amount < 0
            expect(t.budgetId).toBe(budgetId); // linked via category matching budget category
            expect(t.importId).toBe('import-file-1');
            expect(t.id).toMatch(/^import-transactions-\d+$/);
            expect(t.updatedAt).toBeGreaterThan(0);
        });

        it('should assign default values when importing budgets', async () => {
            const data = [
                { category: 'Utilities', name: 'Water', amount: '50' }
            ];
            const mapping = { category: 'importCategory', name: 'name', amount: 'amount' };

            const result = await DataImportService.importData('budgets', data, 'import-file-2', mapping);
            expect(result).toBe(1);

            const budgets = await db.budgets.toArray();
            expect(budgets).toHaveLength(1);

            const b = budgets[0];
            expect(b.amount).toBe(50); // parsed correctly
            expect(b.frequency).toBe('monthly');
            expect((b as any).importCategory).toBeUndefined();
            expect(b.importId).toBe('import-file-2');
        });

        it('should assign default values when importing accounts', async () => {
            const data = [
                { name: 'Checking', type: 'Bank', balance: '1,234.56', interest: '1.5%' }
            ];
            const mapping = { name: 'name', type: 'category', balance: 'balance', interest: 'interestRate' };

            const result = await DataImportService.importData('accounts', data, 'import-file-3', mapping);
            expect(result).toBe(1);

            const accounts = await db.accounts.toArray();
            expect(accounts).toHaveLength(1);

            const a = accounts[0];
            expect(a.name).toBe('Checking');
            expect(a.category).toBe('Bank');
            expect(a.balance).toBe(1234.56);
            expect(a.interestRate).toBe(1.5);
            expect(a.ownerId).toBe('default');
            expect(a.importId).toBe('import-file-3');
        });

        it('should correctly parse boolean fields', async () => {
            const data = [
                { name: 'Checking', bonusRateActive: 'TRUE' },
                { name: 'Savings', bonusRateActive: 'false' }
            ];
            const mapping = { name: 'name', bonusRateActive: 'bonusRateActive' };

            const result = await DataImportService.importData('accounts', data, 'import-file-4', mapping);
            expect(result).toBe(2);

            const accounts = await db.accounts.toArray();
            const checking = accounts.find(a => a.name === 'Checking');
            const savings = accounts.find(a => a.name === 'Savings');

            expect(checking?.bonusRateActive).toBe(true);
            expect(savings?.bonusRateActive).toBe(false);
        });
    });
});
