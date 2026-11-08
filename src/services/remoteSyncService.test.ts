import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db, dbHooks } from '@/lib/db';
import { mergeData, remoteSyncService, encryptData, GRAVEYARD_RETENTION_MS } from './remoteSyncService';
import { useStore } from '@/store/useStore';

describe('remoteSyncService - mergeData', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
        dbHooks.isSyncing = false;
    });

    it('merges milestones from cloudData and detects local milestone changes', async () => {
        const cloudData = {
            milestones: [
                { id: 'ms-1', name: 'Retirement', date: 1700000000000, amount: 500000, updatedAt: 1000 }
            ]
        };

        const hasLocalChanges = await mergeData(cloudData);
        expect(hasLocalChanges).toBe(false);

        const saved = await db.milestones.get('ms-1');
        expect(saved).toEqual(cloudData.milestones[0]);

        // Add a local-only milestone and merge again
        dbHooks.isSyncing = true;
        await db.milestones.put({ id: 'ms-2', name: 'House Purchase', date: 1800000000000, amount: 100000, updatedAt: 2000 });
        dbHooks.isSyncing = false;

        const hasLocalChangesAfterAdd = await mergeData(cloudData);
        expect(hasLocalChangesAfterAdd).toBe(true);
    });

    it('Step B: sets hasLocalChanges = true when a local tombstone is missing from cloudTombstones', async () => {
        await db.deletedRows.put({
            id: 'del-1',
            tableName: 'accounts',
            deletedAt: 5000
        });

        const hasLocalChanges = await mergeData({
            deletedRows: []
        });

        expect(hasLocalChanges).toBe(true);
    });

    it('Step B: sets hasLocalChanges = true when a local tombstone has a newer deletedAt than cloudTombstones', async () => {
        const now = Date.now();
        await db.deletedRows.put({
            id: 'del-1',
            tableName: 'accounts',
            deletedAt: now - 1000
        });

        const hasLocalChanges = await mergeData({
            deletedRows: [
                { id: 'del-1', tableName: 'accounts', deletedAt: now - 2000 }
            ]
        });

        expect(hasLocalChanges).toBe(true);
    });

    it('Step B: filters out cloud tombstones older than 365 days and sets hasLocalChanges = true', async () => {
        const now = Date.now();
        const expiredDeletedAt = now - GRAVEYARD_RETENTION_MS - 10000;
        const recentDeletedAt = now - 10000;

        const hasLocalChanges = await mergeData({
            deletedRows: [
                { id: 'del-expired', tableName: 'accounts', deletedAt: expiredDeletedAt },
                { id: 'del-recent', tableName: 'accounts', deletedAt: recentDeletedAt }
            ]
        });

        expect(hasLocalChanges).toBe(true);
        const expiredInLocal = await db.deletedRows.get('del-expired');
        const recentInLocal = await db.deletedRows.get('del-recent');
        expect(expiredInLocal).toBeUndefined();
        expect(recentInLocal).toBeDefined();
    });

    it('Step D: sets hasLocalChanges = true when a tombstone blocks a cloud record that still exists in the cloud backup', async () => {
        // Cloud has both the tombstone AND the zombie record in accounts (or local has the tombstone with identical deletedAt)
        const now = Date.now();
        await db.deletedRows.put({
            id: 'acc-zombie',
            tableName: 'accounts',
            deletedAt: now - 5000
        });

        const hasLocalChanges = await mergeData({
            deletedRows: [
                { id: 'acc-zombie', tableName: 'accounts', deletedAt: now - 5000 }
            ],
            accounts: [
                {
                    id: 'acc-zombie',
                    ownerId: 'user1',
                    name: 'Zombie Account',
                    category: 'Cash',
                    balance: 100,
                    interestRate: 1,
                    updatedAt: now - 6000
                }
            ]
        });

        expect(hasLocalChanges).toBe(true);
        const zombieInLocal = await db.accounts.get('acc-zombie');
        expect(zombieInLocal).toBeUndefined();
    });

    it('preserves local sync state fields in settings when cloudTime > localTime', async () => {
        const mockHandle = { kind: 'file', name: 'backup.json' };
        await db.settings.put({
            id: 'default',
            currency: 'GBP',
            taxYear: '2024-2025',
            icloudSync: true,
            updatedAt: 1000,
            cloudHandle: mockHandle,
            lastSynced: 1500,
            syncServerUrl: 'https://local.sync.server/sync',
            syncPassphrase: 'local-passphrase',
            syncHeaderKey: 'local-header-key'
        });

        await mergeData({
            settings: [
                {
                    id: 'default',
                    currency: 'GBP',
                    taxYear: '2025-2026',
                    icloudSync: false,
                    defaultGrowthRate: 4.5,
                    updatedAt: 2000,
                    cloudHandle: { kind: 'file', name: 'remote.json' },
                    lastSynced: 999,
                    syncServerUrl: 'https://remote.sync.server/sync',
                    syncPassphrase: 'remote-passphrase',
                    syncHeaderKey: 'remote-header-key'
                }
            ]
        });

        const updatedSettings = await db.settings.get('default');
        expect(updatedSettings?.taxYear).toBe('2025-2026');
        expect(updatedSettings?.defaultGrowthRate).toBe(4.5);
        expect(updatedSettings?.updatedAt).toBe(2000);
        expect(updatedSettings?.cloudHandle).toEqual(mockHandle);
        expect(updatedSettings?.lastSynced).toBe(1500);
        expect(updatedSettings?.syncServerUrl).toBe('https://local.sync.server/sync');
        expect(updatedSettings?.syncPassphrase).toBe('local-passphrase');
        expect(updatedSettings?.syncHeaderKey).toBe('local-header-key');
    });

    it('restores dbHooks.isSyncing = false when db.transaction throws an error', async () => {
        const txSpy = vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('Transaction failed'));

        await expect(mergeData({})).rejects.toThrow('Transaction failed');
        expect(dbHooks.isSyncing).toBe(false);

        txSpy.mockRestore();
    });
});

