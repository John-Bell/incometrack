import Dexie, { type EntityTable } from 'dexie';

// Assuming you export this type from your constants file
import type { TaxYearConstants } from '../constants/taxConstants';

export interface Profile {
    id: string; // usually 'default' but can be a UUID
    name: string;
    partner1Name?: string;
    partner2Name?: string;
    createdAt: number;
    updatedAt?: number;
}

export interface Account {
    id: string;
    ownerId: string;
    name: string;
    balance: number;
    interestRate: number; // Percentage, e.g. 5.25
    updatedAt: number;
    notes?: string;
    alertText?: string;
    alertType?: 'warning' | 'error' | 'info';
    category: string; // e.g., 'Cash', 'Investments', 'Pensions'
    // --- Bonus Rate Fields ---
    bonusRateActive?: boolean;
    bonusEndDate?: number; // timestamp
}

export interface Income {
    id: string;
    ownerId: string;
    name: string;
    amount: number;
    frequency: string;
    // --- Updated Tax Optimization Fields ---
    type: string; // e.g., 'salary', 'rental', 'other'
    taxCategory: string; // e.g., 'Pension', 'State Pension', 'Dividend', 'Tax-Free', 'Earned'
    updatedAt?: number;
}

export interface Scenario {
    id: string;
    name: string;
    description?: string;
    updatedAt?: number;
}

export interface Settings {
    id: string; // 'default'
    currency: string;
    taxYear: string; // Acts as the FK pointing to TaxYearRule.id
    icloudSync: boolean;
    lastSynced?: number;
    updatedAt?: number;
    cloudHandle?: any; // FileSystemFileHandle
}

export interface MonthlyArchive {
    id: string; // YYYY-MM
    month: string; // "October 2025"
    year: number;
    totalInterest: number;
    estimatedAccruedInterest: number;
    closedAt: number;
    data: any; // Snapshot of accounts/incomes and calculated tax results
    updatedAt?: number;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    date: number;
    read: boolean;
    actionLabel?: string;
    actionUrl?: string;
    updatedAt?: number;
}

// --- Transactions Table Interface ---
export interface Transaction {
    id: string;
    date: number; // timestamp
    payee: string;
    amount: number;
    category: string;
    subCategory: string;
    type: 'income' | 'expense';
    icon: string;
    budgetId?: string; // Links transaction to a specific budget
    updatedAt?: number;
}

// --- New Table Interface ---
export interface TaxYearRule extends TaxYearConstants {
    id: string; // e.g., '2024-2025', '2025-2026'
    updatedAt?: number;
}

export interface Budget {
    id: string;
    category: string;
    name: string; // sub-category
    amount: number;
    frequency: string; // e.g. monthly, annual
    paymentSource: string; // e.g. monthly, annual
    ownership: string; // e.g. john, billie, joint
    updatedAt?: number;
}

export const db = new Dexie('IncomeTrackDB') as Dexie & {
    profile: EntityTable<Profile, 'id'>;
    accounts: EntityTable<Account, 'id'>;
    incomes: EntityTable<Income, 'id'>;
    scenarios: EntityTable<Scenario, 'id'>;
    settings: EntityTable<Settings, 'id'>;
    monthlyArchives: EntityTable<MonthlyArchive, 'id'>;
    notifications: EntityTable<AppNotification, 'id'>;
    taxRules: EntityTable<TaxYearRule, 'id'>; // Added to DB instance
    transactions: EntityTable<Transaction, 'id'>;
    budgets: EntityTable<Budget, 'id'>;
};

// Schema version 1
db.version(1).stores({
    profile: '&id',
    accounts: '&id, ownerId, name',
    incomes: '&id, ownerId, name, frequency',
    scenarios: '&id, name'
});

// Schema version 2 - Update schema
db.version(2).stores({
    profile: '&id',
    accounts: '&id, ownerId, name',
    incomes: '&id, ownerId, name, frequency, type',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read'
});

// Schema version 3 - Tax Optimization & Rule Engine
db.version(3).stores({
    // Inherit everything from v2...
    profile: '&id',
    // Added taxWrapper as an index in case you want to query all ISAs quickly
    accounts: '&id, ownerId, name',
    // Added taxCategory as an index to quickly sum up just pension income
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    // New table. Just need the primary key indexed.
    taxRules: '&id'
});

// Schema version 4 - Added bonus rate fields to Account
db.version(4).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id'
});

// Schema version 5 - Added category to Account
db.version(5).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id'
});

// Schema version 6 - Added budgets
db.version(6).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id',
    budgets: '&id, category, name, paymentSource, ownership'
});

// Schema version 7 - Added estimatedAccruedInterest to MonthlyArchive
db.version(7).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id',
    budgets: '&id, category, name, paymentSource, ownership'
});

// Schema version 8 - Added transactions
db.version(8).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id',
    budgets: '&id, category, name, paymentSource, ownership',
    transactions: '&id, date, category, type'
});

// Schema version 9 - Link transactions to budgets
db.version(9).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id',
    budgets: '&id, category, name, paymentSource, ownership',
    transactions: '&id, date, category, type, budgetId'
});

// Add hooks to automatically update the updatedAt timestamp
const tablesToHook = ['profile', 'accounts', 'incomes', 'scenarios', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets'];

tablesToHook.forEach(tableName => {
    (db as any)[tableName].hook('creating', function (primKey: any, obj: any, transaction: any) {
        if (!obj.updatedAt) {
            obj.updatedAt = Date.now();
        }
    });

    (db as any)[tableName].hook('updating', function (modifications: any, primKey: any, obj: any, transaction: any) {
        return { ...modifications, updatedAt: Date.now() };
    });
});

// Schema version 10
db.version(10).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id',
    budgets: '&id, category, name, paymentSource, ownership',
    transactions: '&id, date, category, type, budgetId'
});

// Schema version 11 - Add updatedAt and cloudHandle support
db.version(11).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id',
    budgets: '&id, category, name, paymentSource, ownership',
    transactions: '&id, date, category, type, budgetId'
});
