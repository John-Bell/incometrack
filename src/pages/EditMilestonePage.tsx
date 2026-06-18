import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';

export function EditMilestonePage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        db.milestones.get(id).then(milestone => {
            if (milestone) {
                setName(milestone.name);
                setDate(new Date(milestone.date).toISOString().split('T')[0]);
                setAmount(milestone.amount.toString());
            }
            setIsLoading(false);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !name || !date) return;

        await db.milestones.update(id, {
            name,
            date: new Date(date).getTime(),
            amount: parseFloat(amount) || 0,
            updatedAt: Date.now()
        });

        navigate('/milestones');
    };

    const handleDelete = async () => {
        if (!id) return;
        if (confirm('Are you sure you want to delete this milestone?')) {
            await db.milestones.delete(id);
            navigate('/milestones');
        }
    };

    if (isLoading) {
        return (
            <AppLayout header={<Header title="Edit Milestone" />}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            header={
                <Header
                    title="Edit Milestone"
                    leftElement={
                        <button onClick={() => navigate('/milestones')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors">
                            <Icon name="arrow_back" className="text-2xl text-slate-700 dark:text-slate-300" />
                        </button>
                    }
                    rightElement={
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 transition-colors cursor-pointer"
                            aria-label="Delete milestone"
                        >
                            <Icon name="delete" className="text-2xl" />
                        </button>
                    }
                />
            }
        >
            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#283933] space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-[#283933] pb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <Icon name="flag" className="text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Milestone</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Update the details of your life event.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Milestone Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Retirement, House Move, Inheritance"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Amount (£)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                                <input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Positive for inflows, negative for outflows.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-[#283933] flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/milestones')}
                            className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name || !date}
                            className="px-6 py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                            <Icon name="save" />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
