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

export interface BudgetCategory {
    id: string;
    name: string;
    updatedAt?: number;
}

export interface Budget {
    id: string;
    budgetCategoryId: string;
    name: string; // sub-category
    amount: number;
    frequency: string; // e.g. monthly, annual
    paymentSource: string; // e.g. monthly, annual
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
    budgetCategories: EntityTable<BudgetCategory, 'id'>;
    paymentMappings: EntityTable<PaymentMapping, 'id'>;
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
const tablesToHook = ['profile', 'accounts', 'incomes', 'scenarios', 'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets', 'budgetCategories', 'paymentMappings'];

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

