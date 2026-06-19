import type { Income, Budget, Property, PropertyOwnership, Milestone } from '../lib/db';
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
  pensionPots?: {
    id: string;
    ownerId: 'person1' | 'person2';
    balance: number;
    category: string;
  }[];
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
  milestones?: Milestone[];
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

  let trackingPensions = input.pensionPots ? JSON.parse(JSON.stringify(input.pensionPots)) : [];
  if (!input.pensionPots && input.assetPots?.pensions) {
    trackingPensions.push({
      id: 'dummy-pension',
      ownerId: 'person1',
      balance: input.assetPots.pensions,
      category: 'DC Pension (Post-Drawdown)' // Crystallised for backwards-compatibility of flat tax tests
    });
  }

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
    const currentMilestones: string[] = [];

    if (input.milestones) {
      for (const milestone of input.milestones) {
        if (milestone.date >= yearStartTs && milestone.date <= yearEndTs) {
          totalCashInjectionsForYear += milestone.amount;
          currentMilestones.push(milestone.name);
        }
      }
    }

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

    const totalPensions = trackingPensions.reduce((sum: number, p: any) => sum + p.balance, 0);
    const totalBefore = trackingTaxable + trackingTaxFree + totalPensions;

    if (totalBefore > 0 || totalCashInjectionsForYear > 0) {
      let annualSurplus = netCashFlow + totalCashInjectionsForYear;

      if (annualSurplus >= 0) {
        trackingTaxable += annualSurplus;
      } else {
        let deficit = Math.abs(annualSurplus);
        const strategy = input.drawdownStrategy || 'proportional';

        if (strategy === 'proportional') {
          const availableCash = Math.max(0, (trackingTaxable + trackingTaxFree) - floor);
          const currentTotalPensions = trackingPensions.reduce((sum: number, p: any) => sum + p.balance, 0);
          const totalAtStartOfDeficit = availableCash + currentTotalPensions;
          if (totalAtStartOfDeficit > 0) {
            const ratioCash = availableCash / totalAtStartOfDeficit;
            const ratioPensions = currentTotalPensions / totalAtStartOfDeficit;

            const cashDrawNeeded = deficit * ratioCash;
            let pensionDrawNeeded = deficit * ratioPensions;

            // Split cashDrawNeeded between taxable and taxFree proportionally to their current relative balances
            const totalCash = trackingTaxable + trackingTaxFree;
            if (totalCash > 0) {
              const ratioTaxable = trackingTaxable / totalCash;
              const ratioTaxFree = trackingTaxFree / totalCash;
              trackingTaxable -= Math.min(trackingTaxable, cashDrawNeeded * ratioTaxable);
              trackingTaxFree -= Math.min(trackingTaxFree, cashDrawNeeded * ratioTaxFree);
            }

            // Iterate over pension pots to fulfill pensionDrawNeeded
            for (const pot of trackingPensions) {
              if (pensionDrawNeeded <= 0) break;
              if (pot.balance <= 0) continue;

              if (pot.category === 'DC Pension') {
                const requiredCrystallisation = pensionDrawNeeded * 4;
                if (pot.balance >= requiredCrystallisation) {
                  pot.balance -= requiredCrystallisation;
                  pensionDrawNeeded -= pensionDrawNeeded;
                  let postPot = trackingPensions.find((p: any) => p.category === 'DC Pension (Post-Drawdown)' && p.ownerId === pot.ownerId);
                  if (!postPot) {
                    postPot = { id: `post-${pot.id}-${yearIndex}`, ownerId: pot.ownerId, balance: 0, category: 'DC Pension (Post-Drawdown)' };
                    trackingPensions.push(postPot);
                  }
                  postPot.balance += requiredCrystallisation * 0.75;
                } else {
                  const availableTaxFree = pot.balance * 0.25;
                  pensionDrawNeeded -= availableTaxFree;
                  let postPot = trackingPensions.find((p: any) => p.category === 'DC Pension (Post-Drawdown)' && p.ownerId === pot.ownerId);
                  if (!postPot) {
                    postPot = { id: `post-${pot.id}-${yearIndex}`, ownerId: pot.ownerId, balance: 0, category: 'DC Pension (Post-Drawdown)' };
                    trackingPensions.push(postPot);
                  }
                  postPot.balance += pot.balance * 0.75;
                  pot.balance = 0;
                }
              } else if (pot.category === 'DC Pension (Post-Drawdown)') {
                const grossWithdrawal = pensionDrawNeeded / (1 - PENSION_DRAWDOWN_TAX_RATE);
                if (pot.balance >= grossWithdrawal) {
                  pot.balance -= grossWithdrawal;
                  pensionDrawNeeded = 0;
                } else {
                  pensionDrawNeeded -= pot.balance * (1 - PENSION_DRAWDOWN_TAX_RATE);
                  pot.balance = 0;
                }
              }
            }
          }
        } else {
          const order: ('taxable' | 'taxFree' | 'pensions')[] =
            strategy === 'taxable_first' ? ['taxable', 'taxFree', 'pensions'] :
            strategy === 'tax_free_first' ? ['taxFree', 'taxable', 'pensions'] :
            ['pensions', 'taxable', 'taxFree']; // pensions_first

          let availableCash = Math.max(0, (trackingTaxable + trackingTaxFree) - floor);

          for (const pot of order) {
            if (deficit <= 0) break;
            if (pot === 'taxable') {
              const draw = Math.min(trackingTaxable, availableCash, deficit);
              trackingTaxable -= draw;
              deficit -= draw;
              availableCash -= draw;
            } else if (pot === 'taxFree') {
              const draw = Math.min(trackingTaxFree, availableCash, deficit);
              trackingTaxFree -= draw;
              deficit -= draw;
              availableCash -= draw;
            } else if (pot === 'pensions') {
              for (const pPot of trackingPensions) {
                if (deficit <= 0) break;
                if (pPot.balance <= 0) continue;

                if (pPot.category === 'DC Pension') {
                  const requiredCrystallisation = deficit * 4;
                  if (pPot.balance >= requiredCrystallisation) {
                    pPot.balance -= requiredCrystallisation;
                    deficit -= deficit;
                    let postPot = trackingPensions.find((p: any) => p.category === 'DC Pension (Post-Drawdown)' && p.ownerId === pPot.ownerId);
                    if (!postPot) {
                      postPot = { id: `post-${pPot.id}-${yearIndex}`, ownerId: pPot.ownerId, balance: 0, category: 'DC Pension (Post-Drawdown)' };
                      trackingPensions.push(postPot);
                    }
                    postPot.balance += requiredCrystallisation * 0.75;
                  } else {
                    const availableTaxFree = pPot.balance * 0.25;
                    deficit -= availableTaxFree;
                    let postPot = trackingPensions.find((p: any) => p.category === 'DC Pension (Post-Drawdown)' && p.ownerId === pPot.ownerId);
                    if (!postPot) {
                      postPot = { id: `post-${pPot.id}-${yearIndex}`, ownerId: pPot.ownerId, balance: 0, category: 'DC Pension (Post-Drawdown)' };
                      trackingPensions.push(postPot);
                    }
                    postPot.balance += pPot.balance * 0.75;
                    pPot.balance = 0;
                  }
                } else if (pPot.category === 'DC Pension (Post-Drawdown)') {
                  const grossWithdrawal = deficit / (1 - PENSION_DRAWDOWN_TAX_RATE);
                  if (pPot.balance >= grossWithdrawal) {
                    pPot.balance -= grossWithdrawal;
                    deficit = 0;
                  } else {
                    deficit -= pPot.balance * (1 - PENSION_DRAWDOWN_TAX_RATE);
                    pPot.balance = 0;
                  }
                }
              }
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
      for (const pot of trackingPensions) pot.balance = 0;
    }

    // Floor and handle runway
    if (trackingTaxable < 0) trackingTaxable = 0;
    if (trackingTaxFree < 0) trackingTaxFree = 0;
    for (const pot of trackingPensions) {
      if (pot.balance < 0) pot.balance = 0;
    }

    const currentTotalPensionsAfterDrawdown = trackingPensions.reduce((sum: number, p: any) => sum + p.balance, 0);
    const trackingTotalLiquidAssets = trackingTaxable + trackingTaxFree + currentTotalPensionsAfterDrawdown;

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
        pensions: currentTotalPensionsAfterDrawdown,
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
      for (const pot of trackingPensions) {
        pot.balance *= (1 + ratePensions);
      }
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
