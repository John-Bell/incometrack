import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { TaxCalculationService } from '@/services/TaxCalculationService';

export function useTaxService(): TaxCalculationService | null {
    const taxRules = useStore(state => state.taxRules);
    const taxYear = useStore(state => state.taxYear);

    return useMemo(() => {
        if (!taxRules || !taxYear) {
            return null;
        }
        return new TaxCalculationService(taxRules, taxYear);
    }, [taxRules, taxYear]);
}
