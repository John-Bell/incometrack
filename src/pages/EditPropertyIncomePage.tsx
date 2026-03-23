import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePropertyIncomeForm } from '@/hooks/usePropertyIncomeForm';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';

export function EditPropertyIncomePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnPropertyId = searchParams.get('propertyId');

    const { formData, setFormData, handleSubmit, deleteIncome, income } = usePropertyIncomeForm(id);
    const properties = useLiveQuery(() => db.properties.toArray(), []) || [];

    const onSubmit = async (e: React.FormEvent) => {
        await handleSubmit(e);
        navigate(`/property-incomes${returnPropertyId && returnPropertyId !== 'all' ? `?propertyId=${returnPropertyId}` : ''}`);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this income?')) {
            await deleteIncome();
            navigate(`/property-incomes${returnPropertyId && returnPropertyId !== 'all' ? `?propertyId=${returnPropertyId}` : ''}`);
        }
    };

    if (!income) {
        return (
            <AppLayout header={<Header title="Edit Income" leftElement={<button onClick={() => navigate(`/property-incomes${returnPropertyId && returnPropertyId !== 'all' ? `?propertyId=${returnPropertyId}` : ''}`)}><Icon name="arrow_back" className="text-2xl" /></button>} />}>
                <div className="max-w-2xl mx-auto flex items-center justify-center h-64 p-4">
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Icon name="refresh" className="animate-spin text-xl" /> Loading income details...
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout header={<Header title="Edit Income" leftElement={<button onClick={() => navigate(`/property-incomes${returnPropertyId && returnPropertyId !== 'all' ? `?propertyId=${returnPropertyId}` : ''}`)}><Icon name="arrow_back" className="text-2xl" /></button>} />}>
            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={onSubmit} className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#283933] space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-[#283933] pb-6">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                            <Icon name="payments" className="text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Income Details</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Update the details of your property income.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Property <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.propertyId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="" disabled>Select a property</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="block max-w-full appearance-none min-w-0 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:[color-scheme:dark]"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Amount (£) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="0.00"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="e.g. Rent, Deposit"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-[#283933] flex justify-between gap-3">
                         <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                            <Icon name="delete" />
                            Delete Income
                        </button>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/property-incomes${returnPropertyId && returnPropertyId !== 'all' ? `?propertyId=${returnPropertyId}` : ''}`)}
                                className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!formData.propertyId || !formData.date || !formData.amount}
                                className="px-6 py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                            >
                                <Icon name="save" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
