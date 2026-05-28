export interface IncomeInput {
  id: string;
  ownerId: string;
  name: string;
  amount: number;
  frequency: string; // 'monthly' | 'annually'
  type: string;      // 'employment' | 'pension' | 'rental' | 'other'
  taxCategory: string;
  startDate?: number; // Timestamp ms
  endDate?: number;   // Timestamp ms
}

export interface ProjectionEngineInput {
  currentBalances: number; // Sum of active balances across liquid pots
  realGrowthRate: number;  // App global growth asset rate (e.g., 2.38)
  profile: {
    partner1Dob: number;   // Epoch timestamp ms
    partner2Dob?: number;  // Epoch timestamp ms
  };
  incomes: IncomeInput[];
  budgets: any[];          // Kept as any[] for this task
  properties: any[];       // Kept as any[] for this task
  propertyOwnership: any[]; // Kept as any[] for this task
}

export interface ProjectionYearResult {
  yearIndex: number;
  calendarYear: number;
  ageP1: number;
  ageP2: number | null;
  liquidAssets: number;
  isRunwayBroken: boolean;
  milestones: string[];
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

    let totalRegularIncomeForYear = 0;

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

      totalRegularIncomeForYear += baseAnnual * fraction;
    }

    trackingLiquidAssets += totalRegularIncomeForYear;

    results.push({
      yearIndex,
      calendarYear: runningCalendarYear,
      ageP1: currentAgeP1,
      ageP2: currentAgeP2,
      liquidAssets: trackingLiquidAssets,
      isRunwayBroken: false,
      milestones: []
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
