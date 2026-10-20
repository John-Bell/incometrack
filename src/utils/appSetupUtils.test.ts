import { describe, it, expect, vi } from 'vitest';
import {
    createProfileData,
    createSettingsData,
    prepareRestoreHeaders,
} from './appSetupUtils';

describe('appSetupUtils', () => {
    describe('createProfileData', () => {
        it('creates profile with partner 1 only', () => {
            const profile = createProfileData({
                partner1Name: '  Alice  ',
                createdAt: 1000000,
            });

            expect(profile).toEqual({
                id: 'default',
                name: 'Alice & Partner',
                partner1Name: 'Alice',
                partner1Dob: undefined,
                partner2Name: undefined,
                partner2Dob: undefined,
                createdAt: 1000000,
            });
        });

        it('creates profile with partner 1 and partner 2 with DOBs', () => {
            const profile = createProfileData({
                partner1Name: 'Alice',
                partner1Dob: '1990-01-15',
                partner2Name: 'Bob',
                partner2Dob: '1992-06-20',
                createdAt: 1000000,
            });

            expect(profile.name).toBe('Alice & Bob');
            expect(profile.partner1Name).toBe('Alice');
            expect(profile.partner1Dob).toBe(new Date('1990-01-15').getTime());
            expect(profile.partner2Name).toBe('Bob');
            expect(profile.partner2Dob).toBe(new Date('1992-06-20').getTime());
            expect(profile.createdAt).toBe(1000000);
        });

        it('handles invalid DOB gracefully', () => {
            const profile = createProfileData({
                partner1Name: 'Alice',
                partner1Dob: 'invalid-date',
            });

            expect(profile.partner1Dob).toBeUndefined();
        });
    });

    describe('createSettingsData', () => {
        it('uses defaults when no existing settings are provided', () => {
            const settings = createSettingsData({
                syncServerUrl: '  https://sync.example.com  ',
                syncPassphrase: '  secret-phrase  ',
                syncHeaderKey: '  my-header-key  ',
                updatedAt: 2000000,
            });

            expect(settings).toEqual({
                id: 'default',
                currency: 'GBP',
                taxYear: expect.any(String),
                icloudSync: false,
                syncServerUrl: 'https://sync.example.com',
                syncPassphrase: 'secret-phrase',
                syncHeaderKey: 'my-header-key',
                defaultGrowthRate: 1.75,
                updatedAt: 2000000,
            });
        });

        it('preserves existing settings when provided', () => {
            const existingSettings = {
                currency: 'USD',
                taxYear: '2025/2026',
                icloudSync: true,
                defaultGrowthRate: 2.5,
                lastSynced: 123456789,
            };

            const settings = createSettingsData({
                existingSettings,
                syncServerUrl: '',
                syncPassphrase: '',
                syncHeaderKey: '',
                updatedAt: 2000000,
            });

            expect(settings.currency).toBe('USD');
            expect(settings.taxYear).toBe('2025/2026');
            expect(settings.icloudSync).toBe(true);
            expect(settings.defaultGrowthRate).toBe(2.5);
            expect(settings.syncServerUrl).toBeUndefined();
            expect(settings.syncPassphrase).toBeUndefined();
            expect(settings.syncHeaderKey).toBeUndefined();
            expect(settings.lastSynced).toBe(123456789);
        });

        it('overrides lastSynced if passed explicitly', () => {
            const existingSettings = {
                lastSynced: 100,
            };

            const settings = createSettingsData({
                existingSettings,
                lastSynced: 999,
                updatedAt: 2000000,
            });

            expect(settings.lastSynced).toBe(999);
        });
    });

    describe('prepareRestoreHeaders', () => {
        it('returns x-chaser-token when syncHeaderKey is provided', () => {
            const headers = prepareRestoreHeaders('  secret-token  ');
            expect(headers).toEqual({
                'x-chaser-token': 'secret-token',
            });
        });

        it('returns empty object when syncHeaderKey is undefined or empty', () => {
            expect(prepareRestoreHeaders(undefined)).toEqual({});
            expect(prepareRestoreHeaders('')).toEqual({});
            expect(prepareRestoreHeaders('   ')).toEqual({});
        });
    });
});
