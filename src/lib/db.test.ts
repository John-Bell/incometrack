import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
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
            type: 'savings',
            category: 'Cash',
            balance: 1000,
            institutionName: 'Bank A',
            institutionCode: 'B',
            interestRate: 4.5,
            updatedAt: Date.now(),
            notes: 'Test note',
            alertText: 'Test alert',
            alertType: 'warning'
        };

        await db.accounts.add(account);
        const savedAccount = await db.accounts.get('acc1');

        expect(savedAccount).toEqual(account);
        expect(savedAccount?.institutionName).toBe('Bank A');
        expect(savedAccount?.institutionCode).toBe('B');
        expect(savedAccount?.interestRate).toBe(4.5);
    });

    it('should support new Profile fields', async () => {
        const profile: Profile = {
            id: 'default',
            name: 'Smith Family',
            partner1Name: 'John',
            partner2Name: 'Jane',
            createdAt: Date.now()
        };

        await db.profile.add(profile);
        const savedProfile = await db.profile.get('default');

        expect(savedProfile).toEqual(profile);
        expect(savedProfile?.partner1Name).toBe('John');
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
});
