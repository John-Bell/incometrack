import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Budget } from '@/lib/db';
import {
  getBudgetAccounts,
  parseBudgetStartDate,
  formatBudgetStartDateInput,
  calculateAnnualisedBudgetAmount,
} from '@/utils/budgetUtils';

export interface BudgetFormData {
  name: string;
  amount: string;
  frequency: string;
  accountId: string;
  icon: string;
  budgetStartDate: string;
  oneOffBudget: boolean;
}

const defaultFormData: BudgetFormData = {
  name: '',
  amount: '',
  frequency: 'monthly',
  accountId: '',
  icon: 'category',
  budgetStartDate: '2026-04-01',
  oneOffBudget: false,
};

export function useBudgetForm(budgetId?: string) {
  const navigate = useNavigate();
  const budget = useLiveQuery(
    () => (budgetId ? db.budgets.get(budgetId) : undefined),
    [budgetId]
  );
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const budgetAccounts = getBudgetAccounts(accounts);

  const [formData, setFormData] = useState<BudgetFormData>(defaultFormData);
  const [syncedBudget, setSyncedBudget] = useState<Budget | undefined>(
    undefined
  );

  if (budget !== syncedBudget) {
    setSyncedBudget(budget);
    if (budget) {
      setFormData({
        name: budget.name,
        amount: budget.amount.toString(),
        frequency: budget.frequency,
        accountId: budget.accountId || '',
        icon: budget.icon || 'category',
        budgetStartDate: formatBudgetStartDateInput(budget.budgetStartDate),
        oneOffBudget: budget.oneOffBudget ?? false,
      });
    } else if (!budgetId) {
      setFormData(defaultFormData);
    }
  }

  const handleChange = <K extends keyof BudgetFormData>(
    field: K,
    value: BudgetFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculatedAnnual = calculateAnnualisedBudgetAmount(
    formData.amount,
    formData.frequency
  );

  const handleSave = async () => {
    if (!formData.name || !formData.amount || !formData.accountId) return;

    const payload = {
      name: formData.name,
      amount: parseFloat(formData.amount) || 0,
      frequency: formData.frequency,
      accountId: formData.accountId,
      icon: formData.icon !== 'category' ? formData.icon : undefined,
      budgetStartDate: parseBudgetStartDate(formData.budgetStartDate),
      oneOffBudget: formData.oneOffBudget,
    };

    if (budgetId) {
      await db.budgets.update(budgetId, payload);
    } else {
      await db.budgets.add({
        id: crypto.randomUUID(),
        ...payload,
      });
    }
    navigate('/budgets');
  };

  const handleDelete = async () => {
    if (!budgetId) return;

    const transactionCount = await db.transactions
      .where('budgetId')
      .equals(budgetId)
      .count();
    if (transactionCount > 0) {
      alert('Cannot delete budget item as it has associated payments.');
      return;
    }

    await db.budgets.delete(budgetId);
    navigate('/budgets');
  };

  return {
    budget,
    budgetAccounts,
    formData,
    handleChange,
    calculatedAnnual,
    isEditing: !!budgetId,
    navigate,
    handleSave,
    handleDelete,
  };
}
