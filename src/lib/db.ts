import Dexie, { type EntityTable } from 'dexie';

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
    // New fields
    institutionName: string;
    institutionCode: string; // e.g. 'S', 'B', 'H'
    interestRate: number; // Percentage, e.g. 5.25
    updatedAt: number;
    notes?: string;
    alertText?: string;
    alertType?: 'warning' | 'error' | 'info';
}

export interface Income {
    id: string;
    ownerId: string;
    name: string;
    amount: number;
    frequency: string;
    // New fields
    type: string; // 'salary', 'pension', 'rental', 'dividend', 'other'
}

export interface Scenario {
    id: string;
    name: string;
    description?: string;
}

export interface Settings {
    id: string; // 'default'
    currency: string;
    taxYear: string;
    icloudSync: boolean;
    lastSynced?: number;
}

export interface MonthlyArchive {
    id: string; // YYYY-MM
    month: string; // "October 2025"
    year: number;
    totalInterest: number;
    closedAt: number;
    data: any; // Snapshot of accounts/incomes
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

export const db = new Dexie('IncomeTrackDB') as Dexie & {
    profile: EntityTable<Profile, 'id'>;
    accounts: EntityTable<Account, 'id'>;
    incomes: EntityTable<Income, 'id'>;
    scenarios: EntityTable<Scenario, 'id'>;
    settings: EntityTable<Settings, 'id'>;
    monthlyArchives: EntityTable<MonthlyArchive, 'id'>;
    notifications: EntityTable<AppNotification, 'id'>;
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
