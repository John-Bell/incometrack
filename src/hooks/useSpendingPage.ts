import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getTargetMonths } from '@/utils/budgetUtils';
import { calculateSpendingGraphData } from '@/utils/spendingUtils';

export function useSpendingPage() {
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

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ytd');

  // Filter budgets based on the selected account scope
  const scopedBudgets = selectedAccountId
    ? budgets.filter((b) => b.accountId === selectedAccountId)
    : budgets;

  const handleAccountChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    if (selectedBudgetId) {
      const budget = budgets.find((b) => b.id === selectedBudgetId);
      if (budget && newAccountId && budget.accountId !== newAccountId) {
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

  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const targetMonths = getTargetMonths(selectedTimeframe, hasAnnualBudget);

  const spendingData = calculateSpendingGraphData(
    targetMonths,
    transactions,
    selectedAccountId,
    selectedBudgetId,
    scopedBudgets
  );

  return {
    namesLabel,
    currentAccounts,
    selectedAccountId,
    setSelectedAccountId,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedTimeframe,
    setSelectedTimeframe,
    scopedBudgets,
    availableTimeframes,
    hasAnnualBudget,
    selectedBudget,
    selectedAccount,
    targetMonths,
    spendingData,
    handleAccountChange,
  };
}
