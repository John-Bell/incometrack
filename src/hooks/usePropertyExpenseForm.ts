import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PropertyExpense } from '@/lib/db';
import { buildPropertyListRedirectUrl } from '@/utils/propertyCalculations';

export interface PropertyExpenseFormData {
  propertyId: string;
  date: string;
  payee: string;
  description: string;
  amount: string;
}

function createDefaultFormData(
  propertyId: string = ''
): PropertyExpenseFormData {
  return {
    propertyId,
    date: new Date().toISOString().split('T')[0],
    payee: '',
    description: '',
    amount: '',
  };
}

export function usePropertyExpenseForm(id?: string) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPropertyId = searchParams.get('propertyId');
  const initialPropertyId =
    queryPropertyId && queryPropertyId !== 'all' ? queryPropertyId : '';
  const returnUrl = buildPropertyListRedirectUrl(
    '/property-expenses',
    queryPropertyId
  );

  const [formData, setFormData] = useState<PropertyExpenseFormData>(() =>
    createDefaultFormData(initialPropertyId)
  );
  const [syncedExpense, setSyncedExpense] = useState<
    PropertyExpense | undefined
  >(undefined);

  const expense = useLiveQuery(
    async () => (id ? await db.propertyExpenses.get(id) : undefined),
    [id]
  );
  const properties = useLiveQuery(() => db.properties.toArray(), []) || [];

  if (expense !== syncedExpense) {
    setSyncedExpense(expense);
    if (expense) {
      setFormData({
        propertyId: expense.propertyId,
        date: new Date(expense.date).toISOString().split('T')[0],
        payee: expense.payee,
        description: expense.description || '',
        amount: expense.amount.toString(),
      });
    } else if (!id) {
      setFormData(createDefaultFormData(initialPropertyId));
    }
  }

  const handleChange = <K extends keyof PropertyExpenseFormData>(
    field: K,
    value: PropertyExpenseFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExpenseSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !formData.propertyId ||
      !formData.date ||
      !formData.payee ||
      !formData.amount
    ) {
      return;
    }

    const expenseData = {
      propertyId: formData.propertyId,
      date: new Date(formData.date).getTime(),
      payee: formData.payee,
      description: formData.description,
      amount: Number(formData.amount),
      updatedAt: Date.now(),
    };

    if (id) {
      await db.propertyExpenses.update(id, expenseData);
    } else {
      await db.propertyExpenses.add({
        ...expenseData,
        id: crypto.randomUUID(),
      });
    }
    navigate(returnUrl);
  };

  const deleteExpense = async () => {
    if (id) {
      await db.propertyExpenses.delete(id);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense();
      navigate(returnUrl);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit: handleExpenseSubmit,
    deleteExpense,
    handleDelete,
    navigate,
    returnUrl,
    properties,
    isEditing: !!id,
    expense,
  };
}
