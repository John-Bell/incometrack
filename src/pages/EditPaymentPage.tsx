import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function EditPaymentPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlAccountId = searchParams.get('accountId') || '';
    const from = searchParams.get('from') || '';

    const transaction = useLiveQuery(() => db.transactions.get(id as string));
    const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState('');
    const [budgetId, setBudgetId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (transaction) {
            setPayee(transaction.payee);
            setAmount(transaction.amount.toString());

            setBudgetId(transaction.budgetId || '');
            setAccountId(transaction.accountId || '');
            setType(transaction.type);
            const txDate = new Date(transaction.date);
            setDate(txDate.toISOString().split('T')[0]);
        }
    }, [transaction]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!accountId) return;

        await db.transactions.update(id, {
            date: new Date(date).getTime(),
            payee,
            amount: parseFloat(amount) || 0,
            type,
            icon: type === 'expense' ? 'shopping_cart' : 'payments',
            budgetId: budgetId || undefined,
            accountId
        });

        if (from === 'dashboard') {
            navigate('/');
        } else if (urlAccountId) {
            navigate(`/transactions?accountId=${urlAccountId}`);
        } else {
            navigate('/transactions');
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (confirm('Are you sure you want to delete this payment?')) {
            await db.transactions.delete(id);
            if (from === 'dashboard') {
                navigate('/');
            } else if (urlAccountId) {
                navigate(`/transactions?accountId=${urlAccountId}`);
            } else {
                navigate('/transactions');
            }
        }
    };

    if (!transaction) return null;

    return (
        <AppLayout
            header={
                <Header
                    title="Edit Payment"
                    leftElement={
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <span className="material-symbols-outlined text-2xl">arrow_back</span>
                        </button>
                    }
                    rightElement={
                        <button onClick={handleDelete} className="p-2 -mr-2 text-rose-500 hover:text-rose-600">
                            <span className="material-symbols-outlined text-2xl">delete</span>
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
                            onChange={(e) => setPayee(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            placeholder="E.g. Tesco, Salary, etc."
                        />
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

                    <div className="min-w-0 w-full">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors block max-w-full appearance-none min-w-0 dark:[color-scheme:dark]"
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
                        Save Changes
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
