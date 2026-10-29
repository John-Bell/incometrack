import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { TaxCalculationService } from '@/services/TaxCalculationService';
import type { TaxCalculationInput } from '@/models/TaxCalculationInput';
import type { TaxCalculationResult } from '@/models/TaxCalculationResult';
import { calculateProjectedTaxableInterest, calculateProjectedTaxableInterestForAccount } from '@/services/accountCalculations';
import { getTaxYearDates, TAX_FREE_CATEGORIES } from '@/constants/taxConstants';
import type { Account, InterestAccrual } from '@/lib/db';
import { calculatePropertyIncomeForTaxYear, calculatePropertyExpensesForTaxYear } from '@/utils/propertyCalculations';
import { isIncomeValidInTaxYear } from '@/utils/incomeCalculations';

export interface PropertyBreakdown {
    propertyId: string;
    propertyName: string;
    p1Income: number;
    p2Income: number;
    p1Expense: number;
    p2Expense: number;
}

export interface UseSimulatorCalculationsResult {
    p1Incomes: { employment: number; pension: number; propertyIncome: number; propertyExpense: number; dividends: number; interest: number };
    p2Incomes: { employment: number; pension: number; propertyIncome: number; propertyExpense: number; dividends: number; interest: number };
    p1TaxResult: TaxCalculationResult | null;
    p2TaxResult: TaxCalculationResult | null;
    p1TotalIncome: number;
    p2TotalIncome: number;
    combinedNet: number;
    combinedTotalTax: number;
    combinedEffectiveRate: number;
    propertyBreakdowns: PropertyBreakdown[];
    p1MovableInterest: number;
    p2MovableInterest: number;
    totalMovableInterest: number;
    isReady: boolean;
}

