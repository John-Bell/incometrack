---
name: react-zustand-dexie
description: >-
  Enforces 4-layer separation of concerns (utils/services, Zustand store, custom hooks, lean TSX components),
  atomic Zustand selectors, unified local form state, and shared Add/Edit Dexie CRUD hooks.
  Use when creating, refactoring, or modifying React components, hooks, forms, or state in this repository.
---

# React Architecture (Dexie / Zustand / Vitest)

## 1. 4-Layer Separation of Concerns
Split every feature across four distinct layers—keep `.tsx` components free of database calls and business calculations:

1. **Pure Logic (`src/utils/*.ts`, `src/services/*.ts`)**: Framework-agnostic business rules, calculations, validation, and formatting. Must be directly unit-testable in Vitest without mounting React.
2. **Global State (`src/store/*.ts`)**: App-wide state (e.g., active profile, tax rules, hydration, sync status) in Zustand. Consume via atomic selectors (`useStore(s => s.taxYear)`), never by subscribing to the entire store object.
3. **Stateful Logic & Data Access (`src/hooks/*.ts`)**: Component state, `useLiveQuery` subscriptions (`dexie-react-hooks`), side effects, and Dexie CRUD operations.
4. **Lean Components (`src/pages/*.tsx`, `src/components/**/*.tsx`)**: Wire custom hooks and atomic Zustand selectors to JSX/Tailwind. No direct `db.*` calls or inline domain logic.

## 2. Form State & CRUD Hooks
- **Local Unified Form State**: Keep ephemeral form input state out of Zustand. Use a single typed state object (`const [formData, setFormData] = useState<FormData>(defaultFormData)`) rather than separate `useState` calls per field.
- **Typed Generic Change Handler**: Use a single type-safe updater instead of `any`:
  ```ts
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  ```
- **Unified Add/Edit Hook**: Combine create and update workflows in one hook (`use[Feature]Form(id?)`). Query existing records with `useLiveQuery(() => (id ? db.table.get(id) : undefined), [id])`, sync into `formData` when the loaded record changes, and branch between `db.table.update(id, payload)` and `db.table.add({ id: crypto.randomUUID(), ...payload })` inside `handleSave`.

## 3. References & Verification
- For a full implementation example across all 4 layers, see [react-architecture-reference.md](./examples/react-architecture-reference.md).
- Verify pure logic with `npm test` (Vitest) and check types/hook rules (`eslint-plugin-react-hooks`) with `npm run lint`.
