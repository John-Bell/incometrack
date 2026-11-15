import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Milestone } from '@/lib/db';
import { formatMilestoneDateInput } from '@/utils/milestoneUtils';

export interface MilestoneFormData {
  name: string;
  date: string;
  amount: string;
}

function createDefaultFormData(): MilestoneFormData {
  return {
    name: '',
    date: formatMilestoneDateInput(),
    amount: '',
  };
}

export function useMilestoneForm(milestoneId?: string) {
  const navigate = useNavigate();
  const milestone = useLiveQuery(
    () => (milestoneId ? db.milestones.get(milestoneId) : undefined),
    [milestoneId]
  );

  const [formData, setFormData] = useState<MilestoneFormData>(
    createDefaultFormData
  );
  const [syncedMilestone, setSyncedMilestone] = useState<
    Milestone | undefined
  >(undefined);

  if (milestone !== syncedMilestone) {
    setSyncedMilestone(milestone);
    if (milestone) {
      setFormData({
        name: milestone.name,
        date: formatMilestoneDateInput(milestone.date),
        amount: milestone.amount.toString(),
      });
    } else if (!milestoneId) {
      setFormData(createDefaultFormData());
    }
  }

  const handleChange = <K extends keyof MilestoneFormData>(
    field: K,
    value: MilestoneFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.date) return;

    const payload = {
      name: formData.name,
      date: new Date(formData.date).getTime(),
      amount: parseFloat(formData.amount) || 0,
      updatedAt: Date.now(),
    };

    if (milestoneId) {
      await db.milestones.update(milestoneId, payload);
    } else {
      await db.milestones.add({
        id: crypto.randomUUID(),
        ...payload,
      });
    }

    navigate('/milestones');
  };

  const handleDelete = async () => {
    if (!milestoneId) return;
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      await db.milestones.delete(milestoneId);
      navigate('/milestones');
    }
  };

  return {
    milestone,
    isLoading: !!milestoneId && !milestone,
    isEditing: !!milestoneId,
    formData,
    navigate,
    handleChange,
    handleSave,
    handleDelete,
  };
}
