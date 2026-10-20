import { describe, it, expect } from 'vitest';
import { getSyncHeaders, validateSyncConfig } from './remoteSyncUtils';

describe('remoteSyncUtils', () => {
    describe('getSyncHeaders', () => {
        it('returns header with x-chaser-token when syncHeaderKey is provided', () => {
            const headers = getSyncHeaders(' secret-token-123 ');
            expect(headers).toEqual({ 'x-chaser-token': 'secret-token-123' });
        });

        it('returns empty headers object when syncHeaderKey is empty or whitespace', () => {
            expect(getSyncHeaders('')).toEqual({});
            expect(getSyncHeaders('   ')).toEqual({});
        });
    });

    describe('validateSyncConfig', () => {
        it('returns true when all inputs are non-empty strings', () => {
            expect(validateSyncConfig('https://example.com/sync', 'passphrase', 'headerKey')).toBe(true);
        });

        it('returns false if any input is missing or only whitespace', () => {
            expect(validateSyncConfig('', 'passphrase', 'headerKey')).toBe(false);
            expect(validateSyncConfig('https://example.com/sync', '   ', 'headerKey')).toBe(false);
            expect(validateSyncConfig('https://example.com/sync', 'passphrase', '')).toBe(false);
        });
    });
});
