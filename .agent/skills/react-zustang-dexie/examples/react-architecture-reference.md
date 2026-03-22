# React Architecture Reference Patterns (Dexie/Zustand/Vitest)

#### ❌ The "Bad" Way: The Fat Component
This is an anti-pattern. It mixes database calls (Dexie), multiple floating state variables (bloat), business logic, and global state access all inside the `.tsx` file.

```tsx
// ❌ ANTI-PATTERN: DO NOT USE
import { useState, useEffect } from 'react';
import { db } from '../db';
import { useStore } from '../store';

export const TaskEditor = ({ taskId }: { taskId?: string }) => {
  // Anti-Pattern: State Bloat (Multiple floating useState hooks)
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('low');
  
  // Anti-Pattern: Non-atomic Zustand selector (causes over-rendering)
  const store = useStore(); 

  // Anti-Pattern: DB logic in the component
  useEffect(() => {
    if (taskId) {
      db.tasks.get(taskId).then(task => {
        if (task) {
          setTitle(task.title);
          setPriority(task.priority);
        }
      });
    }
  }, [taskId]);

  // Anti-Pattern: Business logic inside the component
  const isUrgent = priority === 'high' && title.includes('ASAP'); 

  const handleSave = async () => {
    if (taskId) {
      await db.tasks.update(taskId, { title, priority });
    } else {
      await db.tasks.add({ title, priority });
    }
  };

  return (
    <div className={store.theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      {isUrgent && <span className="text-red-500">URGENT</span>}
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

---

#### ✅ The "Good" Way: Strict 4-Layer Architecture

**Layer 1: Pure Logic (`taskUtils.ts`)**
Business rules are extracted so they can be tested via Vitest without React.
```typescript
// taskUtils.ts
export const checkIsUrgent = (priority: string | undefined, title: string | undefined): boolean => {
  if (!priority || !title) return false;
  return priority === 'high' && title.toUpperCase().includes('ASAP');
};

// Example Vitest test:
// expect(checkIsUrgent('high', 'Fix bug ASAP')).toBe(true);
```

**Layer 2: Global State (`useStore.ts`)**
Holds only serializable app-level state, never form keystrokes or class instances.
```typescript
// useStore.ts
import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

**Layer 3: Local Stateful Logic & Dexie CRUD (`useTaskForm.ts`)**
Handles the "Anti-Bloat" unified state, the unified Add/Edit logic, and database interactions.
```typescript
// useTaskForm.ts
import { useState, useEffect } from 'react';
import { db } from '../db';

export interface Task {
  id?: string;
  title: string;
  priority: string;
}

export const useTaskForm = (taskId?: string) => {
  // 1. Unified Form State (Anti-Bloat)
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [isLoading, setIsLoading] = useState(!!taskId);

  // 2. Fetch existing data if ID is present (DRY Add/Edit)
  useEffect(() => {
    if (!taskId) return;
    
    let isMounted = true;
    const fetchRecord = async () => {
      setIsLoading(true);
      const record = await db.tasks.get(taskId);
      if (isMounted && record) setFormData(record);
      if (isMounted) setIsLoading(false);
    };
    fetchRecord();
    
    return () => { isMounted = false; };
  }, [taskId]);

  // 3. Single Universal Change Handler
  const handleChange = (field: keyof Task, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 4. Dynamic Save Logic
  const handleSave = async () => {
    if (taskId) {
      await db.tasks.update(taskId, formData);
    } else {
      await db.tasks.add(formData as Task);
    }
  };

  return { formData, isLoading, handleChange, handleSave };
};
```

**Layer 4: Lean Component (`TaskEditor.tsx`)**
The TSX file is completely devoid of DB calls and logic. It simply wires the hook to the UI and uses atomic Zustand selectors.
```tsx
// TaskEditor.tsx
import React from 'react';
import { useTaskForm } from './useTaskForm';
import { useStore } from './useStore';
import { checkIsUrgent } from './taskUtils';

export const TaskEditor = ({ taskId }: { taskId?: string }) => {
  // Access global state via Atomic Selector
  const theme = useStore((state) => state.theme);
  
  // Access local state & Dexie CRUD
  const { formData, isLoading, handleChange, handleSave } = useTaskForm(taskId);

  // Use pure function for business logic
  const isUrgent = checkIsUrgent(formData.priority, formData.title);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className={`p-4 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      
      <input 
        type="text"
        value={formData.title || ''} 
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Task Title"
        className="border p-2 mb-2 w-full text-black"
      />
      
      <select 
        value={formData.priority || 'low'} 
        onChange={(e) => handleChange('priority', e.target.value)}
        className="border p-2 mb-2 w-full text-black"
      >
        <option value="low">Low</option>
        <option value="high">High</option>
      </select>

      {isUrgent && <div className="text-red-500 font-bold mb-2">URGENT</div>}

      <button 
        onClick={handleSave}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {taskId ? 'Update Task' : 'Create Task'}
      </button>

    </div>
  );
};
```