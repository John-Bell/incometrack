import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PropertyIncome } from '@/lib/db';
import { buildPropertyListRedirectUrl } from '@/utils/propertyCalculations';

export interface PropertyIncomeFormData {
  propertyId: string;
  date: string;
  description: string;
  amount: string;
}

function createDefaultFormData(propertyId: string = ''): PropertyIncomeFormData {
  return {
    propertyId,
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
  };
}

export function usePropertyIncomeForm(id?: string) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPropertyId = searchParams.get('propertyId');
  const initialPropertyId =
    queryPropertyId && queryPropertyId !== 'all' ? queryPropertyId : '';
  const returnUrl = buildPropertyListRedirectUrl(
    '/property-incomes',
    queryPropertyId
  );

  const [formData, setFormData] = useState<PropertyIncomeFormData>(() =>
    createDefaultFormData(initialPropertyId)
  );
  const [syncedIncome, setSyncedIncome] = useState<PropertyIncome | undefined>(
    undefined
  );

  const income = useLiveQuery(
    async () => (id ? await db.propertyIncomes.get(id) : undefined),
    [id]
  );
  const properties = useLiveQuery(() => db.properties.toArray(), []) || [];

  if (income !== syncedIncome) {
    setSyncedIncome(income);
    if (income) {
      setFormData({
        propertyId: income.propertyId,
        date: new Date(income.date).toISOString().split('T')[0],
        description: income.description || '',
        amount: income.amount.toString(),
      });
    } else if (!id) {
      setFormData(createDefaultFormData(initialPropertyId));
    }
  }

  const handleChange = <K extends keyof PropertyIncomeFormData>(
    field: K,
    value: PropertyIncomeFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleIncomeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.propertyId || !formData.date || !formData.amount) return;

    const incomeData = {
      propertyId: formData.propertyId,
      date: new Date(formData.date).getTime(),
      description: formData.description,
      amount: Number(formData.amount),
      updatedAt: Date.now(),
    };

    if (id) {
      await db.propertyIncomes.update(id, incomeData);
    } else {
      await db.propertyIncomes.add({
        ...incomeData,
        id: crypto.randomUUID(),
      });
    }
    navigate(returnUrl);
  };

  const deleteIncome = async () => {
    if (id) {
      await db.propertyIncomes.delete(id);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      await deleteIncome();
      navigate(returnUrl);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit: handleIncomeSubmit,
    deleteIncome,
    handleDelete,
    navigate,
    returnUrl,
    properties,
    isEditing: !!id,
    income,
  };
}
