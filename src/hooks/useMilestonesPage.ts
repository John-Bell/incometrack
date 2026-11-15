import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { sortMilestonesByDate } from '@/utils/milestoneUtils';

export function useMilestonesPage() {
  const navigate = useNavigate();
  const rawMilestones = useLiveQuery(() => db.milestones.toArray(), []) || [];
  const milestones = sortMilestonesByDate(rawMilestones);

  return {
    navigate,
    milestones,
  };
}
