import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PropertyOwnership } from '@/lib/db';
import { useStore } from '@/store/useStore';
import {
  buildPropertyListRedirectUrl,
  calculateComplementaryOwnershipSplit,
} from '@/utils/propertyCalculations';

export interface PropertyOwnershipFormData {
  propertyId: string;
  startDate: string;
  person1Percent: string;
  person2Percent: string;
}

function createDefaultFormData(
  propertyId: string = ''
): PropertyOwnershipFormData {
  return {
    propertyId,
    startDate: new Date().toISOString().split('T')[0],
    person1Percent: '50',
    person2Percent: '50',
  };
}

export function usePropertyOwnershipForm(id?: string) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPropertyId = searchParams.get('propertyId');
  const initialPropertyId =
    queryPropertyId && queryPropertyId !== 'all' ? queryPropertyId : '';
  const returnUrl = buildPropertyListRedirectUrl(
    '/property-ownerships',
    queryPropertyId
  );

  const profile = useStore((state) => state.profile);
  const person1Name = profile?.partner1Name || 'Person 1';
  const person2Name = profile?.partner2Name || 'Person 2';

  const [formData, setFormData] = useState<PropertyOwnershipFormData>(() =>
    createDefaultFormData(initialPropertyId)
  );
  const [syncedOwnership, setSyncedOwnership] = useState<
    PropertyOwnership | undefined
  >(undefined);

  const ownership = useLiveQuery(
    async () => (id ? await db.propertyOwnership.get(id) : undefined),
    [id]
  );
  const properties = useLiveQuery(() => db.properties.toArray(), []) || [];

  if (ownership !== syncedOwnership) {
    setSyncedOwnership(ownership);
    if (ownership) {
      setFormData({
        propertyId: ownership.propertyId,
        startDate: new Date(ownership.startDate).toISOString().split('T')[0],
        person1Percent: ownership.person1Percent.toString(),
        person2Percent: ownership.person2Percent.toString(),
      });
    } else if (!id) {
      setFormData(createDefaultFormData(initialPropertyId));
    }
  }

  const handleChange = <K extends keyof PropertyOwnershipFormData>(
    field: K,
    value: PropertyOwnershipFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePerson1Change = (val: string) => {
    const split = calculateComplementaryOwnershipSplit(val);
    if (split) {
      setFormData((prev) => ({ ...prev, ...split }));
    }
  };

  const handleOwnershipSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !formData.propertyId ||
      !formData.startDate ||
      formData.person1Percent === '' ||
      formData.person2Percent === ''
    ) {
      return;
    }

    const ownershipData = {
      propertyId: formData.propertyId,
      startDate: new Date(formData.startDate).getTime(),
      person1Percent: Number(formData.person1Percent),
      person2Percent: Number(formData.person2Percent),
      updatedAt: Date.now(),
    };

    if (id) {
      await db.propertyOwnership.update(id, ownershipData);
    } else {
      await db.propertyOwnership.add({
        ...ownershipData,
        id: crypto.randomUUID(),
      });
    }
    navigate(returnUrl);
  };

  const deleteOwnership = async () => {
    if (id) {
      await db.propertyOwnership.delete(id);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm('Are you sure you want to delete this ownership record?')
    ) {
      await deleteOwnership();
      navigate(returnUrl);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handlePerson1Change,
    handleSubmit: handleOwnershipSubmit,
    deleteOwnership,
    handleDelete,
    navigate,
    returnUrl,
    properties,
    person1Name,
    person2Name,
    isEditing: !!id,
    ownership,
  };
}
