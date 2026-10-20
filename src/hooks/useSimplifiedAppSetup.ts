import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/db';
import { decryptData, mergeData } from '@/services/remoteSyncService';
import {
    createProfileData,
    createSettingsData,
    prepareRestoreHeaders,
} from '@/utils/appSetupUtils';

export function useSimplifiedAppSetup() {
    const navigate = useNavigate();
    const { setProfile, initStore } = useStore();

    const [partner1Name, setPartner1Name] = useState('');
    const [partner1Dob, setPartner1Dob] = useState('');
    const [partner2Name, setPartner2Name] = useState('');
    const [partner2Dob, setPartner2Dob] = useState('');
    const [syncServerUrl, setSyncServerUrl] = useState('');
    const [syncPassphrase, setSyncPassphrase] = useState('');
    const [syncHeaderKey, setSyncHeaderKey] = useState('');

    // For the Restore section
    const [restoreSyncServerUrl, setRestoreSyncServerUrl] = useState('');
    const [restoreSyncPassphrase, setRestoreSyncPassphrase] = useState('');
    const [restoreSyncHeaderKey, setRestoreSyncHeaderKey] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreError, setRestoreError] = useState<string | null>(null);

    const handleGetStarted = async () => {
        if (!partner1Name.trim()) return;

        const profileData = createProfileData({
            partner1Name,
            partner1Dob,
            partner2Name,
            partner2Dob,
        });
        await setProfile(profileData);

        const existingSettings = await db.settings.get('default');
        const settingsData = createSettingsData({
            existingSettings,
            syncServerUrl,
            syncPassphrase,
            syncHeaderKey,
        });
        await db.settings.put(settingsData);

        navigate('/');
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        setRestoreError(null);
        try {
            const customHeaders = prepareRestoreHeaders(restoreSyncHeaderKey);

            const response = await fetch(restoreSyncServerUrl.trim(), { headers: customHeaders });
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            if (buffer.byteLength === 0) {
                throw new Error('Remote sync data is empty.');
            }

            const decryptedData = await decryptData(buffer, restoreSyncPassphrase.trim());

            await mergeData(decryptedData);

            const existingSettings = await db.settings.get('default');
            const settingsData = createSettingsData({
                existingSettings,
                syncServerUrl: restoreSyncServerUrl,
                syncPassphrase: restoreSyncPassphrase,
                syncHeaderKey: restoreSyncHeaderKey,
                lastSynced: Date.now(),
            });

            await db.settings.put(settingsData);

            await initStore();
            navigate('/');
        } catch (error) {
            console.error('Restore failed:', error);
            setRestoreError(
                error instanceof Error ? error.message : 'An unknown error occurred during restore.'
            );
        } finally {
            setIsRestoring(false);
        }
    };

    return {
        partner1Name,
        setPartner1Name,
        partner1Dob,
        setPartner1Dob,
        partner2Name,
        setPartner2Name,
        partner2Dob,
        setPartner2Dob,
        syncServerUrl,
        setSyncServerUrl,
        syncPassphrase,
        setSyncPassphrase,
        syncHeaderKey,
        setSyncHeaderKey,
        restoreSyncServerUrl,
        setRestoreSyncServerUrl,
        restoreSyncPassphrase,
        setRestoreSyncPassphrase,
        restoreSyncHeaderKey,
        setRestoreSyncHeaderKey,
        isRestoring,
        restoreError,
        handleGetStarted,
        handleRestore,
    };
}
