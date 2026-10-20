/**
 * Generates HTTP headers for sync operations.
 */
export function getSyncHeaders(syncHeaderKey: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (syncHeaderKey.trim()) {
        headers['x-chaser-token'] = syncHeaderKey.trim();
    }
    return headers;
}

/**
 * Validates whether all required remote sync configuration fields are present.
 */
export function validateSyncConfig(
    syncServerUrl: string,
    syncPassphrase: string,
    syncHeaderKey: string
): boolean {
    return Boolean(
        syncServerUrl.trim() &&
        syncPassphrase.trim() &&
        syncHeaderKey.trim()
    );
}
