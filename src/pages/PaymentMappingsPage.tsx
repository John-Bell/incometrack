import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';

export function PaymentMappingsPage() {
    const mappings = useLiveQuery(() => db.paymentMappings.toArray()) || [];
    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const budgetCategories = useLiveQuery(() => db.budgetCategories.toArray()) || [];

    const categoryNameMap = Object.fromEntries(budgetCategories.map(c => [c.id, c.name]));

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPaymentName, setEditPaymentName] = useState('');
    const [editBudgetIds, setEditBudgetIds] = useState<string[]>([]);

    const [newPaymentName, setNewPaymentName] = useState('');
    const [newBudgetIds, setNewBudgetIds] = useState<string[]>([]);

    const handleAdd = async () => {
        const trimmed = newPaymentName.trim();
        if (!trimmed || newBudgetIds.length === 0) return;

        if (mappings.some(m => m.paymentName.toLowerCase() === trimmed.toLowerCase())) {
            alert('A mapping with this payment name already exists.');
            return;
        }

        await db.paymentMappings.add({
            id: crypto.randomUUID(),
            paymentName: trimmed,
            budgetIds: newBudgetIds,
            updatedAt: Date.now()
        });
        setNewPaymentName('');
        setNewBudgetIds([]);
    };

    const handleSaveEdit = async (id: string) => {
        const trimmed = editPaymentName.trim();
        if (!trimmed || editBudgetIds.length === 0) {
            setEditingId(null);
            return;
        }

        if (mappings.some(m => m.id !== id && m.paymentName.toLowerCase() === trimmed.toLowerCase())) {
            alert('A mapping with this payment name already exists.');
            return;
        }

        await db.paymentMappings.update(id, {
            paymentName: trimmed,
            budgetIds: editBudgetIds,
            updatedAt: Date.now()
        });
        setEditingId(null);
    };

    const toggleNewBudgetId = (id: string) => {
        if (newBudgetIds.includes(id)) {
            setNewBudgetIds(prev => prev.filter(bId => bId !== id));
        } else {
            setNewBudgetIds(prev => [...prev, id]);
        }
    };

    const toggleEditBudgetId = (id: string) => {
        if (editBudgetIds.includes(id)) {
            setEditBudgetIds(prev => prev.filter(bId => bId !== id));
        } else {
            setEditBudgetIds(prev => [...prev, id]);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete the mapping for "${name}"?`)) {
            await db.paymentMappings.delete(id);
        }
    };

    // Group budgets by category for the select dropdown
    const groupedBudgets = Array.from(new Set(budgets.map(b => b.budgetCategoryId))).map(catId => ({
        categoryId: catId,
        categoryName: categoryNameMap[catId] || catId,
        budgets: budgets.filter(b => b.budgetCategoryId === catId).sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    return (
        <AppLayout
            header={
                <Header
                    title="Payment Mappings"
                    rightElement={<MainHeaderActions />}
                />
            }
        >
            <div className="p-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col gap-6 pb-24">

                {/* Add New Mapping */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#283933] rounded-2xl p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Add Payment Mapping</h2>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row gap-2">
                            <input
                                type="text"
                                value={newPaymentName}
                                onChange={(e) => setNewPaymentName(e.target.value)}
                                placeholder="e.g. Tesco, Salary, Direct Debit"
                                className="flex-1 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                            <div className="relative flex-1">
                                <select
                                    value=""
                                    onChange={(e) => toggleNewBudgetId(e.target.value)}
                                    className="w-full h-full min-h-[48px] rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-slate-900/50 p-3 pr-10 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                >
                                    <option value="" disabled>Select Budget(s)</option>
                                    {groupedBudgets.map(group => (
                                        <optgroup key={group.categoryId} label={group.categoryName}>
                                            {group.budgets.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={!newPaymentName.trim() || newBudgetIds.length === 0}
                                className="bg-primary text-background-dark font-bold px-6 py-3 rounded-xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                            >
                                <Icon name="add" className="text-xl" />
                            </button>
                        </div>
                        {newBudgetIds.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {newBudgetIds.map(bId => {
                                    const budget = budgets.find(b => b.id === bId);
                                    if (!budget) return null;
                                    return (
                                        <div key={bId} className="flex items-center gap-1 bg-primary/10 text-primary text-sm font-semibold px-3 py-1.5 rounded-full">
                                            <span>{budget.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleNewBudgetId(bId)}
                                                className="hover:text-rose-500 transition-colors flex items-center justify-center cursor-pointer"
                                            >
                                                <Icon name="close" className="text-[16px]" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mappings List */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#283933] rounded-2xl shadow-sm overflow-hidden">
                    {mappings.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                            No payment mappings found.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-[#283933]">
                            {mappings.map((mapping) => (
                                <div key={mapping.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-4">
                                    {editingId === mapping.id ? (
                                        <div className="flex flex-col flex-1 gap-3">
                                            <div className="flex flex-col md:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    value={editPaymentName}
                                                    onChange={(e) => setEditPaymentName(e.target.value)}
                                                    className="flex-1 rounded-lg border border-primary/50 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white outline-none"
                                                />
                                                <div className="relative flex-1">
                                                    <select
                                                        value=""
                                                        onChange={(e) => toggleEditBudgetId(e.target.value)}
                                                        className="w-full h-full min-h-[40px] rounded-lg border border-primary/50 bg-white dark:bg-slate-900 p-2 pr-10 text-slate-900 dark:text-white outline-none appearance-none"
                                                    >
                                                        <option value="" disabled>Select Budget(s)</option>
                                                        {groupedBudgets.map(group => (
                                                            <optgroup key={group.categoryId} label={group.categoryName}>
                                                                {group.budgets.map(b => (
                                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                                        <span className="material-symbols-outlined">expand_more</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 self-end md:self-auto">
                                                    <button
                                                        onClick={() => handleSaveEdit(mapping.id)}
                                                        className="w-10 h-10 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center hover:bg-green-200 transition-colors cursor-pointer"
                                                        aria-label="Save"
                                                    >
                                                        <Icon name="check" className="text-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                                                        aria-label="Cancel"
                                                    >
                                                        <Icon name="close" className="text-[18px]" />
                                                    </button>
                                                </div>
                                            </div>
                                            {editBudgetIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {editBudgetIds.map(bId => {
                                                        const budget = budgets.find(b => b.id === bId);
                                                        if (!budget) return null;
                                                        return (
                                                            <div key={bId} className="flex items-center gap-1 bg-primary/10 text-primary text-sm font-semibold px-3 py-1.5 rounded-full">
                                                                <span>{budget.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleEditBudgetId(bId)}
                                                                    className="hover:text-rose-500 transition-colors flex items-center justify-center cursor-pointer"
                                                                >
                                                                    <Icon name="close" className="text-[16px]" />
                                                                </button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Icon name="sync_alt" className="text-slate-500 dark:text-slate-400" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{mapping.paymentName}</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {(mapping.budgetIds || []).map(bId => {
                                                                const b = budgets.find(x => x.id === bId);
                                                                if (!b) return null;
                                                                return (
                                                                    <span key={bId} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                                                                        {b.name}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end md:self-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingId(mapping.id);
                                                        setEditPaymentName(mapping.paymentName);
                                                        setEditBudgetIds(mapping.budgetIds || []);
                                                    }}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                                    aria-label="Edit mapping"
                                                >
                                                    <Icon name="edit" className="text-[18px]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(mapping.id, mapping.paymentName)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                    aria-label="Delete mapping"
                                                >
                                                    <Icon name="delete" className="text-[18px]" />
                                                </button>
                                            </div>
                                        </>
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
