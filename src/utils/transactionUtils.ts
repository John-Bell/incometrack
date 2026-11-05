import type { Account, Budget, Transaction } from '@/lib/db';

/**
 * Filters accounts to Current Accounts and sorts them alphabetically by name.
 */
export function filterCurrentAccounts(accounts: Account[]): Account[] {
  return accounts
    .filter((account) => account.category === 'Current Account')
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filters budgets by selected account ID (if specified) and sorts them alphabetically by name.
 */
export function getAvailableBudgets(budgets: Budget[], selectedAccountId: string): Budget[] {
  const available = selectedAccountId
    ? budgets.filter((b) => b.accountId === selectedAccountId)
    : budgets;
  return [...available].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filters transactions based on selected account ID, budget ID, date timeframe, and text search query.
 * Start and end dates are strings in 'YYYY-MM-DD' format (or empty string if not filtered).
 * Dates are inclusive for the entire start day (from 00:00:00) through end day (to 23:59:59.999).
 */
export function filterTransactions(
  transactions: Transaction[],
  selectedAccountId: string,
  selectedBudgetId: string,
  startDate: string = '',
  endDate: string = '',
  searchQuery: string = '',
  budgetsMap: Record<string, Budget> = {}
): Transaction[] {
  let startTs: number | null = null;
  if (startDate) {
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    if (!isNaN(sYear) && !isNaN(sMonth) && !isNaN(sDay)) {
      startTs = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0).getTime();
    }
  }

  let endTs: number | null = null;
  if (endDate) {
    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
    if (!isNaN(eYear) && !isNaN(eMonth) && !isNaN(eDay)) {
      endTs = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999).getTime();
    }
  }

  const query = searchQuery.trim().toLowerCase();

  return transactions.filter((tx) => {
    const matchesAccount = !selectedAccountId || tx.accountId === selectedAccountId;
    if (!matchesAccount) return false;

    const matchesBudget = !selectedBudgetId || tx.budgetId === selectedBudgetId;
    if (!matchesBudget) return false;

    const txDate = typeof tx.date === 'string' ? new Date(tx.date).getTime() : tx.date;

    if (startTs !== null && txDate < startTs) {
      return false;
    }

    if (endTs !== null && txDate > endTs) {
      return false;
    }

    if (query) {
      const payeeMatch = tx.payee.toLowerCase().includes(query);
      const budgetName = tx.budgetId ? budgetsMap[tx.budgetId]?.name : '';
      const budgetMatch = budgetName ? budgetName.toLowerCase().includes(query) : false;
      const uncategorizedMatch = !tx.budgetId && 'uncategorized'.includes(query);

      if (!payeeMatch && !budgetMatch && !uncategorizedMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Creates a map of budget ID to Budget object.
 */
export function createBudgetsMap(budgets: Budget[]): Record<string, Budget> {
  return Object.fromEntries(budgets.map((b) => [b.id, b]));
}

/**
 * Groups transactions by date ('Today', 'Yesterday', or formatted date e.g. '12 Oct 2025').
 */
export function groupTransactionsByDate(
  transactions: Transaction[],
  now: Date = new Date()
): Record<string, Transaction[]> {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  return transactions.reduce((groups: Record<string, Transaction[]>, transaction) => {
    const txDate = new Date(transaction.date);
    const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());

    let groupKey = '';
    if (txDay.getTime() === today.getTime()) {
      groupKey = 'Today';
    } else if (txDay.getTime() === yesterday.getTime()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(txDate);
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(transaction);
    return groups;
  }, {});
}

/**
 * Formats amount into GBP currency with optional sign prefix (+ or -).
 */
export function formatTransactionAmount(amount: number, type?: 'expense' | 'income' | string): string {
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);

  const prefix = type === 'expense' ? '-' : '+';
  return `${prefix}${formatted}`;
}

/**
 * Determines updated search params when selected account is changed.
 * Preserves budgetId if the selected budget belongs to the new account scope.
 */
export function getUpdatedSearchParamsOnAccountChange(
  newAccountId: string,
  selectedBudgetId: string,
  budgets: Budget[]
): Record<string, string> {
  const params: Record<string, string> = {};
  if (newAccountId) {
    params.accountId = newAccountId;
  }

  if (selectedBudgetId) {
    const budget = budgets.find((b) => b.id === selectedBudgetId);
    if (budget && (!newAccountId || budget.accountId === newAccountId)) {
      params.budgetId = selectedBudgetId;
    }
  }

  return params;
}

/**
 * Determines updated search params when selected budget is changed.
 */
export function getUpdatedSearchParamsOnBudgetChange(
  newBudgetId: string,
  selectedAccountId: string
): Record<string, string> {
  const params: Record<string, string> = {};
  if (selectedAccountId) {
    params.accountId = selectedAccountId;
  }
  if (newBudgetId) {
    params.budgetId = newBudgetId;
  }
  return params;
}

/**
 * Constructs a URL with accountId and budgetId query parameters if present.
 */
export function buildTransactionUrl(
  path: string,
  selectedAccountId: string,
  selectedBudgetId: string
): string {
  const params = new URLSearchParams();
  if (selectedAccountId) {
    params.set('accountId', selectedAccountId);
  }
  if (selectedBudgetId) {
    params.set('budgetId', selectedBudgetId);
  }
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}
