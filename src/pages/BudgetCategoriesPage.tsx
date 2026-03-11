import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';

export function BudgetCategoriesPage() {
    const categories = useLiveQuery(() => db.budgetCategories.toArray()) || [];

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [newName, setNewName] = useState('');

    const handleAdd = async () => {
        const trimmed = newName.trim();
        if (!trimmed) return;

        // Prevent exact duplicates
        if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
            alert('A category with this name already exists.');
            return;
        }

        await db.budgetCategories.add({
            id: crypto.randomUUID(),
            name: trimmed,
            updatedAt: Date.now()
        });
        setNewName('');
    };

    const handleSaveEdit = async (id: string) => {
        const trimmed = editName.trim();
        if (!trimmed) {
            setEditingId(null);
            return;
        }

        if (categories.some(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
            alert('A category with this name already exists.');
            return;
        }

        await db.budgetCategories.update(id, { name: trimmed, updatedAt: Date.now() });
        setEditingId(null);
    };

    const handleDelete = async (id: string, name: string) => {
        // Warning: Deleting a category that's in use might affect existing budgets.
        // We could block deletion if in use, but standard simple CRUD is fine for now.
        if (confirm(`Are you sure you want to delete the "${name}" category?`)) {
            await db.budgetCategories.delete(id);
        }
    };

    return (
        <AppLayout
            header={
                <Header
                    title="Budget Categories"
                    rightElement={<MainHeaderActions />}
                />
            }
        >
            <div className="p-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col gap-6">

                {/* Add New Category */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#283933] rounded-2xl p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Add Category</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                            placeholder="e.g. Health & Fitness"
                            className="flex-1 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            className="bg-primary text-background-dark font-bold px-4 rounded-xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                        >
                            <Icon name="add" className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Categories List */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#283933] rounded-2xl shadow-sm overflow-hidden">
                    {categories.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                            No categories found.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-[#283933]">
                            {categories.map((category) => (
                                <div key={category.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">

                                    {editingId === category.id ? (
                                        <div className="flex flex-1 gap-2 mr-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(category.id); }}
                                                className="flex-1 rounded-lg border border-primary/50 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white outline-none"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleSaveEdit(category.id)}
                                                className="w-10 h-10 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center hover:bg-green-200 transition-colors cursor-pointer"
                                            >
                                                <Icon name="check" className="text-[18px]" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <Icon name="category" className="text-slate-500 dark:text-slate-400" />
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{category.name}</span>
                                        </div>
                                    )}

                                    {editingId !== category.id && (
                                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(category.id);
                                                    setEditName(category.name);
                                                }}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                                aria-label="Edit category"
                                            >
                                                <Icon name="edit" className="text-[18px]" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(category.id, category.name)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                aria-label="Delete category"
                                            >
                                                <Icon name="delete" className="text-[18px]" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