export function useSimulatorCalculations(
    movableInterestP1Percent?: number,
    propertySplits?: Record<string, number>,
    taxYearOverride?: string,
    isaSweep?: boolean
): UseSimulatorCalculationsResult {
    const { taxYear: storeTaxYear, taxRules } = useStore();
    const effectiveTaxYear = taxYearOverride || storeTaxYear || undefined;

    const taxService = useMemo(() => {
        if (!taxRules) return null;
        return new TaxCalculationService(taxRules, effectiveTaxYear);
    }, [taxRules, effectiveTaxYear]);

    const { startTs, endTs } = useMemo(() => getTaxYearDates(effectiveTaxYear), [effectiveTaxYear]);

    const dbAccounts = useLiveQuery(() => db.accounts.toArray());
    const dbIncomes = useLiveQuery(() => db.incomes.toArray());
    const dbInterestAccruals = useLiveQuery(() => db.interestAccruals.where('date').between(startTs, endTs, true, true).toArray(), [startTs, endTs]);
    const dbProperties = useLiveQuery(() => db.properties.toArray());
    const dbPropertyIncomes = useLiveQuery(() => db.propertyIncomes.toArray());
    const dbPropertyExpenses = useLiveQuery(() => db.propertyExpenses.toArray());
    const dbPropertyOwnerships = useLiveQuery(() => db.propertyOwnership.toArray());

    return useMemo(() => {
        const allAccruals = dbInterestAccruals || [];
        const p1Incomes = { employment: 0, pension: 0, propertyIncome: 0, propertyExpense: 0, dividends: 0, interest: 0 };
        const p2Incomes = { employment: 0, pension: 0, propertyIncome: 0, propertyExpense: 0, dividends: 0, interest: 0 };

        let p1MovableInterest = 0;
        let p2MovableInterest = 0;

        if (dbIncomes) {
            dbIncomes
                .filter(inc => isIncomeValidInTaxYear(inc, startTs, endTs))
                .forEach(inc => {
                    const amount = inc.frequency === 'monthly' ? inc.amount * 12 : inc.amount;
                    const target = inc.ownerId === 'person1' ? p1Incomes : p2Incomes;

                    if (inc.type === 'employment') target.employment += amount;
                    else if (inc.type === 'pension') target.pension += amount;
                    else if (inc.type === 'dividends') target.dividends += amount;
                });
        }

        const propertyBreakdowns: PropertyBreakdown[] = [];

        if (dbProperties && dbPropertyIncomes && dbPropertyOwnerships && dbPropertyExpenses) {
            dbProperties.forEach(property => {
                const { p1Rental, p2Rental } = calculatePropertyIncomeForTaxYear(
                    dbPropertyIncomes.filter(i => i.propertyId === property.id),
                    dbPropertyOwnerships.filter(o => o.propertyId === property.id),
                    startTs,
                    endTs
                );

                const { p1Expenses, p2Expenses } = calculatePropertyExpensesForTaxYear(
                    dbPropertyExpenses.filter(e => e.propertyId === property.id),
                    dbPropertyOwnerships.filter(o => o.propertyId === property.id),
                    startTs,
                    endTs
                );

                let finalP1Rental = p1Rental;
                let finalP2Rental = p2Rental;
                let finalP1Expenses = p1Expenses;
                let finalP2Expenses = p2Expenses;

                if (propertySplits && propertySplits[property.id] !== undefined) {
                    const splitP1 = propertySplits[property.id];
                    const splitP2 = 100 - splitP1;

                    const totalRental = p1Rental + p2Rental;
                    const totalExpense = p1Expenses + p2Expenses;

                    finalP1Rental = totalRental * (splitP1 / 100);
                    finalP2Rental = totalRental * (splitP2 / 100);
                    finalP1Expenses = totalExpense * (splitP1 / 100);
                    finalP2Expenses = totalExpense * (splitP2 / 100);
                }

                if (finalP1Rental > 0 || finalP2Rental > 0 || finalP1Expenses > 0 || finalP2Expenses > 0) {
                    propertyBreakdowns.push({
                        propertyId: property.id,
                        propertyName: property.name,
                        p1Income: finalP1Rental,
                        p2Income: finalP2Rental,
                        p1Expense: finalP1Expenses,
                        p2Expense: finalP2Expenses
                    });
                }

                p1Incomes.propertyIncome += finalP1Rental;
                p2Incomes.propertyIncome += finalP2Rental;
                p1Incomes.propertyExpense += finalP1Expenses;
                p2Incomes.propertyExpense += finalP2Expenses;
            });
        } else if (dbPropertyIncomes && dbPropertyOwnerships && dbPropertyExpenses) {
            // Fallback if no dbProperties loaded yet but we have the raw incomes/expenses
            const { p1Rental, p2Rental } = calculatePropertyIncomeForTaxYear(
                dbPropertyIncomes,
                dbPropertyOwnerships,
                startTs,
                endTs
            );
            p1Incomes.propertyIncome += p1Rental;
            p2Incomes.propertyIncome += p2Rental;

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
            type WorkingAccount = Account & { isVirtualJointShare?: boolean };
            const workingAccounts: WorkingAccount[] = [];
            const workingAccruals: InterestAccrual[] = [];

            const jointAccountIds = new Set(dbAccounts.filter(a => a.ownerId === 'joint').map(a => a.id));

            for (const accrual of allAccruals) {
                if (jointAccountIds.has(accrual.accountId)) {
                    workingAccruals.push({
                        ...accrual,
                        id: `${accrual.id}_p1`,
                        accountId: `${accrual.accountId}_p1`,
                        interestAccrued: (accrual.interestAccrued || 0) / 2
                    });
                    workingAccruals.push({
                        ...accrual,
                        id: `${accrual.id}_p2`,
                        accountId: `${accrual.accountId}_p2`,
                        interestAccrued: (accrual.interestAccrued || 0) / 2
                    });
                } else {
                    workingAccruals.push(accrual);
                }
            }

            for (const acc of dbAccounts) {
                if (acc.ownerId === 'joint') {
                    const p1Share: WorkingAccount = {
                        ...acc,
                        id: `${acc.id}_p1`,
                        ownerId: 'person1',
                        balance: (acc.balance || 0) / 2,
                        isVirtualJointShare: true
                    };
                    const p2Share: WorkingAccount = {
                        ...acc,
                        id: `${acc.id}_p2`,
                        ownerId: 'person2',
                        balance: (acc.balance || 0) / 2,
                        isVirtualJointShare: true
                    };
                    workingAccounts.push(p1Share, p2Share);
                } else {
                    workingAccounts.push({ ...acc });
                }
            }

            if (isaSweep) {
                const SWEEP_AMOUNT = 20000;

                const isCandidate = (acc: Account) => {
                    const isTaxable = !acc.category || !TAX_FREE_CATEGORIES.includes(acc.category as any);
                    if (!isTaxable) return false;
                    if (acc.interestTrackingMethod === 'manual') return false;
                    if ((acc.balance || 0) <= 0) return false;
                    if ((acc.interestRate || 0) <= 0) return false;
                    const projectedInterest = calculateProjectedTaxableInterestForAccount(acc, workingAccruals, startTs, endTs);
                    if (projectedInterest <= 0) return false;
                    return true;
                };

                const sortCandidates = (a: WorkingAccount, b: WorkingAccount) => {
                    const isMovableA = (a.interestPayoutFrequency || 'monthly') !== 'annually' && (a.interestPayoutFrequency || 'monthly') !== 'at_maturity' && !a.interestPayoutDate;
                    const isMovableB = (b.interestPayoutFrequency || 'monthly') !== 'annually' && (b.interestPayoutFrequency || 'monthly') !== 'at_maturity' && !b.interestPayoutDate;
                    if (isMovableA !== isMovableB) {
                        return isMovableA ? -1 : 1;
                    }

                    const rateA = a.interestRate || 0;
                    const rateB = b.interestRate || 0;
                    if (rateB !== rateA) {
                        return rateB - rateA;
                    }

                    const isJointA = !!a.isVirtualJointShare;
                    const isJointB = !!b.isVirtualJointShare;
                    if (isJointA !== isJointB) {
                        return isJointA ? 1 : -1;
                    }

                    return 0;
                };

                // Sweep for Person 1
                const p1Candidates = workingAccounts
                    .filter(acc => acc.ownerId === 'person1' && isCandidate(acc))
                    .sort(sortCandidates);

                let p1Remaining = SWEEP_AMOUNT;
                for (const acc of p1Candidates) {
                    if (p1Remaining <= 0) break;
                    const deduct = Math.min(acc.balance, p1Remaining);
                    acc.balance -= deduct;
                    p1Remaining -= deduct;
                }

                // Sweep for Person 2
                const p2Candidates = workingAccounts
                    .filter(acc => acc.ownerId === 'person2' && isCandidate(acc))
                    .sort(sortCandidates);

                let p2Remaining = SWEEP_AMOUNT;
                for (const acc of p2Candidates) {
                    if (p2Remaining <= 0) break;
                    const deduct = Math.min(acc.balance, p2Remaining);
                    acc.balance -= deduct;
                    p2Remaining -= deduct;
                }
            }

            const taxableAccounts = workingAccounts.filter(acc => !acc.category || !TAX_FREE_CATEGORIES.includes(acc.category as any));

            const movableAccounts = taxableAccounts.filter(acc => {
                const frequency = acc.interestPayoutFrequency || 'monthly';
                const payoutTs = acc.interestPayoutDate;
                return frequency !== 'annually' && frequency !== 'at_maturity' && !payoutTs;
            });
            const nonMovableAccounts = taxableAccounts.filter(acc => {
                const frequency = acc.interestPayoutFrequency || 'monthly';
                const payoutTs = acc.interestPayoutDate;
                return !(frequency !== 'annually' && frequency !== 'at_maturity' && !payoutTs);
            });

            // Movable
            const p1Movable = movableAccounts.filter(acc => acc.ownerId === 'person1');
            const p2Movable = movableAccounts.filter(acc => acc.ownerId === 'person2');

            p1MovableInterest += calculateProjectedTaxableInterest(p1Movable, workingAccruals, startTs, endTs);
            p2MovableInterest += calculateProjectedTaxableInterest(p2Movable, workingAccruals, startTs, endTs);

            // Non-movable
            const p1NonMovable = nonMovableAccounts.filter(acc => acc.ownerId === 'person1');
            const p2NonMovable = nonMovableAccounts.filter(acc => acc.ownerId === 'person2');

            p1Incomes.interest += calculateProjectedTaxableInterest(p1NonMovable, workingAccruals, startTs, endTs);
            p2Incomes.interest += calculateProjectedTaxableInterest(p2NonMovable, workingAccruals, startTs, endTs);
        }

        const totalMovableInterest = p1MovableInterest + p2MovableInterest;
        let actualP1Movable = p1MovableInterest;
        let actualP2Movable = p2MovableInterest;

        if (movableInterestP1Percent !== undefined) {
            actualP1Movable = totalMovableInterest * (movableInterestP1Percent / 100);
            actualP2Movable = totalMovableInterest - actualP1Movable;
        }

        p1Incomes.interest += actualP1Movable;
        p2Incomes.interest += actualP2Movable;

        const p1Input: TaxCalculationInput = {
            salary: p1Incomes.employment,
            rentalIncome: p1Incomes.propertyIncome,
            propertyExpenses: p1Incomes.propertyExpense,
            pensionIncome: p1Incomes.pension,
            untaxedInterest: p1Incomes.interest,
            dividends: p1Incomes.dividends,
            directPensionContrib: 0,
            otherIncome: 0
        };

        const p2Input: TaxCalculationInput = {
            salary: p2Incomes.employment,
            rentalIncome: p2Incomes.propertyIncome,
            propertyExpenses: p2Incomes.propertyExpense,
            pensionIncome: p2Incomes.pension,
            untaxedInterest: p2Incomes.interest,
            dividends: p2Incomes.dividends,
            directPensionContrib: 0,
            otherIncome: 0
        };

        let p1TaxResult: TaxCalculationResult | null = null;
        let p2TaxResult: TaxCalculationResult | null = null;

        if (taxService) {
            p1TaxResult = taxService.calculateTax(p1Input, effectiveTaxYear);
            p2TaxResult = taxService.calculateTax(p2Input, effectiveTaxYear);
        }

        const p1TotalIncome = p1Incomes.employment + p1Incomes.pension + p1Incomes.propertyIncome + p1Incomes.dividends + p1Incomes.interest;
        const p2TotalIncome = p2Incomes.employment + p2Incomes.pension + p2Incomes.propertyIncome + p2Incomes.dividends + p2Incomes.interest;

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
            propertyBreakdowns,
            p1MovableInterest: actualP1Movable,
            p2MovableInterest: actualP2Movable,
            totalMovableInterest,
            isReady: !!dbAccounts && !!dbIncomes && !!taxService && !!dbProperties && !!dbPropertyIncomes && !!dbPropertyExpenses && !!dbPropertyOwnerships
        };

    }, [dbAccounts, dbIncomes, dbInterestAccruals, dbProperties, dbPropertyIncomes, dbPropertyExpenses, dbPropertyOwnerships, taxService, startTs, endTs, movableInterestP1Percent, propertySplits, isaSweep]);
}
