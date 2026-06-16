import type { Income, Budget, Property, PropertyOwnership } from '../lib/db';
import { TaxCalculationService } from '../services/TaxCalculationService';
import type { TaxRulesByYear } from '../constants/taxConstants';

export interface ProjectionEngineInput {
  currentBalances: number; // Sum of active balances across liquid pots
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
}

export interface ProjectionYearResult {
  yearIndex: number;
  calendarYear: number;
  ageP1: number;
  ageP2: number | null;
  liquidAssets: number;
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

  let trackingLiquidAssets = input.currentBalances;
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

    if (trackingLiquidAssets > 0 || totalCashInjectionsForYear > 0) {
      trackingLiquidAssets = (trackingLiquidAssets + netCashFlow + totalCashInjectionsForYear) * (1 + input.realGrowthRate / 100);
    } else {
      trackingLiquidAssets = 0;
    }

    let isRunwayBroken = false;
    if (trackingLiquidAssets <= 0) {
      trackingLiquidAssets = 0;
      isRunwayBroken = true;
    }

    results.push({
      yearIndex,
      calendarYear: runningCalendarYear,
      ageP1: currentAgeP1,
      ageP2: currentAgeP2,
      liquidAssets: trackingLiquidAssets,
      isRunwayBroken: isRunwayBroken,
      milestones: [],
      annualBudget: totalBudgetsForYear,
      netCashFlow: netCashFlow
    });

    if (currentAgeP1 >= 100) {
      break;
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
