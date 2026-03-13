import { create } from 'zustand';
import { db, initDb, type Profile } from '@/lib/db';
import { syncTaxRules } from '@/lib/seed';
import { TaxCalculationService } from '@/services/TaxCalculationService';
import { getDefaultTaxYear, type TaxRulesByYear } from '@/constants/taxConstants';

export interface AppState {
    isHydrated: boolean;
    profile: Profile | null;
    hydratingError: string | null;
    activeAccountsTab: string;
    taxService: TaxCalculationService | null;
    taxYear: string | null;
    syncStatus: 'disconnected' | 'connected' | 'permission_needed';
    lastSynced: number | null;

    initStore: () => Promise<void>;
    setProfile: (profile: Profile) => Promise<void>;
    setActiveAccountsTab: (tab: string) => void;
    setSyncStatus: (status: 'disconnected' | 'connected' | 'permission_needed') => void;
    setLastSynced: (timestamp: number | null) => void;
}

export const useStore = create<AppState>()((set) => ({
    isHydrated: false,
    profile: null,
    hydratingError: null,
    activeAccountsTab: 'joint',
    taxService: null,
    taxYear: null,
    syncStatus: 'disconnected',
    lastSynced: null,

    initStore: async () => {
        try {
            await initDb();

            const profilesCount = await db.profile.count();
            let activeProfile: Profile | null = null;

            if (profilesCount > 0) {
                // Load the first profile
                const profiles = await db.profile.toArray();
                activeProfile = profiles[0] || null;
            }

            // Run seed scripts
            await syncTaxRules();

            // Load tax rules from database and create a map
            const taxRulesArray = await db.taxRules.toArray();
            const taxRulesMap: TaxRulesByYear = {};
            taxRulesArray.forEach(rule => {
                taxRulesMap[rule.id] = rule;
            });

            // Get the current settings to find the tax year
            const settings = await db.settings.get('default');
            const currentTaxYear = settings?.taxYear || getDefaultTaxYear();

            // Instantiate the tax service
            const taxService = new TaxCalculationService(taxRulesMap, currentTaxYear);

            set({
                isHydrated: true,
                profile: activeProfile,
                taxService,
                taxYear: currentTaxYear,
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
    },

    setActiveAccountsTab: (tab: string) => set({ activeAccountsTab: tab }),
    setSyncStatus: (status: 'disconnected' | 'connected' | 'permission_needed') => set({ syncStatus: status }),
    setLastSynced: (timestamp: number | null) => set({ lastSynced: timestamp })
}));
