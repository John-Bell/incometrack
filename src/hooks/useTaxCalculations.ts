import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import type { TaxCalculationInput } from '@/models/TaxCalculationInput';
import type { TaxCalculationResult } from '@/models/TaxCalculationResult';
import { calculateProjectedAnnualInterest } from '@/utils/interestCalculations';
import { getTaxYearDates } from '@/constants/taxConstants';

export interface UseTaxCalculationsResult {
    p1Incomes: { employment: number; pension: number; rental: number; dividends: number; interest: number };
    p2Incomes: { employment: number; pension: number; rental: number; dividends: number; interest: number };
    p1TaxResult: TaxCalculationResult | null;
    p2TaxResult: TaxCalculationResult | null;
    p1TotalIncome: number;
    p2TotalIncome: number;
    combinedNet: number;
    combinedTotalTax: number;
    combinedEffectiveRate: number;
    isReady: boolean;
}

export function useTaxCalculations(): UseTaxCalculationsResult {
    const { taxService, taxYear } = useStore();

    const dbAccounts = useLiveQuery(() => db.accounts.toArray());
    const dbIncomes = useLiveQuery(() => db.incomes.toArray());
    const dbInterestAccruals = useLiveQuery(() => db.interestAccruals.toArray());

    return useMemo(() => {
        const allAccruals = dbInterestAccruals || [];
        const p1Incomes = { employment: 0, pension: 0, rental: 0, dividends: 0, interest: 0 };
        const p2Incomes = { employment: 0, pension: 0, rental: 0, dividends: 0, interest: 0 };

        if (dbIncomes) {
            dbIncomes.forEach(inc => {
                const amount = inc.frequency === 'monthly' ? inc.amount * 12 : inc.amount;
                const target = inc.ownerId === 'person1' ? p1Incomes : p2Incomes;

                if (inc.type === 'employment') target.employment += amount;
                else if (inc.type === 'pension') target.pension += amount;
                else if (inc.type === 'rental') target.rental += amount;
                else if (inc.type === 'dividends') target.dividends += amount;
            });
        }

        if (dbAccounts) {
            const { startTs, endTs } = getTaxYearDates(taxYear || undefined);

            dbAccounts.forEach(acc => {
                const taxFreeCategories = ['Cash ISA', 'Shares ISA', 'Premium Bonds'];
                if (acc.category && taxFreeCategories.includes(acc.category as string)) {
                    return;
                }

                const accountAccruals = allAccruals.filter(a => a.accountId === acc.id);
                const amount = calculateProjectedAnnualInterest(acc, accountAccruals, startTs, endTs);

                if (acc.ownerId === 'person1') p1Incomes.interest += amount;
                else if (acc.ownerId === 'person2') p2Incomes.interest += amount;
                else if (acc.ownerId === 'joint') {
                    p1Incomes.interest += amount / 2;
                    p2Incomes.interest += amount / 2;
                }
            });
        }

        const p1Input: TaxCalculationInput = {
            salary: p1Incomes.employment,
            rentalIncome: p1Incomes.rental,
            pensionIncome: p1Incomes.pension,
            untaxedInterest: p1Incomes.interest,
            dividends: p1Incomes.dividends,
            directPensionContrib: 0,
            otherIncome: 0
        };

        const p2Input: TaxCalculationInput = {
            salary: p2Incomes.employment,
            rentalIncome: p2Incomes.rental,
            pensionIncome: p2Incomes.pension,
            untaxedInterest: p2Incomes.interest,
            dividends: p2Incomes.dividends,
            directPensionContrib: 0,
            otherIncome: 0
        };

        let p1TaxResult: TaxCalculationResult | null = null;
        let p2TaxResult: TaxCalculationResult | null = null;

        if (taxService) {
            p1TaxResult = taxService.calculateTax(p1Input, taxYear || undefined);
            p2TaxResult = taxService.calculateTax(p2Input, taxYear || undefined);
        }

        const p1TotalIncome = Object.values(p1Incomes).reduce((sum, val) => sum + val, 0);
        const p2TotalIncome = Object.values(p2Incomes).reduce((sum, val) => sum + val, 0);

        const p1Net = p1TotalIncome - (p1TaxResult?.totalTax || 0);
        const p2Net = p2TotalIncome - (p2TaxResult?.totalTax || 0);

        const combinedNet = p1Net + p2Net;

        const combinedTotalTax = (p1TaxResult?.totalTax || 0) + (p2TaxResult?.totalTax || 0);
        const combinedTotalIncome = p1TotalIncome + p2TotalIncome;

        const combinedEffectiveRate = combinedTotalIncome > 0 ? (combinedTotalTax / combinedTotalIncome) * 100 : 0;

        return {
            p1Incomes,
            p2Incomes,
            p1TaxResult,
            p2TaxResult,
            p1TotalIncome,
            p2TotalIncome,
            combinedNet,
            combinedTotalTax,
            combinedEffectiveRate,
            isReady: !!dbAccounts && !!dbIncomes && !!taxService
        };

    }, [dbAccounts, dbIncomes, dbInterestAccruals, taxService, taxYear]);
}
