import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import {
    buildProfileName,
    formatDobForInput,
    parseDobToTimestamp,
} from '@/utils/settingsUtils';

export function useSettings() {
    const navigate = useNavigate();
    const { setTaxYear } = useStore();

    const settings = useLiveQuery(() => db.settings.toArray());
    const taxRules = useLiveQuery(() => db.taxRules.toArray());
    const profiles = useLiveQuery(() => db.profile.toArray());

    const currentSettings = settings?.[0];
    const currentProfile = profiles?.[0];

    const [isSaving, setIsSaving] = useState(false);
    const [remoteSync, setRemoteSync] = useState(false);
    const [defaultGrowthRate, setDefaultGrowthRate] = useState<number>(1.75);

    const [partner1Name, setPartner1Name] = useState('');
    const [partner1Dob, setPartner1Dob] = useState('');
    const [partner2Name, setPartner2Name] = useState('');
    const [partner2Dob, setPartner2Dob] = useState('');

    useEffect(() => {
        if (currentSettings) {
            setRemoteSync(currentSettings.icloudSync || false);
            setDefaultGrowthRate(currentSettings.defaultGrowthRate ?? 1.75);
        }
    }, [currentSettings]);

    useEffect(() => {
        if (currentProfile) {
            setPartner1Name(currentProfile.partner1Name || '');
            setPartner1Dob(formatDobForInput(currentProfile.partner1Dob));
            setPartner2Name(currentProfile.partner2Name || '');
            setPartner2Dob(formatDobForInput(currentProfile.partner2Dob));
        }
    }, [currentProfile]);

    const handleTaxYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTaxYear = e.target.value;
        if (currentSettings) {
            await db.settings.update(currentSettings.id, { taxYear: newTaxYear });
            setTaxYear(newTaxYear);
        }
    };

    const handleSave = async () => {
        if (currentSettings || currentProfile) {
            setIsSaving(true);
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
                setIsSaving(false);
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
