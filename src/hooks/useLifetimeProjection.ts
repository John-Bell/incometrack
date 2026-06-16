import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { calculateLifetimeProjection, type DrawdownStrategy } from '@/utils/projectionEngine';
import type { TaxRulesByYear } from '@/constants/taxConstants';
import type { ProjectionYearResult } from '@/utils/projectionEngine';

export function useLifetimeProjection(drawdownStrategy?: DrawdownStrategy) {
  const dbProfile = useLiveQuery(() => db.profile.toArray());
  const dbAccounts = useLiveQuery(() => db.accounts.toArray());
  const dbIncomes = useLiveQuery(() => db.incomes.toArray());
  const dbBudgets = useLiveQuery(() => db.budgets.toArray());
  const dbProperties = useLiveQuery(() => db.properties.toArray());
  const dbPropertyOwnership = useLiveQuery(() => db.propertyOwnership.toArray());
  const dbTaxRules = useLiveQuery(() => db.taxRules.toArray());
  const dbSettings = useLiveQuery(() => db.settings.toArray());

  return useMemo(() => {
    // Fallback Boundary
    if (!dbProfile || dbProfile.length === 0 || !dbProfile[0].partner1Dob) {
      return { data: [] as ProjectionYearResult[], isReady: false, p1Name: 'Partner 1', p2Name: 'Partner 2', growthRate: 1.75 };
    }

    const activeProfile = dbProfile[0];
    const p1Name = activeProfile.partner1Name || 'Partner 1';
    const p2Name = activeProfile.partner2Name || 'Partner 2';

    // Ensure dependent data are loaded
    if (!dbAccounts || !dbIncomes || !dbBudgets || !dbProperties || !dbPropertyOwnership || !dbTaxRules || !dbSettings) {
      return { data: [] as ProjectionYearResult[], isReady: false, p1Name, p2Name, growthRate: 1.75 };
    }

    const growthRate = dbSettings[0]?.defaultGrowthRate ?? 1.75;

    // Calculate Initial Capital Pool
    const liquidCategories = [
      'Current Account',
      'Easy Access Savings',
      'Fixed Term Savings',
      'Notice Savings',
      'Cash ISA',
      'Shares ISA',
      'DC Pension',
      'Stocks & Shares',
      'Premium Bonds'
    ];

    const totalLiquidBalances = dbAccounts
      .filter((account) => liquidCategories.includes(account.category))
      .reduce((sum, account) => sum + account.balance, 0);

    const assetPots = {
      taxable: dbAccounts
        .filter(a => liquidCategories.includes(a.category) && !['Cash ISA', 'Shares ISA', 'Premium Bonds', 'DC Pension'].includes(a.category))
        .reduce((sum, a) => sum + a.balance, 0),
      taxFree: dbAccounts
        .filter(a => ['Cash ISA', 'Shares ISA', 'Premium Bonds'].includes(a.category))
        .reduce((sum, a) => sum + a.balance, 0),
      pensions: dbAccounts
        .filter(a => a.category === 'DC Pension')
        .reduce((sum, a) => sum + a.balance, 0)
    };

    // Reduce tax rules into a keyed map dictionary
    const reducedTaxRulesMap: TaxRulesByYear = dbTaxRules.reduce((acc, rule) => {
      acc[rule.id] = {
        StandardPersonalAllowance: rule.StandardPersonalAllowance,
        PersonalAllowanceThreshold: rule.PersonalAllowanceThreshold,
        PersonalAllowanceRemovalThreshold: rule.PersonalAllowanceRemovalThreshold,
        PersonalAllowanceReductionRate: rule.PersonalAllowanceReductionRate,
        BasicRateBand: rule.BasicRateBand,
        BasicRate: rule.BasicRate,
        HigherRateBand: rule.HigherRateBand,
        HigherRate: rule.HigherRate,
        AdditionalRate: rule.AdditionalRate,
        DividendAllowance: rule.DividendAllowance,
        DividendBasicRate: rule.DividendBasicRate,
        DividendHigherRate: rule.DividendHigherRate,
        DividendAdditionalRate: rule.DividendAdditionalRate,
        SavingsBasicRate: rule.SavingsBasicRate,
        SavingsHigherRate: rule.SavingsHigherRate,
        SavingsAdditionalRate: rule.SavingsAdditionalRate,
        RentalBasicRate: rule.RentalBasicRate,
        RentalHigherRate: rule.RentalHigherRate,
        RentalAdditionalRate: rule.RentalAdditionalRate,
        PropertyAllowance: rule.PropertyAllowance,
        SavingsAllowanceBasic: rule.SavingsAllowanceBasic,
        SavingsAllowanceHigher: rule.SavingsAllowanceHigher,
        SavingsAllowanceAdditional: rule.SavingsAllowanceAdditional,
        StartingRateForSavingsThreshold: rule.StartingRateForSavingsThreshold,
        StartingRateForSavings: rule.StartingRateForSavings,
        GeneralBandType: rule.GeneralBandType,
        SavingsBandType: rule.SavingsBandType,
        DividendsBandType: rule.DividendsBandType,
        PropertyBandType: rule.PropertyBandType,
        AllowanceBand: rule.AllowanceBand,
        BasicBand: rule.BasicBand,
        HigherBand: rule.HigherBand,
        AdditionalBand: rule.AdditionalBand,
        StartingBand: rule.StartingBand,
      };
      return acc;
    }, {} as TaxRulesByYear);

    // Execute Engine Matrix
    const projectionData = calculateLifetimeProjection({
      currentBalances: totalLiquidBalances,
      assetPots,
      drawdownStrategy,
      realGrowthRate: growthRate,
      profile: {
        partner1Dob: activeProfile.partner1Dob as number,
        partner2Dob: activeProfile.partner2Dob
      },
      incomes: dbIncomes,
      budgets: dbBudgets,
      properties: dbProperties,
      propertyOwnership: dbPropertyOwnership,
      taxRules: reducedTaxRulesMap
    });

    return {
      data: projectionData,
      isReady: true,
      p1Name,
      p2Name,
      growthRate
    };
  }, [
    dbProfile,
    dbAccounts,
    dbIncomes,
    dbBudgets,
    dbProperties,
    dbPropertyOwnership,
    dbTaxRules,
    dbSettings,
    drawdownStrategy
  ]);
}
