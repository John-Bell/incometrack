import type { Income, Budget, Property, PropertyOwnership } from '../lib/db';
import { TaxCalculationService } from '../services/TaxCalculationService';
import type { TaxRulesByYear } from '../constants/taxConstants';

export type DrawdownStrategy = 'taxable_first' | 'tax_free_first' | 'pensions_first' | 'proportional';

const PENSION_DRAWDOWN_TAX_RATE = 0.15;

export interface ProjectionEngineInput {
  currentBalances: number; // Sum of active balances across liquid pots
  assetPots?: {
    taxable: number;
    taxFree: number;
    pensions: number;
  };
  drawdownStrategy?: DrawdownStrategy;
  realGrowthRate: number;  // App global growth asset rate (e.g., 2.38)
  profile: {
    partner1Dob: number;   // Epoch timestamp ms
    partner2Dob?: number;  // Epoch timestamp ms
  };
  incomes: Income[];
  budgets: Budget[];
  properties: Property[];
  propertyOwnership: PropertyOwnership[];
  taxRules: TaxRulesByYear;
  protectionFloor?: number;
}

export interface ProjectionYearResult {
  yearIndex: number;
  calendarYear: number;
  ageP1: number;
  ageP2: number | null;
  liquidAssets: number;
  potBalances: {
    taxable: number;
    taxFree: number;
    pensions: number;
    total: number;
  };
  isRunwayBroken: boolean;
  milestones: string[];
  annualBudget: number;
  netCashFlow: number;
}

