import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { AppLayout } from '../components/layout/AppLayout';
import { Icon } from '../components/ui/Icon';
import { useState, useEffect } from 'react';

export function EditBudgetPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const budget = useLiveQuery(() => db.budgets.get(id as string), [id]);
    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [paymentSource, setPaymentSource] = useState('monthly');
    const [accountId, setAccountId] = useState('');

    useEffect(() => {
        if (budget) {
            setName(budget.name);
            setAmount(budget.amount.toString());
            setFrequency(budget.frequency);
            setPaymentSource(budget.paymentSource);
            setAccountId(budget.accountId || '');
            }
    }, [budget]);

    const handleSave = async () => {
        if (!id || !budget || !accountId) return;

        await db.budgets.update(id, {
            name,
            amount: parseFloat(amount) || 0,
            frequency,
            paymentSource,
            accountId
        } );
        navigate('/budgets');
    };

    const handleDelete = async () => {
        if (!id) return;
        await db.budgets.delete(id);
        navigate('/budgets');
    };

    if (!budget) {
        return (
            <AppLayout hideBottomNav>
                <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                    <p className="text-slate-500">Loading budget item...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout hideBottomNav>
            <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
                {/* Top Navigation Bar */}
                <div className="flex items-center bg-background-light/95 dark:bg-background-dark/95 p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-primary/10 backdrop-blur-md">
                    <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-surface-dark rounded-full transition-colors">
                        <Icon name="arrow_back" />
                    </button>
                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Edit Budget Item</h2>
                    <div className="flex w-12 items-center justify-end">
                        <button
                            onClick={handleSave}
                            className="flex items-center justify-center rounded-lg h-12 bg-transparent text-primary hover:bg-primary/10 transition-colors p-2"
                        >
                            <Icon name="check" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full">
                    {/* Sub-category (Now just Name) */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Budget name</label>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Amount Section */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">£</span>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 pl-8 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Frequency */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Frequency</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFrequency('monthly')}
                                className={`px-4 py-2 rounded-full text-sm font-medium ${frequency === 'monthly' ? 'border-2 border-primary bg-primary/10 text-primary' : 'border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setFrequency('annual')}
                                className={`px-4 py-2 rounded-full text-sm font-medium ${frequency === 'annual' ? 'border-2 border-primary bg-primary/10 text-primary' : 'border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'}`}
                            >
                                Annual
                            </button>
                            <button
                                onClick={() => setFrequency('one-off')}
                                className={`px-4 py-2 rounded-full text-sm font-medium ${frequency === 'one-off' ? 'border-2 border-primary bg-primary/10 text-primary' : 'border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'}`}
                            >
                                One-off
                            </button>
                        </div>
                    </div>

                    {/* Payment Source & Ownership */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Location</label>
                            <select
                                value={paymentSource}
                                onChange={(e) => setPaymentSource(e.target.value)}
                                className="custom-select w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="Groceries / Incidentals">Groceries / Incidentals</option>
                                <option value="Monthly Bills">Monthly Bills</option>
                                <option value="Annual Bills">Annual Bills</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Account</label>
                            <select
                                required
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="custom-select w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="" disabled>Select an account</option>
                                {accounts
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((acc) => (
                                        <option key={acc.id} value={acc.id}>{acc.nickname || acc.name}{acc.last4Digits ? ` (x${acc.last4Digits})` : ''}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Additional Details / Info Card */}
                    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-start gap-3">
                            <Icon name="info" className="text-primary mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Annual Budgeting</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">This item will be automatically spread across 12 months in your reports.</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!accountId}
                            className="w-full bg-primary text-background-dark font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(19,236,164,0.39)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center justify-center gap-2 text-rose-500 font-medium py-4 rounded-xl hover:bg-rose-500/10 transition-colors"
                        >
                            <Icon name="delete" className="text-[20px]" />
                            Delete Budget Item
                        </button>
                    </div>
                </div>

                {/* Spacer for bottom padding */}
                <div className="h-10"></div>
            </div>
        </AppLayout>
    );
}
