import { db } from '@/lib/db';

/**
 * Utility to convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Utility to convert Base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Derives a key from a passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 600000, // At least 600,000 as requested
            hash: 'SHA-256',
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// ==========================================
// PART 1: Web Crypto Utilities
// ==========================================

export async function encryptData(data: any, passphrase: string) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(passphrase, salt);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        encodedData
    );

    return {
        ciphertext: arrayBufferToBase64(encryptedBuffer),
        iv: arrayBufferToBase64(iv.buffer),
        salt: arrayBufferToBase64(salt.buffer),
    };
}

export async function decryptData(encryptedBundle: any, passphrase: string) {
    if (!encryptedBundle || !encryptedBundle.ciphertext || !encryptedBundle.iv || !encryptedBundle.salt) {
        throw new Error('Invalid encrypted bundle format.');
    }

    const ciphertextBytes = base64ToUint8Array(encryptedBundle.ciphertext);
    const ivBytes = base64ToUint8Array(encryptedBundle.iv);
    const saltBytes = base64ToUint8Array(encryptedBundle.salt);

    const key = await deriveKey(passphrase, saltBytes);

    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBytes as BufferSource,
            },
            key,
            ciphertextBytes as BufferSource
        );

        const decoder = new TextDecoder();
        const decryptedString = decoder.decode(decryptedBuffer);

        return JSON.parse(decryptedString);
    } catch (error) {
        throw new Error('Decryption failed. Incorrect passphrase or corrupted data.');
    }
}

// ==========================================
// PART 2: Remote Sync Logic
// ==========================================

export const remoteSyncService = {
    async pushToServer() {
        try {
            const settingsArray = await db.settings.toArray();
            const settings = settingsArray[0];

            // Map settings property appropriately since the db schema might use syncServerUrl instead of syncUrl
            // Let's check both for compatibility
            const urlToUse = settings?.syncServerUrl || (settings as any)?.syncUrl;

            if (!settings || !urlToUse || !settings.syncPassphrase) {
                throw new Error('Sync settings (URL and Passphrase) are not configured.');
            }

            // Extract all data
            const allData: Record<string, any[]> = {
                profile: await db.profile.toArray(),
                accounts: await db.accounts.toArray(),
                incomes: await db.incomes.toArray(),
                scenarios: await db.scenarios.toArray(),
                settings: await db.settings.toArray(),
                monthlyArchives: await db.monthlyArchives.toArray(),
                notifications: await db.notifications.toArray(),
                taxRules: await db.taxRules.toArray(),
                transactions: await db.transactions.toArray(),
                budgets: await db.budgets.toArray(),
            };

            // Encrypt data
            const encryptedPayload = await encryptData(allData, settings.syncPassphrase);

            // Send via POST
            const response = await fetch(urlToUse, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(encryptedPayload),
            });

            if (!response.ok) {
                throw new Error(`Failed to push to server: ${response.status} ${response.statusText}`);
            }

            // Update lastSynced
            settings.lastSynced = Date.now();
            await db.settings.put(settings);

            return true;
        } catch (error) {
            console.error('pushToServer error:', error);
            throw error;
        }
    },

    async pullFromServer(syncUrl: string, syncPassphrase: string) {
        try {
            if (!syncUrl || !syncPassphrase) {
                throw new Error('Sync URL and Passphrase must be provided.');
            }

            // Fetch data
            const response = await fetch(syncUrl, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Failed to pull from server: ${response.status} ${response.statusText}`);
            }

            const encryptedBundle = await response.json();

            // Decrypt data
            const decryptedData = await decryptData(encryptedBundle, syncPassphrase);

            // Overwrite local tables
            const tables = [
                'profile', 'accounts', 'incomes', 'scenarios', 'settings',
                'monthlyArchives', 'notifications', 'taxRules', 'transactions', 'budgets'
            ];
            const dexieTables = tables.map(t => (db as any)[t]);

            await db.transaction('rw', dexieTables, async () => {
                for (const table of tables) {
                    if (decryptedData[table]) {
                        await (db as any)[table].clear();
                        await (db as any)[table].bulkAdd(decryptedData[table]);
                    }
                }
            });

            return true;
        } catch (error) {
            console.error('pullFromServer error:', error);
            throw error;
        }
    }
};