describe('remoteSyncService - sync state machine', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
        dbHooks.isSyncing = false;
        remoteSyncService._isSyncing = false;
        remoteSyncService._hasPendingLocalChanges = false;
        if (remoteSyncService._syncTimeout) {
            clearTimeout(remoteSyncService._syncTimeout);
            remoteSyncService._syncTimeout = null;
        }
        await db.settings.put({
            id: 'default',
            currency: 'GBP',
            taxYear: '2025-2026',
            icloudSync: false,
            lastSynced: 5000,
            syncServerUrl: 'https://sync.example.com/sync',
            syncPassphrase: 'test-passphrase',
            syncHeaderKey: 'test-header-key'
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('autoSync sets _hasPendingLocalChanges = true immediately and calls sync after 2000ms regardless of syncStatus', async () => {
        vi.useFakeTimers();
        useStore.getState().setSyncStatus('disconnected');
        const syncSpy = vi.spyOn(remoteSyncService, 'sync').mockResolvedValue(true);

        remoteSyncService.autoSync();
        expect(remoteSyncService._hasPendingLocalChanges).toBe(true);
        expect(syncSpy).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(2000);
        expect(syncSpy).toHaveBeenCalledTimes(1);
    });

    it('returns early if _isSyncing is already true', async () => {
        remoteSyncService._isSyncing = true;
        const fetchSpy = vi.spyOn(globalThis, 'fetch');

        const result = await remoteSyncService.sync();
        expect(result).toBe(false);
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('does not blind POST when serverLastUpdated <= localLastSynced and forcePush is false', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ lastUpdated: 5000 })
        } as Response);

        const result = await remoteSyncService.sync();
        expect(result).toBe(true);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('https://sync.example.com/sync/version', expect.any(Object));
    });

    it('pulls, merges, and POSTs when forcePush is true even if serverLastUpdated <= localLastSynced, using server timestamp from POST', async () => {
        const encryptedCloudBlob = await encryptData({
            accounts: [
                {
                    id: 'acc-cloud',
                    ownerId: 'user1',
                    name: 'Cloud Account',
                    category: 'Cash',
                    balance: 500,
                    interestRate: 2,
                    updatedAt: 4000
                }
            ]
        }, 'test-passphrase');
        const encryptedBuffer = await encryptedCloudBlob.arrayBuffer();

        remoteSyncService._hasPendingLocalChanges = true;

        const fetchSpy = vi.spyOn(globalThis, 'fetch')
            // 1. GET /version
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ lastUpdated: 5000 })
            } as Response)
            // 2. GET /sync (pull)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                arrayBuffer: async () => encryptedBuffer
            } as Response)
            // 3. POST /sync (push)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ lastUpdated: 7777 })
            } as Response);

        const result = await remoteSyncService.sync();
        expect(result).toBe(true);
        expect(fetchSpy).toHaveBeenCalledTimes(3);
        expect(fetchSpy.mock.calls[2][1]?.method).toBe('POST');

        const mergedAccount = await db.accounts.get('acc-cloud');
        expect(mergedAccount?.name).toBe('Cloud Account');

        const updatedSettings = await db.settings.get('default');
        expect(updatedSettings?.lastSynced).toBe(7777);
        expect(useStore.getState().lastSynced).toBe(7777);
    });

    it('restores _hasPendingLocalChanges = true in catch when forcePush was true and resets _isSyncing = false', async () => {
        remoteSyncService._hasPendingLocalChanges = true;

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        } as Response);

        await expect(remoteSyncService.sync()).rejects.toThrow('Failed to check version: 500 Internal Server Error');
        expect(remoteSyncService._hasPendingLocalChanges).toBe(true);
        expect(remoteSyncService._isSyncing).toBe(false);
    });

    it('debounces retry via autoSync() in finally if _hasPendingLocalChanges became true mid-flight', async () => {
        const autoSyncSpy = vi.spyOn(remoteSyncService, 'autoSync');
        let fetchCallCount = 0;
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
            fetchCallCount++;
            if (fetchCallCount === 1) {
                // Simulate a local change occurring mid-flight during the first sync
                remoteSyncService._hasPendingLocalChanges = true;
            }
            return {
                ok: true,
                status: 200,
                json: async () => ({ lastUpdated: 5000 }),
                arrayBuffer: async () => new ArrayBuffer(0)
            } as Response;
        });

        await remoteSyncService.sync();

        expect(autoSyncSpy).toHaveBeenCalledTimes(1);
        expect(fetchCallCount).toBe(1);
        expect(remoteSyncService._hasPendingLocalChanges).toBe(true);
        expect(remoteSyncService._syncTimeout).not.toBeNull();
        expect(remoteSyncService._isSyncing).toBe(false);
    });

    it('purges local tombstones older than 365 days in cleanGraveyard() and retains tombstones newer than 365 days', async () => {
        const now = Date.now();
        const twoHundredDaysAgo = now - 200 * 24 * 60 * 60 * 1000;
        const fourHundredDaysAgo = now - 400 * 24 * 60 * 60 * 1000;

        await db.deletedRows.bulkPut([
            { id: 'tomb-200d', tableName: 'accounts', deletedAt: twoHundredDaysAgo },
            { id: 'tomb-400d', tableName: 'accounts', deletedAt: fourHundredDaysAgo }
        ]);

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ lastUpdated: 5000 })
        } as Response);

        await remoteSyncService.sync();

        expect(await db.deletedRows.get('tomb-200d')).toBeDefined();
        expect(await db.deletedRows.get('tomb-400d')).toBeUndefined();
    });

    it('refreshes useStore profile and taxYear immediately after mergeData in sync() Step 2', async () => {
        useStore.setState({ profile: null, taxYear: '2024-2025' });

        const cloudProfile = {
            id: 'default',
            name: 'Alice & Bob',
            partner1Name: 'Alice',
            partner2Name: 'Bob',
            createdAt: 1000,
            updatedAt: 9000
        };
        const encryptedCloudBlob = await encryptData({
            profile: [cloudProfile],
            settings: [
                {
                    id: 'default',
                    currency: 'GBP',
                    taxYear: '2026-2027',
                    icloudSync: false,
                    updatedAt: 9000
                }
            ]
        }, 'test-passphrase');
        const encryptedBuffer = await encryptedCloudBlob.arrayBuffer();

        vi.spyOn(globalThis, 'fetch')
            // 1. GET /version
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ lastUpdated: 9000 })
            } as Response)
            // 2. GET /sync (pull)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                arrayBuffer: async () => encryptedBuffer
            } as Response);

        await remoteSyncService.sync();

        expect(useStore.getState().profile).toEqual(cloudProfile);
        expect(useStore.getState().taxYear).toBe('2026-2027');
    });
});


