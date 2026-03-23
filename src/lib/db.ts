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
    nickname?: string;
    last4Digits?: string;
    budgetOrder?: number;
    interestTrackingMethod?: 'aer' | 'manual';
    // --- Bonus Rate Fields ---
    bonusRateActive?: boolean;
    bonusEndDate?: number; // timestamp
    interestPayoutFrequency?: 'monthly' | 'annually' | 'at_maturity';
    interestPayoutDate?: number; // timestamp for next expected payout or maturity payout
    // --- Import Fields ---
    importId?: string;
    externalRef?: string;
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
    // --- Import Fields ---
    importId?: string;
    externalRef?: string;
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
    syncServerUrl?: string;
    syncPassphrase?: string;
    syncHeaderKey?: string;
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
    type: 'income' | 'expense';
    icon: string;
    budgetId?: string; // Links transaction to a specific budget
    accountId: string;
    updatedAt?: number;
    // --- Import Fields ---
    importId?: string;
    externalRef?: string;
    rawDesc?: string;
}

// --- New Table Interface ---
export interface TaxYearRule extends TaxYearConstants {
    id: string; // e.g., '2024-2025', '2025-2026'
    updatedAt?: number;
}

export interface InterestAccrual {
    id: string; // UUID
    accountId: string; // FK to Account.id
    date: number; // timestamp
    balance: number; // Recorded balance at the time of accrual
    interestAccrued: number;
    updatedAt?: number;
}

export interface Budget {
    id: string;
    accountId: string;
    name: string; // sub-category
    amount: number;
    frequency: string; // e.g. monthly, annual
    icon?: string;
    updatedAt?: number;
    // --- Import Fields ---
    importId?: string;
    externalRef?: string;
    importMappingName?: string;
}

export interface PaymentMapping {
    id: string;
    paymentName: string;
    budgetIds: string[];
    updatedAt?: number;
}

export interface Property {
    id: string;
    name: string;
    updatedAt?: number;
}

export interface PropertyExpense {
    id: string;
    propertyId: string;
    date: number; // timestamp
    payee: string;
    description?: string;
    amount: number;
    updatedAt?: number;
}

export interface PropertyIncome {
    id: string;
    propertyId: string;
    date: number; // timestamp
    description?: string;
    amount: number;
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
    paymentMappings: EntityTable<PaymentMapping, 'id'>;
    interestAccruals: EntityTable<InterestAccrual, 'id'>;
    properties: EntityTable<Property, 'id'>;
    propertyExpenses: EntityTable<PropertyExpense, 'id'>;
    propertyIncomes: EntityTable<PropertyIncome, 'id'>;
};

// Schema version 1
db.version(1).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, importId, updatedAt',
    incomes: '&id, ownerId, name, frequency, type, taxCategory, updatedAt',
    scenarios: '&id, name, updatedAt',
    settings: '&id',
    monthlyArchives: '&id, month, year, updatedAt',
    notifications: '&id, date, read, updatedAt',
    taxRules: '&id, updatedAt',
    budgets: '&id, budgetCategoryId, name, importId, updatedAt',
    transactions: '&id, date, type, budgetId, importId, updatedAt',
    budgetCategories: '&id, name, updatedAt'
});

db.version(2).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, importId, updatedAt',
    incomes: '&id, ownerId, name, frequency, type, taxCategory, updatedAt',
    scenarios: '&id, name, updatedAt',
    settings: '&id',
    monthlyArchives: '&id, month, year, updatedAt',
    notifications: '&id, date, read, updatedAt',
    taxRules: '&id, updatedAt',
    budgets: '&id, budgetCategoryId, name, importId, updatedAt',
    transactions: '&id, date, type, budgetId, importId, updatedAt',
    budgetCategories: '&id, name, updatedAt',
    paymentMappings: '&id, paymentName, budgetId, updatedAt'
});

db.version(3).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, importId, updatedAt',
    incomes: '&id, ownerId, name, frequency, type, taxCategory, updatedAt',
    scenarios: '&id, name, updatedAt',
    settings: '&id',
    monthlyArchives: '&id, month, year, updatedAt',
    notifications: '&id, date, read, updatedAt',
    taxRules: '&id, updatedAt',
    budgets: '&id, budgetCategoryId, name, importId, updatedAt',
    transactions: '&id, date, type, budgetId, importId, updatedAt',
    budgetCategories: '&id, name, updatedAt',
    paymentMappings: '&id, paymentName, *budgetIds, updatedAt'
});

db.version(4).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, importId, updatedAt',
    incomes: '&id, ownerId, name, frequency, type, taxCategory, updatedAt',
    scenarios: '&id, name, updatedAt',
    settings: '&id',
    monthlyArchives: '&id, month, year, updatedAt',
    notifications: '&id, date, read, updatedAt',
    taxRules: '&id, updatedAt',
    budgets: '&id, accountId, name, importId, updatedAt', // removed budgetCategoryId
    transactions: '&id, date, type, budgetId, accountId, importId, updatedAt',
    paymentMappings: '&id, paymentName, *budgetIds, updatedAt'
});

db.version(5).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, importId, updatedAt',
    incomes: '&id, ownerId, name, frequency, type, taxCategory, updatedAt',
    scenarios: '&id, name, updatedAt',
    settings: '&id',
    monthlyArchives: '&id, month, year, updatedAt',
    notifications: '&id, date, read, updatedAt',
    taxRules: '&id, updatedAt',
    budgets: '&id, accountId, name, importId, updatedAt', // added icon, no need to index
    transactions: '&id, date, type, budgetId, accountId, importId, updatedAt',
    paymentMappings: '&id, paymentName, *budgetIds, updatedAt'
});

