import type { Budget, Transaction } from '@/lib/db';
import type { TargetMonth } from './budgetUtils';

export interface SpendingBarItem {
  month: string;
  year: number;
  monthIndex: number;
  rawAmount: number;
  amount: string;
  heightPct: number;
}

export interface SpendingGraphDataResult {
  barData: SpendingBarItem[];
  totalSpend: number;
  avgMonthlySpend: number;
  peakMonth: string;
  peakAmount: number;
  maxAmount: number;
}

export function calculateSpendingGraphData(
  targetMonths: TargetMonth[],
  transactions: Transaction[],
  selectedAccountId?: string,
  selectedBudgetId?: string,
  scopedBudgets?: Budget[]
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

  let totalSpend = 0;
  let peakAmount = 0;
  let peakMonth = targetMonths[0]?.label || 'N/A';

  const monthlyTotals = targetMonths.map(({ year, monthIndex, label }) => {
    const monthSpent = eligibleTransactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === monthIndex;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

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
    };
  });

  const maxAmount = peakAmount > 0 ? peakAmount : 1;
  const activeMonthsCount = targetMonths.length;
  const avgMonthlySpend = activeMonthsCount > 0 ? totalSpend / activeMonthsCount : 0;

  const barData: SpendingBarItem[] = monthlyTotals.map((item) => {
    const formattedAmount =
      item.rawAmount >= 1000
        ? `£${(item.rawAmount / 1000).toFixed(2)}k`
        : `£${Math.round(item.rawAmount)}`;

    const heightPct = peakAmount > 0 ? Math.round((item.rawAmount / maxAmount) * 100) : 0;

    return {
      month: item.month,
      year: item.year,
      monthIndex: item.monthIndex,
      rawAmount: item.rawAmount,
      amount: formattedAmount,
      heightPct,
    };
  });

  return {
    barData,
    totalSpend,
    avgMonthlySpend,
    peakMonth,
    peakAmount,
    maxAmount,
  };
}
