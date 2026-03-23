import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';

export function PropertiesPage() {
    const properties = useLiveQuery(() => db.properties.toArray(), []);
    const expenses = useLiveQuery(() => db.propertyExpenses.toArray(), []);

    const calculateTotalExpenses = (propertyId: string) => {
        if (!expenses) return 0;
        return expenses
            .filter(e => e.propertyId === propertyId)
            .reduce((sum, e) => sum + e.amount, 0);
    };

    return (
        <AppLayout header={<Header title="Properties" />}>
            <div className="max-w-4xl mx-auto space-y-6 p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Properties</h2>
                    <Link
                        to="/properties/add"
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                    >
                        <Icon name="add" className="text-xl" />
                        <span>Add Property</span>
                    </Link>
                </div>

                {!properties || properties.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-[#283933]">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-black/30 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                            <Icon name="home" className="text-3xl" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Properties Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                            Add a property to start tracking its expenses.
                        </p>
                        <Link
                            to="/properties/add"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                            <Icon name="add" />
                            <span>Add Your First Property</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(property => (
                            <div key={property.id} className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#283933] flex flex-col h-full">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                                            <Icon name="home" className="text-2xl" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">{property.name}</h3>

                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#283933]">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Expenses</p>
                                        <p className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                                            {Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(calculateTotalExpenses(property.id))}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                     <Link
                                        to={`/property-expenses?propertyId=${property.id}`}
                                        className="flex-1 inline-flex justify-center items-center gap-2 bg-slate-100 dark:bg-black/30 hover:bg-slate-200 dark:hover:bg-black/50 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg transition-colors font-medium text-sm"
                                    >
                                        <Icon name="list_alt" className="text-base" />
                                        <span>Expenses</span>
                                    </Link>
                                    <Link
                                        to={`/properties/edit/${property.id}`}
                                        className="inline-flex justify-center items-center gap-2 bg-slate-100 dark:bg-black/30 hover:bg-slate-200 dark:hover:bg-black/50 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg transition-colors font-medium text-sm"
                                        aria-label={`Edit ${property.name}`}
                                    >
                                        <Icon name="edit" className="text-base" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
