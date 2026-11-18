import { describe, it, expect, vi } from 'vitest';
import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_STORAGE_KEY,
  clearChunkReloadTimestamp,
  isChunkLoadError,
  registerPreloadErrorHandler,
  retryDynamicImport,
  tryReloadOnChunkError,
} from './lazyRetry';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => map.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      map.delete(key);
    }),
  };
}

describe('lazyRetry', () => {
  describe('isChunkLoadError', () => {
    it('detects iOS Safari module script import failure', () => {
      expect(
        isChunkLoadError(new TypeError('Importing a module script failed.')),
      ).toBe(true);
    });

    it('detects Chromium dynamic import fetch failure', () => {
      expect(
        isChunkLoadError(
          new TypeError(
            'Failed to fetch dynamically imported module: https://example.com/assets/Page-abc123.js',
          ),
        ),
      ).toBe(true);
    });

    it('detects Firefox dynamic import failure and MIME mismatch', () => {
      expect(
        isChunkLoadError(new TypeError('error loading dynamically imported module')),
      ).toBe(true);
      expect(
        isChunkLoadError(
          new Error("'text/html' is not a valid JavaScript MIME type"),
        ),
      ).toBe(true);
    });

    it('detects Vite CSS preload failure', () => {
      expect(
        isChunkLoadError(new Error('Unable to preload CSS for /assets/style.css')),
      ).toBe(true);
    });

    it('returns false for standard runtime errors or nullish values', () => {
      expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(
        false,
      );
      expect(isChunkLoadError(null)).toBe(false);
      expect(isChunkLoadError(undefined)).toBe(false);
    });
  });

  describe('tryReloadOnChunkError', () => {
    it('reloads once and prevents duplicate reloads within the cooldown window', () => {
      const storage = createMemoryStorage();
      const reload = vi.fn();
      let currentTime = 1_000_000;

      // First failure triggers a reload
      expect(
        tryReloadOnChunkError({
          storage,
          reload,
          now: () => currentTime,
        }),
      ).toBe(true);
      expect(reload).toHaveBeenCalledTimes(1);
      expect(storage.getItem(CHUNK_RELOAD_STORAGE_KEY)).toBe(String(currentTime));

      // Second failure 2 seconds later is suppressed to prevent a reload loop
      currentTime += 2_000;
      expect(
        tryReloadOnChunkError({
          storage,
          reload,
          now: () => currentTime,
        }),
      ).toBe(false);
      expect(reload).toHaveBeenCalledTimes(1);

      // Failure after the cooldown window expires triggers a reload again
      currentTime += CHUNK_RELOAD_COOLDOWN_MS + 1;
      expect(
        tryReloadOnChunkError({
          storage,
          reload,
          now: () => currentTime,
        }),
      ).toBe(true);
      expect(reload).toHaveBeenCalledTimes(2);
    });

    it('clears the reload timestamp via clearChunkReloadTimestamp', () => {
      const storage = createMemoryStorage();
      storage.setItem(CHUNK_RELOAD_STORAGE_KEY, '12345');
      clearChunkReloadTimestamp(storage);
      expect(storage.getItem(CHUNK_RELOAD_STORAGE_KEY)).toBeNull();
    });
  });

  describe('retryDynamicImport', () => {
    it('resolves the module when dynamic import succeeds', async () => {
      const mod = { default: () => null };
      const result = await retryDynamicImport(async () => mod);
      expect(result).toBe(mod);
    });

    it('triggers a reload on chunk error when cooldown is inactive', async () => {
      const storage = createMemoryStorage();
      const reload = vi.fn();

      let settled = false;
      retryDynamicImport(
        () => Promise.reject(new TypeError('Importing a module script failed.')),
        { storage, reload, now: () => 50_000 },
      ).then(
        () => {
          settled = true;
        },
        () => {
          settled = true;
        },
      );

      // Flush microtasks
      await Promise.resolve();
      await Promise.resolve();

      expect(reload).toHaveBeenCalledTimes(1);
      expect(settled).toBe(false);
    });

    it('rethrows chunk error when reload was already attempted within cooldown', async () => {
      const storage = createMemoryStorage();
      const reload = vi.fn();
      storage.setItem(CHUNK_RELOAD_STORAGE_KEY, '50000');

      await expect(
        retryDynamicImport(
          () => Promise.reject(new TypeError('Importing a module script failed.')),
          { storage, reload, now: () => 52_000 },
        ),
      ).rejects.toThrow('Importing a module script failed.');
      expect(reload).not.toHaveBeenCalled();
    });

    it('rethrows non-chunk errors immediately without reloading', async () => {
      const storage = createMemoryStorage();
      const reload = vi.fn();

      await expect(
        retryDynamicImport(
          () => Promise.reject(new Error('Syntax or runtime bug')),
          { storage, reload, now: () => 50_000 },
        ),
      ).rejects.toThrow('Syntax or runtime bug');
      expect(reload).not.toHaveBeenCalled();
    });
  });

  describe('registerPreloadErrorHandler', () => {
    it('prevents default and triggers reload on vite:preloadError', () => {
      const storage = createMemoryStorage();
      const reload = vi.fn();

      const cleanup = registerPreloadErrorHandler(window, {
        storage,
        reload,
        now: () => 100_000,
      });

      const event = new CustomEvent('vite:preloadError', { cancelable: true });
      window.dispatchEvent(event);

      expect(reload).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);

      cleanup();
    });
  });
});
