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
}

export interface Income {
    id: string;
    ownerId: string;
    name: string;
    amount: number;
    frequency: string;
}

export interface Scenario {
    id: string;
    name: string;
    description?: string;
}

export const db = new Dexie('IncomeTrackDB') as Dexie & {
    profile: EntityTable<Profile, 'id'>;
    accounts: EntityTable<Account, 'id'>;
    incomes: EntityTable<Income, 'id'>;
    scenarios: EntityTable<Scenario, 'id'>;
};

// Schema version 1
db.version(1).stores({
    profile: '&id',
    accounts: '&id, ownerId, name, type',
    incomes: '&id, ownerId, name, frequency',
    scenarios: '&id, name'
});
