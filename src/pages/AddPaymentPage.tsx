import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';

export function AddPaymentPage() {
    const navigate = useNavigate();

    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState('');
    const [budgetId, setBudgetId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [suggestedBudgetIds, setSuggestedBudgetIds] = useState<string[]>([]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accountId) return;

        await db.transactions.add({
            id: uuidv4(),
            date: new Date(date).getTime(),
            payee,
            amount: parseFloat(amount) || 0,
            type,
            icon: type === 'expense' ? 'shopping_cart' : 'payments',
            budgetId: budgetId || undefined,
            accountId
        });

        navigate('/transactions');
    };

    const handlePayeeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPayee(val);

        if (val) {
            const mappings = await db.paymentMappings.toArray();
            const matchedMapping = mappings.find(m => val.toLowerCase().includes(m.paymentName.toLowerCase()));

            if (matchedMapping && matchedMapping.budgetIds && matchedMapping.budgetIds.length > 0) {
                setSuggestedBudgetIds(matchedMapping.budgetIds);
                // Optionally auto-select the first one if the user hasn't chosen one
                if (!budgetId) {
                    const firstBudget = await db.budgets.get(matchedMapping.budgetIds[0]);
                    if (firstBudget) {
                        setBudgetId(firstBudget.id);
                        if (firstBudget.accountId) {
                            setAccountId(firstBudget.accountId);
                        }
                    }
                }
            } else {
                setSuggestedBudgetIds([]);
            }
        } else {
            setSuggestedBudgetIds([]);
        }
    };

    const applySuggestion = async (suggestedId: string) => {
        const budget = await db.budgets.get(suggestedId);
        if (budget) {
            setBudgetId(budget.id);
            if (budget.accountId) {
                setAccountId(budget.accountId);
            }
        }
    };

    return (
        <AppLayout
            header={
                <Header
                    title="Add Payment"
                    leftElement={
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <span className="material-symbols-outlined text-2xl">arrow_back</span>
                        </button>
                    }
                />
            }
        >
            <form onSubmit={handleSave} className="px-4 py-6 space-y-6 max-w-md mx-auto">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={`py-2 text-sm font-semibold rounded-lg transition-colors ${type === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={`py-2 text-sm font-semibold rounded-lg transition-colors ${type === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Income
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Account</label>
                        <div className="relative">
                            <select
                                required
                                value={accountId}
                                onChange={(e) => {
                                    const newAccountId = e.target.value;
                                    setAccountId(newAccountId);
                                    if (budgetId) {
                                        const budget = budgets.find(b => b.id === budgetId);
                                        if (budget && budget.accountId !== newAccountId) {
                                            setBudgetId('');
                                        }
                                    }
                                }}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
                            >
                                <option value="" disabled>Select an account</option>
                                {accounts
                                    .filter(account => account.category === 'Current Account')
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(account => (
                                        <option key={account.id} value={account.id}>{account.nickname || account.name}{account.last4Digits ? ` (x${account.last4Digits})` : ''}</option>
                                    ))
                                }
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Payee</label>
                        <input
                            type="text"
                            required
                            value={payee}
                            onChange={handlePayeeChange}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            placeholder="E.g. Tesco, Salary, etc."
                        />
                        {suggestedBudgetIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {suggestedBudgetIds.map(sId => {
                                    const budget = budgets.find(b => b.id === sId);
                                    if (!budget) return null;
                                    const isSelected = budgetId === sId;
                                    return (
                                        <button
                                            key={sId}
                                            type="button"
                                            onClick={() => applySuggestion(sId)}
                                            className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                                                isSelected
                                                ? 'bg-primary border-primary text-black shadow-sm'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {budget.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">£</span>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Budget</label>
                        <div className="relative">
                            <select
                                value={budgetId}
                                onChange={(e) => setBudgetId(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none"
                            >
                                <option value="" disabled>Select a budget (optional)</option>
                                {budgets
                                    .filter(budget => budget.accountId === accountId)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(budget => (
                                        <option key={budget.id} value={budget.id}>{budget.name}</option>
                                    ))
                                }
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 pb-24">
                    <button
                        type="submit"
                        disabled={!accountId}
                        className="w-full bg-primary text-background-dark font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Payment
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
