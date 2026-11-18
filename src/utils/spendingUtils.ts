import type { Account, Budget, Transaction } from '@/lib/db';
import type { TargetMonth } from './budgetUtils';

export const SPENDING_STACK_COLORS = [
  '#581c87', // purple-900
  '#0d9488', // teal-600
  '#f59e0b', // amber-500
  '#e11d48', // rose-600
  '#2563eb', // blue-600
  '#10b981', // emerald-500
  '#7c3aed', // violet-600
  '#ea580c', // orange-600
  '#0284c7', // sky-600
  '#db2777', // pink-600
];

export interface SpendingStackSegment {
  id: string;
  label: string;
  color: string;
  rawAmount: number;
  amount: string;
  pctOfBar: number;
}

export interface SpendingLegendItem {
  id: string;
  label: string;
  color: string;
  totalAmount: number;
  formattedAmount: string;
  percentage: string;
}

export interface SpendingBarItem {
  month: string;
  year: number;
  monthIndex: number;
  rawAmount: number;
  amount: string;
  heightPct: number;
  segments?: SpendingStackSegment[];
}

export interface SpendingGraphDataResult {
  barData: SpendingBarItem[];
  totalSpend: number;
  avgMonthlySpend: number;
  peakMonth: string;
  peakAmount: number;
  maxAmount: number;
  stackMode: 'none' | 'account' | 'budget';
  legendItems: SpendingLegendItem[];
}

export function getDisplayLegendItems(
  spendingData: SpendingGraphDataResult,
  selectedMonthIndex: number | null
): SpendingLegendItem[] {
  if (selectedMonthIndex === null) {
    return spendingData.legendItems;
  }
  const bar = spendingData.barData.find((b) => b.monthIndex === selectedMonthIndex);
  if (!bar || !bar.segments || bar.segments.length === 0) {
    return [];
  }
  return [...bar.segments]
    .sort((a, b) => b.rawAmount - a.rawAmount || a.label.localeCompare(b.label))
    .map((seg) => ({
      id: seg.id,
      label: seg.label,
      color: seg.color,
      totalAmount: seg.rawAmount,
      formattedAmount: seg.amount,
      percentage: `${seg.pctOfBar.toFixed(1)}%`,
    }));
}

function formatBarShortAmount(rawAmount: number): string {
  return rawAmount >= 1000
    ? `£${(rawAmount / 1000).toFixed(2)}k`
    : `£${Math.round(rawAmount)}`;
}

function formatLegendAmount(rawAmount: number): string {
  return `£${Math.round(rawAmount).toLocaleString('en-GB')}`;
}

