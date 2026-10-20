import { getTaxYearOrLatest } from '@/constants/taxConstants';

export interface ProfileInputParams {
    partner1Name: string;
    partner1Dob?: string;
    partner2Name?: string;
    partner2Dob?: string;
    createdAt?: number;
}

export interface SettingsInputParams {
    existingSettings?: {
        currency?: string;
        taxYear?: string;
        icloudSync?: boolean;
        defaultGrowthRate?: number;
        lastSynced?: number;
    } | null;
    syncServerUrl?: string;
    syncPassphrase?: string;
    syncHeaderKey?: string;
    lastSynced?: number;
    updatedAt?: number;
}

export function createProfileData(params: ProfileInputParams) {
    const p1Name = params.partner1Name.trim();
    const p2Name = params.partner2Name?.trim();
    const p1Dob = params.partner1Dob ? new Date(params.partner1Dob).getTime() : undefined;
    const p2Dob = params.partner2Dob ? new Date(params.partner2Dob).getTime() : undefined;

    return {
        id: 'default',
        name: `${p1Name} & ${p2Name || 'Partner'}`,
        partner1Name: p1Name,
        partner1Dob: p1Dob && !isNaN(p1Dob) ? p1Dob : undefined,
        partner2Name: p2Name || undefined,
        partner2Dob: p2Dob && !isNaN(p2Dob) ? p2Dob : undefined,
        createdAt: params.createdAt ?? Date.now(),
    };
}

export function createSettingsData(params: SettingsInputParams) {
    const existing = params.existingSettings;
    const syncServerUrl = params.syncServerUrl?.trim() || undefined;
    const syncPassphrase = params.syncPassphrase?.trim() || undefined;
    const syncHeaderKey = params.syncHeaderKey?.trim() || undefined;

    return {
        id: 'default',
        currency: existing?.currency || 'GBP',
        taxYear: existing?.taxYear || getTaxYearOrLatest(),
        icloudSync: existing?.icloudSync || false,
        syncServerUrl,
        syncPassphrase,
        syncHeaderKey,
        defaultGrowthRate: existing?.defaultGrowthRate ?? 1.75,
        ...(params.lastSynced !== undefined
            ? { lastSynced: params.lastSynced }
            : existing?.lastSynced !== undefined
            ? { lastSynced: existing.lastSynced }
            : {}),
        updatedAt: params.updatedAt ?? Date.now(),
    };
}

export function prepareRestoreHeaders(syncHeaderKey?: string): Record<string, string> {
    const customHeaders: Record<string, string> = {};
    if (syncHeaderKey?.trim()) {
        customHeaders['x-chaser-token'] = syncHeaderKey.trim();
    }
    return customHeaders;
}