db.version(6).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, category, importId, updatedAt',
    incomes: '&id, ownerId, name, frequency, type, taxCategory, updatedAt',
    scenarios: '&id, name, updatedAt',
    settings: '&id',
    monthlyArchives: '&id, month, year, updatedAt',
    notifications: '&id, date, read, updatedAt',
    taxRules: '&id, updatedAt',
    budgets: '&id, accountId, name, importId, updatedAt', // added icon, no need to index
    transactions: '&id, date, type, budgetId, accountId, importId, updatedAt',
    paymentMappings: '&id, paymentName, *budgetIds, updatedAt',
    interestAccruals: '&id, accountId, date, updatedAt'
});

db.version(7).stores({
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
    interestAccruals: '&id, accountId, date, updatedAt'
});

db.version(8).stores({
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
    propertyExpenses: '&id, propertyId, date, updatedAt'
});

db.version(9).stores({
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
    propertyIncomes: '&id, propertyId, date, updatedAt'
});

export const getSanitizedDbData = async (): Promise<Record<string, any[]>> => {
    const rawData = {
        profile: await db.profile.toArray(),
        accounts: await db.accounts.toArray(),
        incomes: await db.incomes.toArray(),
        scenarios: await db.scenarios.toArray(),
        settings: await db.settings.toArray(),
        monthlyArchives: await db.monthlyArchives.toArray(),
        notifications: await db.notifications.toArray(),
        taxRules: await db.taxRules.toArray(),
        transactions: await db.transactions.toArray(),
        budgets: await db.budgets.toArray(),
        paymentMappings: await db.paymentMappings.toArray(),
        interestAccruals: await db.interestAccruals.toArray(),
        properties: await db.properties.toArray(),
        propertyExpenses: await db.propertyExpenses.toArray(),
        propertyIncomes: await db.propertyIncomes.toArray(),
    };

    // Sanitize common numeric fields that might have accidentally been saved as strings,
    // which breaks strictly-typed Swift Decodable models in the iOS app.
    if (rawData.transactions) {
        rawData.transactions = rawData.transactions.map(t => ({
            ...t,
            amount: Number(t.amount) || 0,
            date: Number(t.date) || 0,
        }));
    }

    if (rawData.budgets) {
        rawData.budgets = rawData.budgets.map(b => ({
            ...b,
            amount: Number(b.amount) || 0,
        }));
    }

    if (rawData.accounts) {
        rawData.accounts = rawData.accounts.map(a => ({
            ...a,
            balance: Number(a.balance) || 0,
            interestRate: Number(a.interestRate) || 0,
            budgetOrder: a.budgetOrder !== undefined ? Number(a.budgetOrder) : undefined,
            interestPayoutDate: a.interestPayoutDate !== undefined ? Number(a.interestPayoutDate) : undefined,
        }));
    }

    if (rawData.incomes) {
        rawData.incomes = rawData.incomes.map(i => ({
            ...i,
            amount: Number(i.amount) || 0,
        }));
    }

    if (rawData.interestAccruals) {
        rawData.interestAccruals = rawData.interestAccruals.map(a => ({
            ...a,
            balance: Number(a.balance) || 0,
            interestAccrued: Number(a.interestAccrued) || 0,
            date: Number(a.date) || 0,
        }));
    }

    if (rawData.propertyExpenses) {
        rawData.propertyExpenses = rawData.propertyExpenses.map(e => ({
            ...e,
            amount: Number(e.amount) || 0,
            date: Number(e.date) || 0,
        }));
    }

    if (rawData.propertyIncomes) {
        rawData.propertyIncomes = rawData.propertyIncomes.map(i => ({
            ...i,
            amount: Number(i.amount) || 0,
            date: Number(i.date) || 0,
        }));
    }

    return rawData;
};

export const initDb = async () => {
    try {
        await db.open();
    } catch (err: any) {
        if (err.name === 'VersionError') {
            console.warn('Database version downgrade detected. Wiping and recreating...');
            await db.delete();
            await db.open();
        } else {
            throw err;
        }
    }
};

export const dbHooks = {
    onLocalChange: () => { },
    isSyncing: false
};

// Add hooks to automatically update the updatedAt timestamp
const tablesToHook = ['profile', 'accounts', 'incomes', 'scenarios', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets', 'paymentMappings', 'interestAccruals', 'properties', 'propertyExpenses', 'propertyIncomes'];

tablesToHook.forEach(tableName => {
    (db as any)[tableName].hook('creating', function (_primKey: any, obj: any, _transaction: any) {
        if (!obj.updatedAt) {
            obj.updatedAt = Date.now();
        }
        if (!dbHooks.isSyncing) {
            dbHooks.onLocalChange();
        }
    });

    (db as any)[tableName].hook('updating', function (modifications: any, _primKey: any, _obj: any, _transaction: any) {
        if (!dbHooks.isSyncing) {
            dbHooks.onLocalChange();
        }
        if (modifications.hasOwnProperty('updatedAt')) {
            return modifications;
        }
        return { ...modifications, updatedAt: Date.now() };
    });

    (db as any)[tableName].hook('deleting', function (_primKey: any, _obj: any, _transaction: any) {
        if (!dbHooks.isSyncing) {
            dbHooks.onLocalChange();
        }
    });
});

if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
    (window as any).__DEXIE_DB__ = db;
}
