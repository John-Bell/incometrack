export const CHUNK_RELOAD_STORAGE_KEY = 'chaser:chunk-reload-at';
export const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

export interface ReloadOptions {
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  reload?: () => void;
  now?: () => number;
}

const CHUNK_ERROR_PATTERNS = [
  /Importing a module script failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Unable to preload CSS/i,
  /Loading chunk [\w-]+ failed/i,
  /ChunkLoadError/i,
  /'text\/html' is not a valid JavaScript MIME type/i,
];

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;

  const name = error instanceof Error ? error.name : '';
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error);

  if (name === 'ChunkLoadError') {
    return true;
  }

  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function getDefaultStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

export function clearChunkReloadTimestamp(
  storage: Pick<Storage, 'removeItem'> | undefined = getDefaultStorage(),
): void {
  try {
    storage?.removeItem(CHUNK_RELOAD_STORAGE_KEY);
  } catch {
    // Ignore storage access errors in restricted contexts
  }
}

export function tryReloadOnChunkError(options: ReloadOptions = {}): boolean {
  const storage = options.storage ?? getDefaultStorage();
  const reload =
    options.reload ??
    (() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    });
  const now = options.now ? options.now() : Date.now();

  try {
    const rawLastReload = storage?.getItem(CHUNK_RELOAD_STORAGE_KEY);
    if (rawLastReload) {
      const lastReloadAt = Number(rawLastReload);
      if (!Number.isNaN(lastReloadAt) && now - lastReloadAt < CHUNK_RELOAD_COOLDOWN_MS) {
        return false;
      }
    }
    storage?.setItem(CHUNK_RELOAD_STORAGE_KEY, String(now));
  } catch {
    // If sessionStorage is unavailable (e.g. strict private mode), avoid an unguarded loop
    return false;
  }

  reload();
  return true;
}

export function retryDynamicImport<T>(
  importer: () => Promise<T>,
  options: ReloadOptions = {},
): Promise<T> {
  return importer().catch((error: unknown) => {
    if (isChunkLoadError(error) && tryReloadOnChunkError(options)) {
      // Return a never-resolving promise so Suspense stays on the loading spinner while reloading
      return new Promise<T>(() => {});
    }
    throw error;
  });
}

export function registerPreloadErrorHandler(
  target: Pick<Window, 'addEventListener' | 'removeEventListener'> | undefined =
    typeof window !== 'undefined' ? window : undefined,
  options: ReloadOptions = {},
): () => void {
  if (!target) {
    return () => {};
  }

  const handler = (event: Event) => {
    if (tryReloadOnChunkError(options)) {
      event.preventDefault();
    }
  };

  target.addEventListener('vite:preloadError', handler);
  return () => {
    target.removeEventListener('vite:preloadError', handler);
  };
}