function calculateAge(dobTimestamp: number, currentDate: Date): number {
  const dobDate = new Date(dobTimestamp);
  let age = currentDate.getFullYear() - dobDate.getFullYear();
  const m = currentDate.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && currentDate.getDate() < dobDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateLifetimeProjection(input: ProjectionEngineInput): ProjectionYearResult[] {
  const currentDate = new Date();
  const startYear = currentDate.getFullYear();

  let currentAgeP1 = calculateAge(input.profile.partner1Dob, currentDate);
  let currentAgeP2: number | null = null;
  if (input.profile.partner2Dob !== undefined) {
    currentAgeP2 = calculateAge(input.profile.partner2Dob, currentDate);
  }

  let trackingTaxable = input.assetPots?.taxable ?? input.currentBalances;
  let trackingTaxFree = input.assetPots?.taxFree ?? 0;
  let trackingPensions = input.assetPots?.pensions ?? 0;

  const floor = input.protectionFloor ?? 0;

  const results: ProjectionYearResult[] = [];

  let yearIndex = 0;
  let runningCalendarYear = startYear;

  while (true) {
    // 1. Calculate boundaries for this specific calendar year
    const yearStartTs = new Date(runningCalendarYear, 0, 1, 0, 0, 0, 0).getTime();
    const yearEndTs = new Date(runningCalendarYear, 11, 31, 23, 59, 59, 999).getTime();
    const yearTotalMs = yearEndTs - yearStartTs;

    let p1Salary = 0;
    let p1Pension = 0;
    let p1Dividends = 0;

    let p2Salary = 0;
    let p2Pension = 0;
    let p2Dividends = 0;

    for (const income of input.incomes) {
      if (income.type === 'rental') {
        continue;
      }

      const effectiveStart = Math.max(yearStartTs, income.startDate ?? yearStartTs);
      const effectiveEnd = Math.min(yearEndTs, income.endDate ?? yearEndTs);

      if (effectiveStart > effectiveEnd) {
        continue;
      }

      const activeMs = effectiveEnd - effectiveStart;
      const fraction = activeMs / yearTotalMs;

      const baseAnnual = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
      const amountForYear = baseAnnual * fraction;

      if (income.ownerId === 'person1') {
        if (income.type === 'employment') p1Salary += amountForYear;
        else if (income.type === 'pension') p1Pension += amountForYear;
        else if (income.type === 'dividends') p1Dividends += amountForYear;
      } else if (income.ownerId === 'person2') {
        if (income.type === 'employment') p2Salary += amountForYear;
        else if (income.type === 'pension') p2Pension += amountForYear;
        else if (income.type === 'dividends') p2Dividends += amountForYear;
      }
    }

    let p1RentalGrossForYear = 0;
    let p2RentalGrossForYear = 0;
    let totalCashInjectionsForYear = 0;

    for (const property of input.properties) {
      // Step 0: Check for sale in this year
      const saleTs = property.estimatedSaleDate;
      const hasSaleDate = saleTs !== undefined;
      const isSoldBeforeThisYear = hasSaleDate && saleTs < yearStartTs;
      const isSoldDuringThisYear = hasSaleDate && saleTs >= yearStartTs && saleTs <= yearEndTs;

      if (isSoldBeforeThisYear) {
        // No rental income if sold in a previous year
        continue;
      }

      // Step A: Escalate Expected Rent
      const baseMonthly = property.expectedMonthlyIncome ?? 0;
      const annualBaseRent = baseMonthly * 12;
      const growthRate = property.annualGrowthRate ?? 0;
      let escalatedGrossRent = annualBaseRent * Math.pow(1 + growthRate / 100, yearIndex);

      // Step B: Pro-rate rent if sold this year
      if (isSoldDuringThisYear && saleTs !== undefined) {
        const activeMs = saleTs - yearStartTs;
        const fraction = Math.max(0, activeMs / yearTotalMs);
        escalatedGrossRent *= fraction;

        // Inject cash on sale
        totalCashInjectionsForYear += property.estimatedNetCashOnSale ?? 0;
      }

      // Step C: Find active ownership split
      const relevantOwnerships = input.propertyOwnership
        .filter(o => o.propertyId === property.id && o.startDate <= yearEndTs)
        .sort((a, b) => b.startDate - a.startDate);

      const activeSplit = relevantOwnerships.length > 0
        ? relevantOwnerships[0]
        : { person1Percent: 50, person2Percent: 50 };

      // Step D: Apportion to loop tracking variables
      p1RentalGrossForYear += escalatedGrossRent * (activeSplit.person1Percent / 100);
      p2RentalGrossForYear += escalatedGrossRent * (activeSplit.person2Percent / 100);
    }

    let totalBudgetsForYear = 0;
    for (const budget of input.budgets) {
      const baseBudgetAnnual = budget.frequency === 'monthly' ? budget.amount * 12 : budget.amount;
      totalBudgetsForYear += baseBudgetAnnual;
    }

    const taxYearString = `${runningCalendarYear}-${runningCalendarYear + 1}`;
    const taxService = new TaxCalculationService(input.taxRules, taxYearString);

    const p1TaxInput = {
      salary: p1Salary,
      rentalIncome: p1RentalGrossForYear,
      propertyExpenses: 0,
      pensionIncome: p1Pension,
      untaxedInterest: 0,
      dividends: p1Dividends,
      directPensionContrib: 0,
    };

    const p2TaxInput = {
      salary: p2Salary,
      rentalIncome: p2RentalGrossForYear,
      propertyExpenses: 0,
      pensionIncome: p2Pension,
      untaxedInterest: 0,
      dividends: p2Dividends,
      directPensionContrib: 0,
    };

    const p1TaxResult = taxService.calculateTax(p1TaxInput, taxYearString);
    const p2TaxResult = taxService.calculateTax(p2TaxInput, taxYearString);
    const totalTaxForYear = p1TaxResult.totalTax + p2TaxResult.totalTax;

    const totalInflows = (p1Salary + p1Pension + p1Dividends + p2Salary + p2Pension + p2Dividends) + p1RentalGrossForYear + p2RentalGrossForYear;
    const netCashFlow = totalInflows - totalBudgetsForYear - totalTaxForYear;

    const totalBefore = trackingTaxable + trackingTaxFree + trackingPensions;
    const currentMilestones: string[] = [];

    if (totalBefore > 0 || totalCashInjectionsForYear > 0) {
      let annualSurplus = netCashFlow + totalCashInjectionsForYear;

      if (annualSurplus >= 0) {
        trackingTaxable += annualSurplus;
      } else {
        let deficit = Math.abs(annualSurplus);
        const strategy = input.drawdownStrategy || 'proportional';

        if (strategy === 'proportional') {
          const availableTaxable = Math.max(0, trackingTaxable - floor);
          const totalAtStartOfDeficit = availableTaxable + trackingTaxFree + trackingPensions;
          if (totalAtStartOfDeficit > 0) {
            const ratioTaxable = availableTaxable / totalAtStartOfDeficit;
            const ratioTaxFree = trackingTaxFree / totalAtStartOfDeficit;
            const ratioPensions = trackingPensions / totalAtStartOfDeficit;

            // Apply realistic effective tax drag on the pension portion of the proportional drawdown
            const pensionDrawNeeded = deficit * ratioPensions;
            const grossPensionWithdrawal = pensionDrawNeeded / (1 - PENSION_DRAWDOWN_TAX_RATE);

            trackingTaxable -= Math.min(availableTaxable, deficit * ratioTaxable);
            trackingTaxFree -= Math.min(trackingTaxFree, deficit * ratioTaxFree);
            trackingPensions -= Math.min(trackingPensions, grossPensionWithdrawal);
          }
        } else {
          const order: ('taxable' | 'taxFree' | 'pensions')[] =
            strategy === 'taxable_first' ? ['taxable', 'taxFree', 'pensions'] :
            strategy === 'tax_free_first' ? ['taxFree', 'taxable', 'pensions'] :
            ['pensions', 'taxable', 'taxFree']; // pensions_first

          for (const pot of order) {
            if (deficit <= 0) break;
            if (pot === 'taxable') {
              const available = Math.max(0, trackingTaxable - floor);
              const draw = Math.min(available, deficit);
              trackingTaxable -= draw;
              deficit -= draw;
            } else if (pot === 'taxFree') {
              const draw = Math.min(trackingTaxFree, deficit);
              trackingTaxFree -= draw;
              deficit -= draw;
            } else if (pot === 'pensions') {
              const drawNeeded = Math.min(trackingPensions, deficit);
              // Define a realistic effective tax drag on DC pension withdrawals
              // (Accounts for 75% taxable portion hitting basic/higher rate bands)
              // Gross up the withdrawal: To get £85 net, you must pull £100 out of the pot
              const grossPensionWithdrawal = drawNeeded / (1 - PENSION_DRAWDOWN_TAX_RATE);
              // Ensure we don't draw more than the pot actually holds
              const actualGrossDraw = Math.min(trackingPensions, grossPensionWithdrawal);
              trackingPensions -= actualGrossDraw;
              // The deficit is only reduced by the NET amount that lands in your bank account
              const netDrawReceived = actualGrossDraw * (1 - PENSION_DRAWDOWN_TAX_RATE);
              deficit -= netDrawReceived;
            }
          }
        }
      }

      // Bed & ISA sweep logic (Starts in tax year 2027/2028)
      if (runningCalendarYear >= 2027) {
        const p1IsaAllowance = currentAgeP1 < 65 ? 12000 : 20000;
        let totalHouseholdAllowance = p1IsaAllowance;

        if (currentAgeP2 !== null) {
          const p2IsaAllowance = currentAgeP2 < 65 ? 12000 : 20000;
          totalHouseholdAllowance += p2IsaAllowance;
        }

        const emergencyFloor = 0;
        if (trackingTaxable > emergencyFloor) {
          const availableToSweep = trackingTaxable - emergencyFloor;
          const amountToSweep = Math.min(availableToSweep, totalHouseholdAllowance);

          if (amountToSweep > 0) {
            trackingTaxable -= amountToSweep;
            trackingTaxFree += amountToSweep;
            currentMilestones.push(`Bed & ISA sweep: £${Math.round(amountToSweep).toLocaleString('en-GB')} moved to tax-free pot`);
          }
        }
      }

    } else {
      trackingTaxable = 0;
      trackingTaxFree = 0;
      trackingPensions = 0;
    }

    // Floor and handle runway
    if (trackingTaxable < 0) trackingTaxable = 0;
    if (trackingTaxFree < 0) trackingTaxFree = 0;
    if (trackingPensions < 0) trackingPensions = 0;

    const trackingTotalLiquidAssets = trackingTaxable + trackingTaxFree + trackingPensions;

    let isRunwayBroken = false;
    if (trackingTotalLiquidAssets <= 0) {
      isRunwayBroken = true;
    }

    results.push({
      yearIndex,
      calendarYear: runningCalendarYear,
      ageP1: currentAgeP1,
      ageP2: currentAgeP2,
      liquidAssets: trackingTotalLiquidAssets,
      potBalances: {
        taxable: trackingTaxable,
        taxFree: trackingTaxFree,
        pensions: trackingPensions,
        total: trackingTotalLiquidAssets
      },
      isRunwayBroken: isRunwayBroken,
      milestones: currentMilestones,
      annualBudget: totalBudgetsForYear,
      netCashFlow: netCashFlow
    });

    if (currentAgeP1 >= 100) {
      break;
    }

    // Apply Growth for the next year
    if (trackingTotalLiquidAssets > 0) {
      // Derive realistic net-of-inflation growth rates relative to the global macro base
      // Taxable: Cash yields generally trail the macro rate + suffers minor unmodeled tax drag
      const rateTaxable = (input.realGrowthRate * 0.4) / 100;
      // Tax-Free: Cash ISA yields trail the macro rate but enjoy zero tax drag
      const rateTaxFree = (input.realGrowthRate * 0.5) / 100;
      // Pensions: Long-term equity/bond market returns outpace cash baseline compounding
      const ratePensions = (input.realGrowthRate * 1.5) / 100;

      trackingTaxable *= (1 + rateTaxable);
      trackingTaxFree *= (1 + rateTaxFree);
      trackingPensions *= (1 + ratePensions);
    }

    yearIndex++;
    runningCalendarYear++;
    currentAgeP1++;
    if (currentAgeP2 !== null) {
      currentAgeP2++;
    }
  }

  return results;
}
