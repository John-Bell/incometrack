import { describe, it, expect } from 'vitest';
import {
    formatLastSynced,
    buildProfileName,
    formatDobForInput,
    parseDobToTimestamp,
} from './settingsUtils';

describe('settingsUtils', () => {
    describe('formatLastSynced', () => {
        it('returns "Never" when timestamp is undefined or 0', () => {
            expect(formatLastSynced(undefined)).toBe('Never');
            expect(formatLastSynced(0)).toBe('Never');
        });

        it('formats a valid timestamp correctly', () => {
            // Jan 15, 2025 14:30 UTC
            const timestamp = new Date('2025-01-15T14:30:00Z').getTime();
            const formatted = formatLastSynced(timestamp);
            expect(formatted).toContain('2025');
            expect(formatted).toContain('Jan');
            expect(formatted).toContain('15');
        });
    });

    describe('buildProfileName', () => {
        it('combines partner1 and partner2 names with ampersand', () => {
            expect(buildProfileName('Alice', 'Bob')).toBe('Alice & Bob');
        });

        it('trims whitespace from names', () => {
            expect(buildProfileName('  Alice ', ' Bob  ')).toBe('Alice & Bob');
        });

        it('uses "Partner" default when partner2Name is empty', () => {
            expect(buildProfileName('Alice', '')).toBe('Alice & Partner');
            expect(buildProfileName('Alice', '   ')).toBe('Alice & Partner');
        });
    });

    describe('formatDobForInput', () => {
        it('returns empty string when timestamp is undefined', () => {
            expect(formatDobForInput(undefined)).toBe('');
        });

        it('formats timestamp to YYYY-MM-DD string', () => {
            const timestamp = new Date('1990-05-20T00:00:00.000Z').getTime();
            expect(formatDobForInput(timestamp)).toBe('1990-05-20');
        });
    });

    describe('parseDobToTimestamp', () => {
        it('returns undefined for empty input', () => {
            expect(parseDobToTimestamp('')).toBeUndefined();
        });

        it('parses valid date string YYYY-MM-DD to timestamp', () => {
            const dateStr = '1990-05-20';
            const expectedTimestamp = new Date(dateStr).getTime();
            expect(parseDobToTimestamp(dateStr)).toBe(expectedTimestamp);
        });

        it('returns undefined for invalid date string', () => {
            expect(parseDobToTimestamp('invalid-date')).toBeUndefined();
        });
    });
});
