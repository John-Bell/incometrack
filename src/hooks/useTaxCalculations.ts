import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { useTaxService } from '@/hooks/useTaxService';
import type { TaxCalculationInput } from '@/models/TaxCalculationInput';
import type { TaxCalculationResult } from '@/models/TaxCalculationResult';
import { calculateProjectedAnnualInterest } from '@/utils/interestCalculations';
import { getTaxYearDates } from '@/constants/taxConstants';
import { calculatePropertyIncomeForTaxYear, calculatePropertyExpensesForTaxYear } from '@/utils/propertyCalculations';


export interface UseTaxCalculationsResult {
    p1Incomes: { employment: number; pension: number; rental: number; propertyIncome: number; propertyExpense: number; dividends: number; interest: number };
    p2Incomes: { employment: number; pension: number; rental: number; propertyIncome: number; propertyExpense: number; dividends: number; interest: number };
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
    const { taxYear } = useStore();
    const taxService = useTaxService();

    const dbAccounts = useLiveQuery(() => db.accounts.toArray());
    const dbIncomes = useLiveQuery(() => db.incomes.toArray());
    const dbInterestAccruals = useLiveQuery(() => db.interestAccruals.toArray());
    const dbProperties = useLiveQuery(() => db.properties.toArray());
    const dbPropertyIncomes = useLiveQuery(() => db.propertyIncomes.toArray());
    const dbPropertyExpenses = useLiveQuery(() => db.propertyExpenses.toArray());
    const dbPropertyOwnerships = useLiveQuery(() => db.propertyOwnership.toArray());

    return useMemo(() => {
        const allAccruals = dbInterestAccruals || [];
        const p1Incomes = { employment: 0, pension: 0, rental: 0, propertyIncome: 0, propertyExpense: 0, dividends: 0, interest: 0 };
        const p2Incomes = { employment: 0, pension: 0, rental: 0, propertyIncome: 0, propertyExpense: 0, dividends: 0, interest: 0 };

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

        const { startTs, endTs } = getTaxYearDates(taxYear || undefined);

        if (dbProperties && dbPropertyIncomes && dbPropertyOwnerships) {
            const { p1Rental, p2Rental } = calculatePropertyIncomeForTaxYear(
                dbPropertyIncomes,
                dbPropertyOwnerships,
                startTs,
                endTs
            );
            p1Incomes.propertyIncome += p1Rental;
            p2Incomes.propertyIncome += p2Rental;
        }

        if (dbProperties && dbPropertyExpenses && dbPropertyOwnerships) {
            const { p1Expenses, p2Expenses } = calculatePropertyExpensesForTaxYear(
                dbPropertyExpenses,
                dbPropertyOwnerships,
                startTs,
                endTs
            );
            p1Incomes.propertyExpense += p1Expenses;
            p2Incomes.propertyExpense += p2Expenses;
        }

        if (dbAccounts) {

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
            rentalIncome: p1Incomes.propertyIncome,
            pensionIncome: p1Incomes.pension,
            untaxedInterest: p1Incomes.interest,
            dividends: p1Incomes.dividends,
            directPensionContrib: 0,
            otherIncome: 0
        };

        const p2Input: TaxCalculationInput = {
            salary: p2Incomes.employment,
            rentalIncome: p2Incomes.propertyIncome,
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

        const p1TotalIncome = p1Incomes.employment + p1Incomes.pension + p1Incomes.rental + p1Incomes.propertyIncome + p1Incomes.dividends + p1Incomes.interest;
        const p2TotalIncome = p2Incomes.employment + p2Incomes.pension + p2Incomes.rental + p2Incomes.propertyIncome + p2Incomes.dividends + p2Incomes.interest;

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
            isReady: !!dbAccounts && !!dbIncomes && !!taxService && !!dbProperties && !!dbPropertyIncomes && !!dbPropertyExpenses && !!dbPropertyOwnerships
        };

    }, [dbAccounts, dbIncomes, dbInterestAccruals, dbProperties, dbPropertyIncomes, dbPropertyExpenses, dbPropertyOwnerships, taxService, taxYear]);
}
