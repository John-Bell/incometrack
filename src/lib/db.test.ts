import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, dbHooks, initDb, getSanitizedDbData } from './db';
import type { Account, Income, Profile, TaxYearRule } from './db';
import { getTaxConstants } from '../constants/taxConstants';

describe('Database Schema', () => {
    beforeEach(async () => {
        // Reset DB
        await db.delete();
        await db.open();
    });

    it('should have the correct tables defined', () => {
        expect(db.accounts).toBeDefined();
        expect(db.incomes).toBeDefined();
        expect(db.settings).toBeDefined();
        expect(db.monthlyArchives).toBeDefined();
        expect(db.notifications).toBeDefined();
        expect(db.taxRules).toBeDefined();
    });

    it('should support new Account fields', async () => {
        const account: Account = {
            id: 'acc1',
            ownerId: 'user1',
            name: 'My Savings',
            category: 'Cash',
            balance: 1000,
            interestRate: 4.5,
            updatedAt: Date.now(),
            notes: 'Test note',
            alertText: 'Test alert',
            alertType: 'warning'
        };

        await db.accounts.add(account);
        const savedAccount = await db.accounts.get('acc1');

        expect(savedAccount).toEqual(account);
        expect(savedAccount?.interestRate).toBe(4.5);
    });

    it('should support new Profile fields', async () => {
        const profile: Profile = {
            id: 'default',
            name: 'Smith Family',
            partner1Name: 'John',
            partner1Dob: new Date('1980-01-01').getTime(),
            partner2Name: 'Jane',
            partner2Dob: new Date('1982-05-15').getTime(),
            createdAt: Date.now()
        };

        await db.profile.add(profile);
        const savedProfile = await db.profile.get('default');

        expect(savedProfile).toEqual(profile);
        expect(savedProfile?.partner1Name).toBe('John');
        expect(savedProfile?.partner1Dob).toBe(new Date('1980-01-01').getTime());
        expect(savedProfile?.partner2Dob).toBe(new Date('1982-05-15').getTime());
    });

    it('should support new Income fields', async () => {
        const income: Income = {
            id: 'inc1',
            ownerId: 'user1',
            name: 'Salary',
            amount: 5000,
            frequency: 'monthly',
            type: 'salary',
            taxCategory: 'Earned'
        };

        await db.incomes.add(income);
        const savedIncome = await db.incomes.get('inc1');

        expect(savedIncome).toEqual(income);
        expect(savedIncome?.type).toBe('salary');
        expect(savedIncome?.taxCategory).toBe('Earned');
    });

    it('should support time-bounded Income fields', async () => {
        const start = Date.now();
        const end = start + 1000000;
        const income: Income = {
            id: 'inc2',
            ownerId: 'user1',
            name: 'Contract',
            amount: 1000,
            frequency: 'monthly',
            type: 'employment',
            taxCategory: 'Earned',
            startDate: start,
            endDate: end
        };

        await db.incomes.add(income);
        const savedIncome = await db.incomes.get('inc2');

        expect(savedIncome?.startDate).toBe(start);
        expect(savedIncome?.endDate).toBe(end);
    });

    it('should support new Property fields', async () => {
        const property = {
            id: 'prop1',
            name: 'Rental Property',
            expectedMonthlyIncome: 1200,
            annualGrowthRate: 3.5,
            updatedAt: Date.now()
        };

        await db.properties.add(property);
        const savedProperty = await db.properties.get('prop1');

        expect(savedProperty?.expectedMonthlyIncome).toBe(1200);
        expect(savedProperty?.annualGrowthRate).toBe(3.5);
    });

    it('should support Settings table', async () => {
        const settings = {
            id: 'default',
            currency: 'GBP',
            taxYear: '2024/25',
            icloudSync: true,
            lastSynced: Date.now()
        };

        await db.settings.add(settings);
        const savedSettings = await db.settings.get('default');

        expect(savedSettings).toEqual(settings);
    });

    it('should support TaxYearRule table', async () => {
        const constants = getTaxConstants('2024-2025');
        const taxRule: TaxYearRule = {
            id: '2024-2025',
            ...constants
        };

        await db.taxRules.add(taxRule);
        const savedRule = await db.taxRules.get('2024-2025');

        expect(savedRule).toEqual(taxRule);
        expect(savedRule?.BasicRate).toBe(0.2);
    });

    it('should sync updated tax rules into taxRules table via syncTaxRules without triggering onLocalChange', async () => {
        const onLocalChangeSpy = vi.spyOn(dbHooks, 'onLocalChange');
        const { syncTaxRules } = await import('./seed');
        await syncTaxRules();

        expect(onLocalChangeSpy).not.toHaveBeenCalled();
        expect(dbHooks.isSyncing).toBe(false);
        onLocalChangeSpy.mockRestore();

        const rule2027 = await db.taxRules.get('2027-2028');
        expect(rule2027).toBeDefined();
        expect(rule2027?.SavingsBasicRate).toBe(0.24);
        expect(rule2027?.SavingsHigherRate).toBe(0.44);
        expect(rule2027?.RentalBasicRate).toBe(0.24);
        expect(rule2027?.RentalHigherRate).toBe(0.44);

        const rule2028 = await db.taxRules.get('2028-2029');
        expect(rule2028).toBeDefined();
        expect(rule2028?.SavingsBasicRate).toBe(0.24);
        expect(rule2028?.SavingsHigherRate).toBe(0.44);
        expect(rule2028?.RentalBasicRate).toBe(0.24);
        expect(rule2028?.RentalHigherRate).toBe(0.44);

        const rule2029 = await db.taxRules.get('2029-2030');
        expect(rule2029).toBeDefined();
        expect(rule2029?.SavingsBasicRate).toBe(0.24);
        expect(rule2029?.SavingsHigherRate).toBe(0.44);
        expect(rule2029?.RentalBasicRate).toBe(0.24);
        expect(rule2029?.RentalHigherRate).toBe(0.44);
    });

    it('should sanitize budgetStartDate in getSanitizedDbData', async () => {
        const defaultDateTs = new Date(2026, 3, 1).getTime();
        await db.budgets.add({
            id: 'b1',
            accountId: 'acc1',
            name: 'Groceries',
            amount: 100,
            frequency: 'monthly',
            budgetStartDate: new Date('2026-06-01').getTime(),
        });
        await db.budgets.add({
            id: 'b2',
            accountId: 'acc1',
            name: 'Utilities',
            amount: 200,
            frequency: 'monthly',
        });

        const data = await getSanitizedDbData();
        const b1 = data.budgets.find((b) => b.id === 'b1');
        const b2 = data.budgets.find((b) => b.id === 'b2');

        expect(b1.budgetStartDate).toBe(new Date('2026-06-01').getTime());
        expect(b2.budgetStartDate).toBe(defaultDateTs);
    });

    it('updating hook always refreshes updatedAt when !isSyncing, even via .put() with existing updatedAt', async () => {
        const initialTs = 1000;
        dbHooks.isSyncing = true;
        await db.accounts.put({
            id: 'acc-hook-1',
            ownerId: 'user1',
            name: 'Initial',
            category: 'Cash',
            balance: 100,
            interestRate: 1,
            updatedAt: initialTs
        });
        dbHooks.isSyncing = false;

        const savedBefore = await db.accounts.get('acc-hook-1');
        expect(savedBefore?.updatedAt).toBe(initialTs);

        // Save existing record via .put() passing the old updatedAt
        await db.accounts.put({
            ...savedBefore!,
            balance: 200,
            updatedAt: initialTs
        });

        const savedAfter = await db.accounts.get('acc-hook-1');
        expect(savedAfter?.balance).toBe(200);
        expect(savedAfter?.updatedAt).toBeGreaterThan(initialTs);
    });

    it('updating hook does not overwrite updatedAt when isSyncing is true', async () => {
        const initialTs = 1000;
        dbHooks.isSyncing = true;
        await db.accounts.put({
            id: 'acc-hook-2',
            ownerId: 'user1',
            name: 'Initial',
            category: 'Cash',
            balance: 100,
            interestRate: 1,
            updatedAt: initialTs
        });

        await db.accounts.update('acc-hook-2', { balance: 300 });
        dbHooks.isSyncing = false;

        const saved = await db.accounts.get('acc-hook-2');
        expect(saved?.balance).toBe(300);
        expect(saved?.updatedAt).toBe(initialTs);
    });

    it('deleting hook ensures deletedAt is strictly greater than record updatedAt', async () => {
        const futureTs = Date.now() + 60_000;
        dbHooks.isSyncing = true;
        await db.accounts.put({
            id: 'acc-del-1',
            ownerId: 'user1',
            name: 'Future Stamp',
            category: 'Cash',
            balance: 100,
            interestRate: 1,
            updatedAt: futureTs
        });
        dbHooks.isSyncing = false;

        await db.accounts.delete('acc-del-1');

        const tombstone = await db.deletedRows.get('acc-del-1');
        expect(tombstone).toBeDefined();
        expect(tombstone!.deletedAt).toBeGreaterThan(futureTs);
        expect(tombstone!.deletedAt).toBe(futureTs + 1);
    });

    it('initDb resets dbHooks.isSyncing to false after opening', async () => {
        await initDb();
        expect(dbHooks.isSyncing).toBe(false);
    });
});
