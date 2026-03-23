import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePropertyForm } from '@/hooks/usePropertyForm';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';

export function AddPropertyPage() {
    const navigate = useNavigate();
    const { formData, setFormData, handleSubmit } = usePropertyForm();

    const onSubmit = async (e: React.FormEvent) => {
        await handleSubmit(e);
        navigate('/properties');
    };

    return (
        <AppLayout header={<Header title="Add Property" leftElement={<button onClick={() => navigate('/properties')}><Icon name="arrow_back" className="text-2xl" /></button>} />}>
            <div className="max-w-2xl mx-auto p-4">
                <form onSubmit={onSubmit} className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#283933] space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-[#283933] pb-6">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                            <Icon name="home" className="text-2xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Property Details</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Enter the name of the property you want to track.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Property Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. 123 Main St"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-[#283933] flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/properties')}
                            className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.name}
                            className="px-6 py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                        >
                            <Icon name="save" />
                            Save Property
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
