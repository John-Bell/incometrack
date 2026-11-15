import { useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { db } from '@/lib/db';
import { decryptData, mergeData } from '@/services/remoteSyncService';
import {
    createProfileData,
    createSettingsData,
    prepareRestoreHeaders,
} from '@/utils/appSetupUtils';

export interface SimplifiedAppSetupState {
    partner1Name: string;
    partner1Dob: string;
    partner2Name: string;
    partner2Dob: string;
    syncServerUrl: string;
    syncPassphrase: string;
    syncHeaderKey: string;
    restoreSyncServerUrl: string;
    restoreSyncPassphrase: string;
    restoreSyncHeaderKey: string;
    isRestoring: boolean;
    restoreError: string | null;
}

const initialSimplifiedAppSetupState: SimplifiedAppSetupState = {
    partner1Name: '',
    partner1Dob: '',
    partner2Name: '',
    partner2Dob: '',
    syncServerUrl: '',
    syncPassphrase: '',
    syncHeaderKey: '',
    restoreSyncServerUrl: '',
    restoreSyncPassphrase: '',
    restoreSyncHeaderKey: '',
    isRestoring: false,
    restoreError: null,
};

export function useSimplifiedAppSetup() {
    const navigate = useNavigate();
    const setProfile = useStore((state) => state.setProfile);
    const initStore = useStore((state) => state.initStore);

    const [state, setState] = useState<SimplifiedAppSetupState>(initialSimplifiedAppSetupState);

    const {
        partner1Name,
        partner1Dob,
        partner2Name,
        partner2Dob,
        syncServerUrl,
        syncPassphrase,
        syncHeaderKey,
        restoreSyncServerUrl,
        restoreSyncPassphrase,
        restoreSyncHeaderKey,
        isRestoring,
        restoreError,
    } = state;

    const createFieldSetter =
        <K extends keyof SimplifiedAppSetupState>(
            field: K
        ): Dispatch<SetStateAction<SimplifiedAppSetupState[K]>> =>
        (value) => {
            setState((prev) => ({
                ...prev,
                [field]:
                    typeof value === 'function'
                        ? (
                              value as (
                                  prevVal: SimplifiedAppSetupState[K]
                              ) => SimplifiedAppSetupState[K]
                          )(prev[field])
                        : value,
            }));
        };

    const setPartner1Name = createFieldSetter('partner1Name');
    const setPartner1Dob = createFieldSetter('partner1Dob');
    const setPartner2Name = createFieldSetter('partner2Name');
    const setPartner2Dob = createFieldSetter('partner2Dob');
    const setSyncServerUrl = createFieldSetter('syncServerUrl');
    const setSyncPassphrase = createFieldSetter('syncPassphrase');
    const setSyncHeaderKey = createFieldSetter('syncHeaderKey');
    const setRestoreSyncServerUrl = createFieldSetter('restoreSyncServerUrl');
    const setRestoreSyncPassphrase = createFieldSetter('restoreSyncPassphrase');
    const setRestoreSyncHeaderKey = createFieldSetter('restoreSyncHeaderKey');

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
        setState((prev) => ({ ...prev, isRestoring: true, restoreError: null }));
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
            setState((prev) => ({
                ...prev,
                restoreError:
                    error instanceof Error
                        ? error.message
                        : 'An unknown error occurred during restore.',
            }));
        } finally {
            setState((prev) => ({ ...prev, isRestoring: false }));
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
