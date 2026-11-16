# React 4-Layer Architecture Reference

## Layer 1: Pure Logic (`src/utils/taskUtils.ts`)
Pure TypeScript functions testable in Vitest without React.

```ts
export const checkIsUrgent = (priority?: string, title?: string): boolean => {
  if (!priority || !title) return false;
  return priority === 'high' && title.toUpperCase().includes('ASAP');
};
```

## Layer 2: Global State (`src/store/useStore.ts`)
Holds app-level state only; consume with atomic selectors.

```ts
import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useStore = create<AppState>()((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

## Layer 3: Unified Form & Dexie CRUD Hook (`src/hooks/useTaskForm.ts`)
Uses `useLiveQuery` and render-phase state syncing (avoiding `setState` inside `useEffect` per React 19 / `eslint-plugin-react-hooks` v7).

```ts
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '@/lib/db';

export interface TaskFormData {
  title: string;
  priority: 'low' | 'high';
}

const defaultFormData: TaskFormData = {
  title: '',
  priority: 'low',
};

export function useTaskForm(taskId?: string) {
  const task = useLiveQuery(
    () => (taskId ? db.tasks.get(taskId) : undefined),
    [taskId]
  );

  const [formData, setFormData] = useState<TaskFormData>(defaultFormData);
  const [syncedTask, setSyncedTask] = useState<Task | undefined>(undefined);

  if (task !== syncedTask) {
    setSyncedTask(task);
    if (task) {
      setFormData({ title: task.title, priority: task.priority });
    } else if (!taskId) {
      setFormData(defaultFormData);
    }
  }

  const handleChange = <K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title) return;
    if (taskId) {
      await db.tasks.update(taskId, formData);
    } else {
      await db.tasks.add({ id: crypto.randomUUID(), ...formData });
    }
  };

  return {
    formData,
    isEditing: !!taskId,
    handleChange,
    handleSave,
  };
}
```

## Layer 4: Lean Component (`src/components/TaskEditor.tsx`)
Wires hooks and atomic selectors to JSX without database or domain logic.

```tsx
import { useTaskForm } from '@/hooks/useTaskForm';
import { useStore } from '@/store/useStore';
import { checkIsUrgent } from '@/utils/taskUtils';

export const TaskEditor = ({ taskId }: { taskId?: string }) => {
  const theme = useStore((state) => state.theme);
  const { formData, isEditing, handleChange, handleSave } = useTaskForm(taskId);
  const isUrgent = checkIsUrgent(formData.priority, formData.title);

  return (
    <div className={theme === 'dark' ? 'bg-slate-900 text-white p-4' : 'bg-white text-slate-900 p-4'}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Task Title"
        className="border p-2 mb-2 w-full"
      />
      <select
        value={formData.priority}
        onChange={(e) => handleChange('priority', e.target.value as 'low' | 'high')}
        className="border p-2 mb-2 w-full"
      >
        <option value="low">Low</option>
        <option value="high">High</option>
      </select>

      {isUrgent && <div className="text-red-500 font-bold mb-2">URGENT</div>}

      <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded">
        {isEditing ? 'Update Task' : 'Create Task'}
      </button>
    </div>
  );
};
```
