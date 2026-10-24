import type { Budget, Transaction } from '@/lib/db';

export interface TargetMonth {
  year: number;
  monthIndex: number;
  label: string;
}

export interface BarDataItem {
  month: string;
  amount: string;
  heightPct: number;
  exceeded: boolean;
}

export interface GraphDataResult {
  barData: BarDataItem[];
  underCount: number;
  exceededCount: number;
  cap: number;
}

export interface OverspendAlert {
  budgetId: string;
  budgetName: string;
  breachedCount: number;
  totalPeriods: number;
  avgExcess: number;
}

export interface SlackAlert {
  budgetId: string;
  budgetName: string;
  slackCount: number;
  totalPeriods: number;
  avgUnspent: number;
}

export interface BudgetAlertsResult {
  overspendAlerts: OverspendAlert[];
  slackAlerts: SlackAlert[];
}

export interface TuningMonthData {
  name: string;
  isError: boolean;
  amount: number;
}

export interface CategoryTuningItem {
  id: string;
  name: string;
  icon: string;
  cap: string;
  rawCap: number;
  totalSpent: number;
  statusText: string;
  isError: boolean;
  isMonthly: boolean;
  isAnnual: boolean;
  avgSpend: string;
  peakMonth: string;
  peakAmount: string;
  months: TuningMonthData[];
  proposalIcon: string;
  proposalText: string;
  actionLabel: string;
  showProposal: boolean;
}

export function getTargetMonths(
  selectedTimeframe: string,
  hasAnnualBudget: boolean,
  baseDate: Date = new Date()
): TargetMonth[] {
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth();

  const activeTimeframe = hasAnnualBudget && selectedTimeframe !== 'ytd' ? 'ytd' : selectedTimeframe;

  const targetMonths: TargetMonth[] = [];

  if (activeTimeframe === 'ytd') {
    for (let m = 0; m <= currentMonth; m++) {
      const d = new Date(currentYear, m, 1);
      targetMonths.push({
        year: currentYear,
        monthIndex: m,
        label: d.toLocaleString('en-GB', { month: 'short' }),
      });
    }
  } else {
    const count = activeTimeframe === '3m' ? 3 : activeTimeframe === '9m' ? 9 : 6;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      targetMonths.push({
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        label: d.toLocaleString('en-GB', { month: 'short' }),
      });
    }
  }
  return targetMonths;
}

