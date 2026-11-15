import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction } from '@/lib/db';
import {
  filterCurrentAccounts,
  getAvailableBudgets,
  getPostSaveTransactionRedirectUrl,
  findSuggestedBudgetIdsForPayee,
  resolveBudgetIdForAccount,
} from '@/utils/transactionUtils';

export interface PaymentFormData {
  payee: string;
  amount: string;
  budgetId: string;
  accountId: string;
  type: 'income' | 'expense';
  date: string;
}

function createDefaultFormData(
  accountId: string = '',
  budgetId: string = ''
): PaymentFormData {
  return {
    payee: '',
    amount: '',
    budgetId,
    accountId,
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
  };
}

export function usePaymentForm(transactionId?: string) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlAccountId = searchParams.get('accountId') || '';
  const urlBudgetId = searchParams.get('budgetId') || '';
  const from = searchParams.get('from') || '';

  const transaction = useLiveQuery(
    () => (transactionId ? db.transactions.get(transactionId) : undefined),
    [transactionId]
  );
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const paymentMappings = useLiveQuery(() => db.paymentMappings.toArray()) || [];

  const [formData, setFormData] = useState<PaymentFormData>(() =>
    createDefaultFormData(urlAccountId, urlBudgetId)
  );
  const [suggestedBudgetIds, setSuggestedBudgetIds] = useState<string[]>([]);
  const [syncedTransaction, setSyncedTransaction] = useState<
    Transaction | undefined
  >(undefined);

  if (transaction !== syncedTransaction) {
    setSyncedTransaction(transaction);
    if (transaction) {
      setFormData({
        payee: transaction.payee,
        amount: transaction.amount.toString(),
        budgetId: transaction.budgetId || '',
        accountId: transaction.accountId || '',
        type: transaction.type,
        date: new Date(transaction.date).toISOString().split('T')[0],
      });
    } else if (!transactionId) {
      setFormData(createDefaultFormData(urlAccountId, urlBudgetId));
    }
  }

  const currentAccounts = filterCurrentAccounts(accounts);
  const availableBudgets = formData.accountId
    ? getAvailableBudgets(budgets, formData.accountId)
    : [];

  const handleChange = <K extends keyof PaymentFormData>(
    field: K,
    value: PaymentFormData[K]
  ) => {
    setFormData((prev) => {
      if (field === 'accountId') {
        const nextAccountId = value as string;
        return {
          ...prev,
          accountId: nextAccountId,
          budgetId: resolveBudgetIdForAccount(
            prev.budgetId,
            nextAccountId,
            budgets
          ),
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handlePayeeChange = (val: string) => {
    const matchedIds = findSuggestedBudgetIdsForPayee(val, paymentMappings);
    setSuggestedBudgetIds(matchedIds);

    setFormData((prev) => {
      const next = { ...prev, payee: val };
      if (matchedIds.length > 0 && !prev.budgetId) {
        const firstBudget = budgets.find((b) => b.id === matchedIds[0]);
        if (firstBudget) {
          next.budgetId = firstBudget.id;
          if (firstBudget.accountId) {
            next.accountId = firstBudget.accountId;
          }
        }
      }
      return next;
    });
  };

  const applySuggestion = (suggestedId: string) => {
    const budget = budgets.find((b) => b.id === suggestedId);
    if (budget) {
      setFormData((prev) => ({
        ...prev,
        budgetId: budget.id,
        accountId: budget.accountId || prev.accountId,
      }));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.accountId) return;

    const payload = {
      date: new Date(formData.date).getTime(),
      payee: formData.payee,
      amount: parseFloat(formData.amount) || 0,
      type: formData.type,
      icon: formData.type === 'expense' ? 'shopping_cart' : 'payments',
      budgetId: formData.budgetId || undefined,
      accountId: formData.accountId,
    };

    if (transactionId) {
      await db.transactions.update(transactionId, payload);
    } else {
      await db.transactions.add({
        id: crypto.randomUUID(),
        ...payload,
      });
    }

    navigate(getPostSaveTransactionRedirectUrl(from, urlAccountId));
  };

  const handleDelete = async () => {
    if (!transactionId) return;
    if (window.confirm('Are you sure you want to delete this payment?')) {
      await db.transactions.delete(transactionId);
      navigate(getPostSaveTransactionRedirectUrl(from, urlAccountId));
    }
  };

  return {
    transaction,
    budgets,
    currentAccounts,
    availableBudgets,
    formData,
    suggestedBudgetIds,
    isEditing: !!transactionId,
    navigate,
    handleChange,
    handlePayeeChange,
    applySuggestion,
    handleSave,
    handleDelete,
  };
}
