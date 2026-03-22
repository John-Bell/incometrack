---
name: React Architecture Standard (Dexie/Vitest/Zustand)
description: Enforces strict separation of concerns (utils, hooks, stores, components). Dictates Zustand for global state, local unified state for forms (Anti-Bloat), and DRY CRUD operations using Dexie.
version: 2.1.0
---

# React Clean Architecture Guidelines

You are an expert React developer. Whenever you create, refactor, or modify a React component in this project, you MUST strictly adhere to the following rules:

## 1. Strict Separation of Concerns
Never create "fat components". Every UI feature must be split into distinct layers:
* **Layer 1: Pure Logic (`src/utils/*.ts`)** All business rules, conditional checks (e.g., `canShowBonus`), math, and formatting must live in pure, framework-agnostic TypeScript functions. These must be instantly testable via Vitest without mounting React.
* **Layer 2: Global State (`src/stores/*.ts`)** All global app state (e.g., auth, UI themes, cross-screen data) must live in Zustand stores. Zustand actions may interact with Dexie if the store acts as a global data cache.
* **Layer 3: Local Stateful Logic (`src/hooks/*.ts`)** Local component state, `useLiveQuery` subscriptions to Dexie, and local side effects (`useEffect`) must live in custom React hooks.
* **Layer 4: Lean Components (`src/pages/*.tsx` or `src/components/*.tsx`)** Components must ONLY import custom hooks or Zustand selectors, destructure the necessary state/functions, and render JSX with Tailwind classes. NO business logic or database calls are allowed in the `.tsx` file.

## 2. State Management Rules (Global vs. Local)
* **Zustand Selectors:** When consuming Zustand in a component, ALWAYS use atomic selectors to prevent over-rendering (e.g., `const theme = useAppStore(state => state.theme)`). Never import the entire state object.
* **Ephemeral Form State (Anti-Bloat):** NEVER put temporary form data (keystrokes) into Zustand. Keep it local.
* **Unified Form State:** ALWAYS use a unified state object for local forms: `const [formData, setFormData] = useState<Partial<Model>>({ ... })`.
* **Single Change Handler:** ALWAYS provide a single, universal change handler for forms: `const handleChange = (field: keyof Model, value: any) => setFormData(prev => ({ ...prev, [field]: value }))`.

## 3. DRY Principles for CRUD Operations
* **NEVER** duplicate "Add" and "Edit" logic into separate files.
* **ALWAYS** combine them into a single custom hook (e.g., `use[Feature]Form(id?)`).
* If an `id` is passed, the hook must fetch the existing record via Dexie (or the Zustand store) and populate the local `formData` object.
* The `handleSave` function must dynamically choose between `db.table.add(payload)` and `db.table.update(id, payload)` based on the presence of that `id`.

## 4. Reference Patterns (Crucial)
Before writing any code, you MUST read and strictly apply the structural patterns provided in the bundled resource:
**Refer to:** `./examples/react-architecture-reference.md`

## 5. Verification
Before finalizing your code, ask yourself:
* Are there any Dexie calls or complex logic inside the `.tsx` file? (If yes, move them to a hook or Zustand action).
* Did I put temporary form keystrokes into a Zustand store? (If yes, revert to local `useState`).
* Did I use multiple `useState` hooks for a form instead of a single `formData` object? (If yes, refactor).
* Can the pure logic be tested in Vitest without React?