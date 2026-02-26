import { create } from 'zustand';
import { db, type Profile } from '@/lib/db';
import { syncTaxRules, seedDummyAccounts } from '@/lib/seed';

export interface AppState {
    isHydrated: boolean;
    profile: Profile | null;
    hydratingError: string | null;

    initStore: () => Promise<void>;
    setProfile: (profile: Profile) => Promise<void>;
}

export const useStore = create<AppState>()((set) => ({
    isHydrated: false,
    profile: null,
    hydratingError: null,

    initStore: async () => {
        try {
            const profilesCount = await db.profile.count();
            let activeProfile: Profile | null = null;

            if (profilesCount > 0) {
                // Load the first profile
                const profiles = await db.profile.toArray();
                activeProfile = profiles[0] || null;
            }

            // Run seed scripts
            await syncTaxRules();

            // Only seed dummy accounts if there are absolutely no accounts
            const accountCount = await db.accounts.count();
            if (accountCount === 0) {
                await seedDummyAccounts();
            }

            set({
                isHydrated: true,
                profile: activeProfile,
                hydratingError: null
            });
        } catch (error) {
            console.error("Failed to hydrate from Dexie:", error);
            set({
                isHydrated: true, // We consider it "hydrated" (finished loading) even on error so app can render
                hydratingError: error instanceof Error ? error.message : "Unknown error connecting to local database"
            });
        }
    },

    setProfile: async (profile: Profile) => {
        await db.profile.put(profile);
        set({ profile });
    }
}));
