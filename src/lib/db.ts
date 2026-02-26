import Dexie, { type EntityTable } from 'dexie';

// Assuming you export this type from your constants file
import type { TaxYearConstants } from '../constants/taxConstants';

export interface Profile {
    id: string; // usually 'default' but can be a UUID
    name: string;
    partner1Name?: string;
    partner2Name?: string;
    createdAt: number;
}

export interface Account {
    id: string;
    ownerId: string;
    name: string;
    type: string;
    balance: number;
    institutionName: string;
    institutionCode: string; // e.g. 'S', 'B', 'H'
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
}

export interface Scenario {
    id: string;
    name: string;
    description?: string;
}

export interface Settings {
    id: string; // 'default'
    currency: string;
    taxYear: string; // Acts as the FK pointing to TaxYearRule.id
    icloudSync: boolean;
    lastSynced?: number;
}

export interface MonthlyArchive {
    id: string; // YYYY-MM
    month: string; // "October 2025"
    year: number;
    totalInterest: number;
    closedAt: number;
    data: any; // Snapshot of accounts/incomes and calculated tax results
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
}

// --- New Table Interface ---
export interface TaxYearRule extends TaxYearConstants {
    id: string; // e.g., '2024-2025', '2025-2026'
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
};

// Schema version 1
db.version(1).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, type',
    incomes: '&id, ownerId, name, frequency',
    scenarios: '&id, name'
});

// Schema version 2 - Update schema
db.version(2).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, type, institutionName',
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
    accounts: '&id, ownerId, name, type, institutionName',
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
    accounts: '&id, ownerId, name, type, institutionName, bonusRateActive, bonusEndDate',
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
    accounts: '&id, ownerId, name, type, category, institutionName, bonusRateActive, bonusEndDate',
    incomes: '&id, ownerId, name, frequency, type, taxCategory',
    scenarios: '&id, name',
    settings: '&id',
    monthlyArchives: '&id, month, year',
    notifications: '&id, date, read',
    taxRules: '&id'
});