export function calculateSpendingGraphData(
  targetMonths: TargetMonth[],
  transactions: Transaction[],
  selectedAccountId?: string,
  selectedBudgetId?: string,
  scopedBudgets?: Budget[],
  accounts?: Account[],
  showStacked?: boolean
): SpendingGraphDataResult {
  const allowedBudgetIds = scopedBudgets
    ? new Set(scopedBudgets.map((b) => b.id))
    : null;

  // Set of budget IDs marked as one-off
  const oneOffBudgetIds = scopedBudgets
    ? new Set(scopedBudgets.filter((b) => Boolean(b.oneOffBudget)).map((b) => b.id))
    : new Set<string>();

  // Filter eligible transactions
  const eligibleTransactions = transactions.filter((t) => {
    // Only expenses
    if (t.type && t.type !== 'expense') return false;

    // Filter by account if specified
    if (selectedAccountId && t.accountId && t.accountId !== selectedAccountId) {
      return false;
    }

    // Filter by budget if specified
    if (selectedBudgetId) {
      if (t.budgetId !== selectedBudgetId) return false;
    } else {
      // If no specific budget is selected, exclude transactions from one-off budgets
      if (t.budgetId && oneOffBudgetIds.has(t.budgetId)) {
        return false;
      }

      if (allowedBudgetIds !== null) {
        // If no specific budget selected, limit to scoped budgets (or unbudgeted if we allow, but scopedBudgets are within account)
        if (t.budgetId && !allowedBudgetIds.has(t.budgetId)) {
          return false;
        }
      }
    }

    return true;
  });

  const stackMode: 'none' | 'account' | 'budget' =
    !showStacked || selectedBudgetId
      ? 'none'
      : selectedAccountId
      ? 'budget'
      : 'account';

  const accountsMap = new Map<string, Account>();
  if (accounts) {
    for (const acc of accounts) {
      accountsMap.set(acc.id, acc);
    }
  }

  const budgetsMap = new Map<string, Budget>();
  if (scopedBudgets) {
    for (const b of scopedBudgets) {
      budgetsMap.set(b.id, b);
    }
  }

  const getGroupIdAndLabel = (t: Transaction): { id: string; label: string } => {
    if (stackMode === 'account') {
      const accId = t.accountId || 'unassigned_account';
      const acc = accountsMap.get(accId);
      const label = acc ? acc.nickname || acc.name : 'Other Account';
      return { id: accId, label };
    }
    const bId = t.budgetId || 'unbudgeted';
    const b = budgetsMap.get(bId);
    const label = b ? b.name : 'Unbudgeted';
    return { id: bId, label };
  };

  // Track totals across all targetMonths per group when stacked
  const groupTotalsMap = new Map<string, { id: string; label: string; totalAmount: number }>();

  let totalSpend = 0;
  let peakAmount = 0;
  let peakMonth = targetMonths[0]?.label || 'N/A';

  const monthlyTotals = targetMonths.map(({ year, monthIndex, label }) => {
    const monthTxs = eligibleTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });

    const monthGroupMap = new Map<string, number>();
    let monthSpent = 0;

    for (const t of monthTxs) {
      const amt = Number(t.amount) || 0;
      monthSpent += amt;

      if (stackMode !== 'none' && amt > 0) {
        const group = getGroupIdAndLabel(t);
        monthGroupMap.set(group.id, (monthGroupMap.get(group.id) || 0) + amt);

        const existing = groupTotalsMap.get(group.id);
        if (existing) {
          existing.totalAmount += amt;
        } else {
          groupTotalsMap.set(group.id, {
            id: group.id,
            label: group.label,
            totalAmount: amt,
          });
        }
      }
    }

    totalSpend += monthSpent;

    if (monthSpent > peakAmount) {
      peakAmount = monthSpent;
      peakMonth = label;
    }

    return {
      month: label,
      year,
      monthIndex,
      rawAmount: monthSpent,
      monthGroupMap,
    };
  });

  // Also include 0-spend accounts or budgets if no transactions occurred?
  // Wait: only showing accounts/budgets that contributed to the spend keeps the legend clean and directly shows what caused the spend!
  // Let's sort legend items by totalAmount descending (then label alphabetically)
  const sortedGroups = Array.from(groupTotalsMap.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount || a.label.localeCompare(b.label)
  );

  const legendItems: SpendingLegendItem[] =
    stackMode !== 'none'
      ? sortedGroups.map((group, idx) => {
          const color = SPENDING_STACK_COLORS[idx % SPENDING_STACK_COLORS.length];
          const pct = totalSpend > 0 ? ((group.totalAmount / totalSpend) * 100).toFixed(1) : '0.0';
          return {
            id: group.id,
            label: group.label,
            color,
            totalAmount: group.totalAmount,
            formattedAmount: formatLegendAmount(group.totalAmount),
            percentage: `${pct}%`,
          };
        })
      : [];

  const maxAmount = peakAmount > 0 ? peakAmount : 1;
  const activeMonthsCount = targetMonths.length;
  const avgMonthlySpend = activeMonthsCount > 0 ? totalSpend / activeMonthsCount : 0;

  const barData: SpendingBarItem[] = monthlyTotals.map((item) => {
    const formattedAmount = formatBarShortAmount(item.rawAmount);
    const heightPct = peakAmount > 0 ? Math.round((item.rawAmount / maxAmount) * 100) : 0;

    let segments: SpendingStackSegment[] | undefined;
    if (stackMode !== 'none') {
      segments = [];
      for (const legend of legendItems) {
        const segAmount = item.monthGroupMap.get(legend.id) || 0;
        if (segAmount > 0 && item.rawAmount > 0) {
          segments.push({
            id: legend.id,
            label: legend.label,
            color: legend.color,
            rawAmount: segAmount,
            amount: formatLegendAmount(segAmount),
            pctOfBar: (segAmount / item.rawAmount) * 100,
          });
        }
      }
    }

    return {
      month: item.month,
      year: item.year,
      monthIndex: item.monthIndex,
      rawAmount: item.rawAmount,
      amount: formattedAmount,
      heightPct,
      ...(segments !== undefined ? { segments } : {}),
    };
  });

  return {
    barData,
    totalSpend,
    avgMonthlySpend,
    peakMonth,
    peakAmount,
    maxAmount,
    stackMode,
    legendItems,
  };
}

