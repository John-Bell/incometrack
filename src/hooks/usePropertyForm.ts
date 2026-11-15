import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Property } from '@/lib/db';

export interface PropertyFormData {
  name: string;
  expectedMonthlyIncome?: number;
  annualGrowthRate?: number;
  estimatedNetCashOnSale?: number;
  estimatedSaleDate?: string;
}

const defaultFormData: PropertyFormData = {
  name: '',
};

export function usePropertyForm(id?: string) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PropertyFormData>(defaultFormData);
  const [syncedProperty, setSyncedProperty] = useState<Property | undefined>(
    undefined
  );

  const property = useLiveQuery(
    async () => (id ? await db.properties.get(id) : undefined),
    [id]
  );

  if (property !== syncedProperty) {
    setSyncedProperty(property);
    if (property) {
      setFormData({
        name: property.name,
        expectedMonthlyIncome: property.expectedMonthlyIncome,
        annualGrowthRate: property.annualGrowthRate,
        estimatedNetCashOnSale: property.estimatedNetCashOnSale,
        estimatedSaleDate: property.estimatedSaleDate
          ? new Date(property.estimatedSaleDate).toISOString().split('T')[0]
          : undefined,
      });
    } else if (!id) {
      setFormData(defaultFormData);
    }
  }

  const handleChange = <K extends keyof PropertyFormData>(
    field: K,
    value: PropertyFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePropertySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name) return;

    const propertyData = {
      name: formData.name,
      expectedMonthlyIncome: formData.expectedMonthlyIncome
        ? Number(formData.expectedMonthlyIncome)
        : undefined,
      annualGrowthRate: formData.annualGrowthRate
        ? Number(formData.annualGrowthRate)
        : undefined,
      estimatedNetCashOnSale: formData.estimatedNetCashOnSale
        ? Number(formData.estimatedNetCashOnSale)
        : undefined,
      estimatedSaleDate: formData.estimatedSaleDate
        ? new Date(formData.estimatedSaleDate).getTime()
        : undefined,
      updatedAt: Date.now(),
    };

    if (id) {
      await db.properties.update(id, propertyData);
    } else {
      await db.properties.add({
        ...propertyData,
        id: crypto.randomUUID(),
      });
    }
    navigate('/properties');
  };

  const deleteProperty = async () => {
    if (!id) return;
    await db.properties.delete(id);
    const expenses = await db.propertyExpenses
      .where('propertyId')
      .equals(id)
      .toArray();
    await db.propertyExpenses.bulkDelete(expenses.map((e) => e.id));
    const incomes = await db.propertyIncomes
      .where('propertyId')
      .equals(id)
      .toArray();
    await db.propertyIncomes.bulkDelete(incomes.map((i) => i.id));
    const ownerships = await db.propertyOwnership
      .where('propertyId')
      .equals(id)
      .toArray();
    await db.propertyOwnership.bulkDelete(ownerships.map((o) => o.id));
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this property? All associated expenses will also be deleted. This action cannot be undone.'
      )
    ) {
      await deleteProperty();
      navigate('/properties');
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit: handlePropertySubmit,
    deleteProperty,
    handleDelete,
    navigate,
    isEditing: !!id,
    property,
  };
}
