import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  filterAndSortBudgets,
  getBudgetAccounts,
  calculateBudgetItemDetails,
} from '@/utils/budgetUtils';

export function useBudgetsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

  const sortedBudgets = filterAndSortBudgets(budgets, selectedAccountId);
  const budgetAccounts = getBudgetAccounts(accounts);

  const budgetItems = sortedBudgets.map((budget) => ({
    budget,
    details: calculateBudgetItemDetails(budget, transactions),
  }));

  return {
    selectedAccountId,
    setSelectedAccountId,
    budgets,
    sortedBudgets,
    budgetAccounts,
    budgetItems,
  };
}
