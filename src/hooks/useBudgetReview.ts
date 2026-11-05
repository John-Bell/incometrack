import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  getTargetMonths,
  calculateGraphData,
  calculateBudgetAlerts,
  calculateCategoryTuningItems,
  getAvailableBudgetYears,
  filterBudgetsByYear,
} from '@/utils/budgetUtils';

export function useBudgetReview() {
  const { profile } = useStore();
  const p1Name = profile?.partner1Name || 'Dan';
  const p2Name = profile?.partner2Name || 'Freya';
  const namesLabel = `${p1Name} & ${p2Name}`;

  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const currentAccounts = accounts
    .filter((account) => account.category === 'Current Account')
    .sort((a, b) => a.name.localeCompare(b.name));

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ytd');

  const availableYears = getAvailableBudgetYears(budgets, transactions, new Date().getFullYear());

  // Filter budgets based on the selected year
  const yearBudgets = filterBudgetsByYear(budgets, selectedYear);

  // Filter budgets based on the selected account scope
  const scopedBudgets = selectedAccountId
    ? yearBudgets.filter((b) => b.accountId === selectedAccountId)
    : yearBudgets;

  // If a budget was selected that is no longer in scope for the active year/account, clear it
  const activeSelectedBudgetId = scopedBudgets.some((b) => b.id === selectedBudgetId)
    ? selectedBudgetId
    : '';

  // Filter budgets based on account scope AND selected budget filter
  const filteredBudgets = activeSelectedBudgetId
    ? scopedBudgets.filter((b) => b.id === activeSelectedBudgetId)
    : scopedBudgets;

  const sortedBudgets = [...filteredBudgets].sort((a, b) => a.name.localeCompare(b.name));

  const handleAccountChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    if (selectedBudgetId) {
      const budget = yearBudgets.find((b) => b.id === selectedBudgetId);
      if (budget && newAccountId && budget.accountId !== newAccountId) {
        setSelectedBudgetId('');
      }
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (selectedBudgetId) {
      const remainingBudgets = filterBudgetsByYear(budgets, year);
      const isBudgetStillValid = remainingBudgets.some((b) => {
        if (b.id !== selectedBudgetId) return false;
        if (selectedAccountId && b.accountId !== selectedAccountId) return false;
        return true;
      });
      if (!isBudgetStillValid) {
        setSelectedBudgetId('');
      }
    }
  };

  const hasAnnualBudget = scopedBudgets.some((b) => b.frequency === 'annual');

  const availableTimeframes = hasAnnualBudget
    ? [{ id: 'ytd', label: 'YTD' }]
    : [
        { id: '3m', label: 'Last 3 Months' },
        { id: '6m', label: 'Last 6 Months' },
        { id: '9m', label: 'Last 9 Months' },
        { id: 'ytd', label: 'YTD' },
      ];

  const selectedBudget = yearBudgets.find((b) => b.id === activeSelectedBudgetId);

  const isMonthlyBudgetSelected = Boolean(
    selectedBudget &&
      (selectedBudget.frequency === 'monthly' || selectedBudget.frequency === 'month')
  );

  const targetMonths = getTargetMonths(selectedTimeframe, hasAnnualBudget, new Date(), selectedYear);

  // Filter transactions to only those matching the selected year
  const yearTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    return new Date(t.date).getFullYear() === selectedYear;
  });

  const graphData = calculateGraphData(
    isMonthlyBudgetSelected,
    selectedBudget,
    targetMonths,
    yearTransactions
  );

  const { overspendAlerts, slackAlerts } = calculateBudgetAlerts(
    targetMonths,
    scopedBudgets,
    yearTransactions,
    selectedAccountId
  );

  const categoryTuningItems = calculateCategoryTuningItems(
    sortedBudgets,
    targetMonths,
    yearTransactions
  );

  return {
    namesLabel,
    currentAccounts,
    selectedYear,
    setSelectedYear,
    handleYearChange,
    availableYears,
    selectedAccountId,
    setSelectedAccountId,
    selectedBudgetId: activeSelectedBudgetId,
    setSelectedBudgetId,
    selectedTimeframe,
    setSelectedTimeframe,
    scopedBudgets,
    availableTimeframes,
    hasAnnualBudget,
    selectedBudget,
    isMonthlyBudgetSelected,
    graphData,
    overspendAlerts,
    slackAlerts,
    categoryTuningItems,
    handleAccountChange,
  };
}
