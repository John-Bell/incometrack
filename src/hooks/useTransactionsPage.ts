import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  filterCurrentAccounts,
  getAvailableBudgets,
  filterTransactions,
  createBudgetsMap,
  groupTransactionsByDate,
  getUpdatedSearchParamsOnAccountChange,
  getUpdatedSearchParamsOnBudgetChange,
  buildTransactionUrl,
} from '@/utils/transactionUtils';

export function useTransactionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAccountId = searchParams.get('accountId') || '';
  const selectedBudgetId = searchParams.get('budgetId') || '';

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allTransactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];

  const currentAccounts = filterCurrentAccounts(accounts);
  const availableBudgets = getAvailableBudgets(budgets, selectedAccountId);
  const budgetsMap = createBudgetsMap(budgets);
  const transactions = filterTransactions(
    allTransactions,
    selectedAccountId,
    selectedBudgetId,
    startDate,
    endDate,
    searchQuery,
    budgetsMap
  );
  const groupedTransactions = groupTransactionsByDate(transactions);

  const handleAccountChange = (newAccountId: string) => {
    const updatedParams = getUpdatedSearchParamsOnAccountChange(newAccountId, selectedBudgetId, budgets);
    setSearchParams(updatedParams);
  };

  const handleBudgetChange = (newBudgetId: string) => {
    const updatedParams = getUpdatedSearchParamsOnBudgetChange(newBudgetId, selectedAccountId);
    setSearchParams(updatedParams);
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const handleAddPayment = () => {
    const url = buildTransactionUrl('/transactions/add', selectedAccountId, selectedBudgetId);
    navigate(url);
  };

  const getEditUrl = (txId: string) => {
    return buildTransactionUrl(`/transactions/edit/${txId}`, selectedAccountId, selectedBudgetId);
  };

  return {
    selectedAccountId,
    selectedBudgetId,
    startDate,
    endDate,
    searchQuery,
    currentAccounts,
    availableBudgets,
    groupedTransactions,
    budgetsMap,
    handleAccountChange,
    handleBudgetChange,
    handleStartDateChange,
    handleEndDateChange,
    handleSearchQueryChange,
    handleClearFilters,
    handleAddPayment,
    getEditUrl,
  };
}
