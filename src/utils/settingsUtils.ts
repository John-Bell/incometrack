/**
 * Utility functions for Settings management
 */

export function formatLastSynced(timestamp?: number): string {
    if (!timestamp) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date(timestamp));
}

export function buildProfileName(partner1Name: string, partner2Name: string): string {
    const p1 = partner1Name.trim();
    const p2 = partner2Name.trim();
    return `${p1} & ${p2 || 'Partner'}`;
}

export function formatDobForInput(dobTimestamp?: number): string {
    if (!dobTimestamp) return '';
    return new Date(dobTimestamp).toISOString().split('T')[0];
}

export function parseDobToTimestamp(dobString: string): number | undefined {
    if (!dobString) return undefined;
    const time = new Date(dobString).getTime();
    return isNaN(time) ? undefined : time;
}
