import { describe, it, expect } from 'vitest';
import { getSyncStatusDetails, isSyncSettingsConfigured } from './syncStatusUtils';
import type { Settings } from '@/lib/db';

describe('syncStatusUtils', () => {
    describe('isSyncSettingsConfigured', () => {
        it('returns true only when server url, passphrase, and header key are non-empty', () => {
            const valid: Settings = {
                id: 'default',
                syncServerUrl: 'https://sync.example.com',
                syncPassphrase: 'secret',
                syncHeaderKey: 'key-123',
                updatedAt: 0
            };
            expect(isSyncSettingsConfigured(valid)).toBe(true);
            expect(isSyncSettingsConfigured({ ...valid, syncPassphrase: '   ' })).toBe(false);
            expect(isSyncSettingsConfigured(undefined)).toBe(false);
        });
    });

    describe('getSyncStatusDetails', () => {
        it('returns disconnected details', () => {
            expect(getSyncStatusDetails('disconnected', null)).toEqual({
                color: 'text-red-500',
                iconButtonColor: 'text-red-500',
                tooltip: 'Cloud not linked. Tap to connect.',
                icon: 'cloud_off'
            });
        });

        it('returns permission_needed details', () => {
            expect(getSyncStatusDetails('permission_needed', null)).toEqual({
                color: 'text-orange-500',
                iconButtonColor: 'text-orange-500',
                tooltip: 'Permission expired. Tap to reconnect.',
                icon: 'cloud_sync'
            });
        });

        it('returns connected details with formatted lastSynced time or never', () => {
            const neverSynced = getSyncStatusDetails('connected', null);
            expect(neverSynced.icon).toBe('cloud_done');
            expect(neverSynced.iconButtonColor).toBe('text-green-500');
            expect(neverSynced.tooltip).toBe('Connected. Last synced: never');

            const synced = getSyncStatusDetails('connected', 1700000000000);
            expect(synced.tooltip).toContain('Connected. Last synced:');
        });

        it('returns fallback details for unknown status', () => {
            expect(getSyncStatusDetails('unknown', null).icon).toBe('cloud');
        });
    });
});