export function calculateGraphData(
  isMonthlyBudgetSelected: boolean,
  selectedBudget: Budget | undefined,
  targetMonths: TargetMonth[],
  transactions: Transaction[]
): GraphDataResult {
  const capAmount = selectedBudget ? Number(selectedBudget.amount) || 0 : 0;

  if (!isMonthlyBudgetSelected || !selectedBudget) {
    return { barData: [], underCount: 0, exceededCount: 0, cap: 0 };
  }

  let underCount = 0;
  let exceededCount = 0;

  const barData = targetMonths.map(({ year, monthIndex, label }) => {
    const monthSpent = transactions
      .filter((t) => {
        if (t.budgetId !== selectedBudget.id) return false;
        if (t.type && t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === monthIndex;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const exceeded = capAmount > 0 ? monthSpent > capAmount : monthSpent > 0;
    if (exceeded) {
      exceededCount++;
    } else {
      underCount++;
    }

    const heightPct =
      capAmount > 0
        ? Math.min(100, Math.round((monthSpent / capAmount) * 70))
        : monthSpent > 0
        ? 100
        : 0;

    const formattedAmount =
      monthSpent >= 1000
        ? `£${(monthSpent / 1000).toFixed(2)}k`
        : `£${Math.round(monthSpent)}`;

    return {
      month: label,
      amount: formattedAmount,
      heightPct,
      exceeded,
    };
  });

  return { barData, underCount, exceededCount, cap: capAmount };
}

export function calculateBudgetAlerts(
  targetMonths: TargetMonth[],
  scopedBudgets: Budget[],
  transactions: Transaction[],
  selectedAccountId: string
): BudgetAlertsResult {
  const totalPeriods = targetMonths.length;

  if (totalPeriods === 0 || scopedBudgets.length === 0) {
    return { overspendAlerts: [], slackAlerts: [] };
  }

  const overspendCandidates: {
    budget: Budget;
    breachedCount: number;
    activePeriods: number;
    avgExcess: number;
  }[] = [];

  const slackCandidates: {
    budget: Budget;
    slackCount: number;
    activePeriods: number;
    avgUnspent: number;
  }[] = [];

  for (const budget of scopedBudgets) {
    const isMonthly =
      budget.frequency === 'monthly' || budget.frequency === 'month' || !budget.frequency;
    if (!isMonthly) continue;

    const cap = Number(budget.amount) || 0;
    if (cap <= 0) continue;

    const budgetStart = budget.budgetStartDate ?? new Date(2026, 3, 1).getTime();

    const activeTargetMonths = targetMonths.filter(({ year, monthIndex }) => {
      const monthEndTs = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();
      return monthEndTs >= budgetStart;
    });

    const activePeriods = activeTargetMonths.length;
    if (activePeriods === 0) continue;

    let breachedCount = 0;
    let slackCount = 0;
    let totalSpent = 0;
    let breachedExcessTotal = 0;
    let slackUnspentTotal = 0;

    for (const { year, monthIndex } of activeTargetMonths) {
      const monthSpent = transactions
        .filter((t) => {
          if (selectedAccountId && t.accountId && t.accountId !== selectedAccountId) return false;
          if (t.budgetId !== budget.id) return false;
          if (t.type && t.type === 'income') return false;
          const d = new Date(t.date);
          return d.getFullYear() === year && d.getMonth() === monthIndex;
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      totalSpent += monthSpent;

      if (monthSpent > cap) {
        breachedCount++;
        breachedExcessTotal += monthSpent - cap;
      }
      if (monthSpent < 0.3 * cap) {
        slackCount++;
        slackUnspentTotal += cap - monthSpent;
      }
    }

    const avgSpend = totalSpent / activePeriods;

    if (breachedCount / activePeriods > 0.35) {
      const avgExcess = avgSpend > cap ? avgSpend - cap : breachedExcessTotal / breachedCount;
      overspendCandidates.push({
        budget,
        breachedCount,
        activePeriods,
        avgExcess,
      });
    }

    if (breachedCount === 0 && slackCount / activePeriods > 0.35) {
      const avgUnspent = cap > avgSpend ? cap - avgSpend : slackUnspentTotal / slackCount;
      slackCandidates.push({
        budget,
        slackCount,
        activePeriods,
        avgUnspent,
      });
    }
  }

  overspendCandidates.sort(
    (a, b) => b.breachedCount - a.breachedCount || b.avgExcess - a.avgExcess
  );
  slackCandidates.sort(
    (a, b) => b.slackCount - a.slackCount || b.avgUnspent - a.avgUnspent
  );

  const overspendBudgetIds = new Set(overspendCandidates.map((c) => c.budget.id));
  const filteredSlackCandidates = slackCandidates.filter(
    (c) => !overspendBudgetIds.has(c.budget.id)
  );

  return {
    overspendAlerts: overspendCandidates.map((c) => ({
      budgetId: c.budget.id,
      budgetName: c.budget.name,
      breachedCount: c.breachedCount,
      totalPeriods: c.activePeriods,
      avgExcess: c.avgExcess,
    })),
    slackAlerts: filteredSlackCandidates.map((c) => ({
      budgetId: c.budget.id,
      budgetName: c.budget.name,
      slackCount: c.slackCount,
      totalPeriods: c.activePeriods,
      avgUnspent: c.avgUnspent,
    })),
  };
}

export function calculateCategoryTuningItems(
  sortedBudgets: Budget[],
  targetMonths: TargetMonth[],
  transactions: Transaction[]
): CategoryTuningItem[] {
  return sortedBudgets.map((budget) => {
    const cap = Number(budget.amount) || 0;
    const isAnnual = budget.frequency === 'annual';
    const isMonthly = budget.frequency === 'monthly' || budget.frequency === 'month';
    const monthlyCap = isAnnual ? cap / 12 : cap;

    let totalSpent = 0;
    let breachedCount = 0;
    let maxSpend = -1;
    let peakMonthLabel = targetMonths[0]?.label || 'Current';

    const monthsData = targetMonths.map(({ year, monthIndex, label }) => {
      const monthSpent = transactions
        .filter((t) => {
          if (t.budgetId !== budget.id) return false;
          if (t.type && t.type === 'income') return false;
          const d = new Date(t.date);
          return d.getFullYear() === year && d.getMonth() === monthIndex;
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      totalSpent += monthSpent;

      if (monthSpent > maxSpend) {
        maxSpend = monthSpent;
        peakMonthLabel = label;
      }

      const isError = isAnnual
        ? cap > 0
          ? totalSpent > cap
          : monthSpent > 0
        : monthlyCap > 0
        ? monthSpent > monthlyCap
        : monthSpent > 0;

      if (isError) {
        breachedCount++;
      }

      return {
        name: label,
        isError,
        amount: monthSpent,
      };
    });

    const budgetStart = budget.budgetStartDate ?? new Date(2026, 3, 1).getTime();
    const activeTargetMonths = targetMonths.filter(({ year, monthIndex }) => {
      const monthEndTs = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();
      return monthEndTs >= budgetStart;
    });
    const activeMonthCount = activeTargetMonths.length;
    const avgSpend = activeMonthCount > 0 ? totalSpent / activeMonthCount : (targetMonths.length > 0 ? totalSpent / targetMonths.length : 0);

    let statusText = 'Always within budget';
    if (breachedCount > 0) {
      statusText = `Breached: ${breachedCount} of last ${targetMonths.length} months`;
    }

    let proposalIcon = 'check_circle';
    let proposalText = `On target · Maintain current £${Math.round(monthlyCap).toLocaleString('en-GB')}/mo cap`;
    let actionLabel = 'Keep';
    let showProposal = true;

    if (monthlyCap <= 0) {
      proposalIcon = 'info';
      proposalText = 'No budget cap set';
      actionLabel = 'Set Cap';
    } else if (avgSpend > monthlyCap) {
      const diff = Math.round(avgSpend - monthlyCap);
      const suggestedCap = Math.round(avgSpend);
      proposalIcon = 'trending_up';
      proposalText = `Under-budgeted by £${diff.toLocaleString('en-GB')}/mo · Suggest adjusting cap to £${suggestedCap.toLocaleString('en-GB')}/mo`;
      actionLabel = 'Tune';
    } else if (monthlyCap - avgSpend >= 10) {
      if (isAnnual) {
        showProposal = false;
      } else {
        const cushion = Math.round(monthlyCap - avgSpend);
        const suggestedCap = Math.round(avgSpend);
        proposalIcon = 'check_circle';
        proposalText = `Unused cushion: £${cushion.toLocaleString('en-GB')}/mo · Safe to trim cap to £${suggestedCap.toLocaleString('en-GB')}/mo`;
        actionLabel = 'Trim';
      }
    } else {
      if (isAnnual) {
        showProposal = false;
      }
    }

    const capText = isAnnual
      ? `£${cap.toLocaleString('en-GB')}/yr (£${Math.round(monthlyCap).toLocaleString('en-GB')}/mo)`
      : `£${cap.toLocaleString('en-GB')}/mo`;

    const catIsError = isAnnual
      ? cap > 0
        ? totalSpent > cap
        : totalSpent > 0
      : breachedCount > 0;

    return {
      id: budget.id,
      name: budget.name,
      icon: budget.icon || 'payments',
      cap: capText,
      rawCap: cap,
      totalSpent,
      statusText,
      isError: catIsError,
      isMonthly,
      isAnnual,
      avgSpend: isMonthly ? `£${Math.round(avgSpend).toLocaleString('en-GB')}/mo` : 'N/A',
      peakMonth: peakMonthLabel,
      peakAmount: maxSpend >= 0 ? `£${Math.round(maxSpend).toLocaleString('en-GB')}` : '£0',
      months: monthsData,
      proposalIcon,
      proposalText,
      actionLabel,
      showProposal,
    };
  });
}
