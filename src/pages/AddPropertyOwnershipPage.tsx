import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { usePropertyOwnershipForm } from '@/hooks/usePropertyOwnershipForm';
import { useStore } from '@/store/useStore';

export function AddPropertyOwnershipPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const defaultPropertyId = searchParams.get('propertyId');
    const { profile } = useStore();

    const { formData, setFormData, handleSubmit } = usePropertyOwnershipForm();
    const properties = useLiveQuery(() => db.properties.toArray(), []) || [];

    useEffect(() => {
        if (defaultPropertyId && defaultPropertyId !== 'all' && !formData.propertyId) {
            setFormData(prev => ({ ...prev, propertyId: defaultPropertyId }));
        }
    }, [defaultPropertyId, formData.propertyId, setFormData]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSubmit(e);
        navigate(`/property-ownerships${defaultPropertyId && defaultPropertyId !== 'all' ? `?propertyId=${defaultPropertyId}` : ''}`);
    };

    const handlePerson1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numVal = Number(val);
        if (!isNaN(numVal) && numVal >= 0 && numVal <= 100) {
            setFormData(prev => ({
                ...prev,
                person1Percent: val,
                person2Percent: (100 - numVal).toString()
            }));
        } else if (val === '') {
            setFormData(prev => ({ ...prev, person1Percent: '', person2Percent: '' }));
        }
    };

    const person1Name = profile?.partner1Name || 'Person 1';
    const person2Name = profile?.partner2Name || 'Person 2';

    return (
        <AppLayout header={<Header title="Add Ownership Record" leftElement={<button onClick={() => navigate(`/property-ownerships${defaultPropertyId && defaultPropertyId !== 'all' ? `?propertyId=${defaultPropertyId}` : ''}`)}><Icon name="arrow_back" className="text-2xl" /></button>} />}>
            <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-[#1a2e26] rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-[#283933]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Icon name="real_estate_agent" className="text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Ownership Details</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Record a new ownership split for your property.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Property *
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#283933] text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary appearance-none transition-shadow"
                                        value={formData.propertyId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                                        required
                                    >
                                        <option value="" disabled>Select a property</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="home" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                                    <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Start Date *
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#283933] text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        required
                                    />
                                    <Icon name="calendar_today" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {person1Name} (%) *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#283933] text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                                            placeholder="50"
                                            value={formData.person1Percent}
                                            onChange={handlePerson1Change}
                                            required
                                        />
                                        <Icon name="percent" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {person2Name} (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#283933] text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow opacity-70 cursor-not-allowed"
                                            value={formData.person2Percent}
                                            disabled
                                        />
                                        <Icon name="percent" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Auto-calculated</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(`/property-ownerships${defaultPropertyId && defaultPropertyId !== 'all' ? `?propertyId=${defaultPropertyId}` : ''}`)}
                            className="flex-1 px-6 py-3 rounded-xl border border-slate-200 dark:border-[#283933] text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-black/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-content px-6 py-3 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={!formData.propertyId || !formData.startDate || formData.person1Percent === '' || formData.person2Percent === ''}
                        >
                            <Icon name="save" className="text-xl" />
                            Save Record
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
