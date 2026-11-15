import { useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Profile, type Settings } from '@/lib/db';
import { useStore } from '@/store/useStore';
import {
    buildProfileName,
    formatDobForInput,
    parseDobToTimestamp,
} from '@/utils/settingsUtils';

export interface SettingsState {
    isSaving: boolean;
    remoteSync: boolean;
    defaultGrowthRate: number;
    partner1Name: string;
    partner1Dob: string;
    partner2Name: string;
    partner2Dob: string;
    syncedSettings: Settings | undefined;
    syncedProfile: Profile | undefined;
}

const initialSettingsState: SettingsState = {
    isSaving: false,
    remoteSync: false,
    defaultGrowthRate: 1.75,
    partner1Name: '',
    partner1Dob: '',
    partner2Name: '',
    partner2Dob: '',
    syncedSettings: undefined,
    syncedProfile: undefined,
};

export function useSettings() {
    const navigate = useNavigate();
    const setTaxYear = useStore((state) => state.setTaxYear);

    const settings = useLiveQuery(() => db.settings.toArray());
    const taxRules = useLiveQuery(() => db.taxRules.toArray());
    const profiles = useLiveQuery(() => db.profile.toArray());

    const currentSettings = settings?.[0];
    const currentProfile = profiles?.[0];

    const [state, setState] = useState<SettingsState>(initialSettingsState);

    if (currentSettings !== state.syncedSettings || currentProfile !== state.syncedProfile) {
        setState((prev) => ({
            ...prev,
            syncedSettings: currentSettings,
            syncedProfile: currentProfile,
            ...(currentSettings !== prev.syncedSettings && currentSettings
                ? {
                      remoteSync: currentSettings.icloudSync || false,
                      defaultGrowthRate: currentSettings.defaultGrowthRate ?? 1.75,
                  }
                : {}),
            ...(currentProfile !== prev.syncedProfile && currentProfile
                ? {
                      partner1Name: currentProfile.partner1Name || '',
                      partner1Dob: formatDobForInput(currentProfile.partner1Dob),
                      partner2Name: currentProfile.partner2Name || '',
                      partner2Dob: formatDobForInput(currentProfile.partner2Dob),
                  }
                : {}),
        }));
    }

    const {
        isSaving,
        remoteSync,
        defaultGrowthRate,
        partner1Name,
        partner1Dob,
        partner2Name,
        partner2Dob,
    } = state;

    const createFieldSetter =
        <K extends keyof SettingsState>(field: K): Dispatch<SetStateAction<SettingsState[K]>> =>
        (value) => {
            setState((prev) => ({
                ...prev,
                [field]:
                    typeof value === 'function'
                        ? (value as (prevVal: SettingsState[K]) => SettingsState[K])(prev[field])
                        : value,
            }));
        };

    const setRemoteSync = createFieldSetter('remoteSync');
    const setDefaultGrowthRate = createFieldSetter('defaultGrowthRate');
    const setPartner1Name = createFieldSetter('partner1Name');
    const setPartner1Dob = createFieldSetter('partner1Dob');
    const setPartner2Name = createFieldSetter('partner2Name');
    const setPartner2Dob = createFieldSetter('partner2Dob');

    const handleTaxYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTaxYear = e.target.value;
        if (currentSettings) {
            await db.settings.update(currentSettings.id, { taxYear: newTaxYear });
            setTaxYear(newTaxYear);
        }
    };

    const handleSave = async () => {
        if (currentSettings || currentProfile) {
            setState((prev) => ({ ...prev, isSaving: true }));
            try {
                if (currentSettings) {
                    await db.settings.update(currentSettings.id, {
                        icloudSync: remoteSync,
                        defaultGrowthRate: defaultGrowthRate,
                    });
                }

                if (currentProfile) {
                    await db.profile.update(currentProfile.id, {
                        name: buildProfileName(partner1Name, partner2Name),
                        partner1Name: partner1Name.trim(),
                        partner1Dob: parseDobToTimestamp(partner1Dob),
                        partner2Name: partner2Name.trim() || undefined,
                        partner2Dob: parseDobToTimestamp(partner2Dob),
                    });
                }
                await new Promise((resolve) => setTimeout(resolve, 500));
            } finally {
                setState((prev) => ({ ...prev, isSaving: false }));
            }
        }
    };

    const handleResetAppData = async () => {
        if (
            window.confirm(
                'Are you sure you want to permanently delete all app data? This action cannot be undone.'
            )
        ) {
            await Promise.all(db.tables.map((table) => table.clear()));
            localStorage.clear();
            const basePath = import.meta.env.BASE_URL;
            window.location.replace(`${basePath}setup`);
        }
    };

    return {
        navigate,
        currentSettings,
        taxRules,
        isSaving,
        remoteSync,
        setRemoteSync,
        defaultGrowthRate,
        setDefaultGrowthRate,
        partner1Name,
        setPartner1Name,
        partner1Dob,
        setPartner1Dob,
        partner2Name,
        setPartner2Name,
        partner2Dob,
        setPartner2Dob,
        handleTaxYearChange,
        handleSave,
        handleResetAppData,
    };
}
