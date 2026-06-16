import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { getTaxYearOrLatest, getTaxYearDates } from '@/constants/taxConstants';

export function PropertiesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const defaultTaxYear = getTaxYearOrLatest();
    const taxYearFilter = searchParams.get('taxYear') || defaultTaxYear;

    const properties = useLiveQuery(() => db.properties.toArray(), []);
    const expenses = useLiveQuery(() => db.propertyExpenses.toArray(), []);
    const incomes = useLiveQuery(() => db.propertyIncomes.toArray(), []);
    const taxRules = useLiveQuery(() => db.taxRules.toArray(), []);

    const { startTs, endTs } = getTaxYearDates(taxYearFilter);

    const calculateTotalExpenses = (propertyId: string) => {
        if (!expenses) return 0;
        return expenses
            .filter(e => e.propertyId === propertyId && e.date >= startTs && e.date <= endTs)
            .reduce((sum, e) => sum + e.amount, 0);
    };

    const calculateTotalIncomes = (propertyId: string) => {
        if (!incomes) return 0;
        return incomes
            .filter(i => i.propertyId === propertyId && i.date >= startTs && i.date <= endTs)
            .reduce((sum, i) => sum + i.amount, 0);
    };

    const handleTaxYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTaxYear = e.target.value;
        if (newTaxYear === defaultTaxYear) {
            searchParams.delete('taxYear');
        } else {
            searchParams.set('taxYear', newTaxYear);
        }
        setSearchParams(searchParams);
    };

    return (
        <AppLayout header={<Header title="Properties" />}>
            <div className="max-w-4xl mx-auto space-y-6 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Properties</h2>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                        <div className="relative flex-1 sm:w-48">
                            <select
                                value={taxYearFilter}
                                onChange={handleTaxYearChange}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#283933] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                            >
                                {taxRules?.map(rule => (
                                    <option key={rule.id} value={rule.id}>{rule.id}</option>
                                ))}
                            </select>
                            <Icon name="calendar_today" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        </div>
                        <Link
                            to="/properties/add"
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm whitespace-nowrap"
                        >
                            <Icon name="add" className="text-xl" />
                            <span>Add Property</span>
                        </Link>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {properties.map(property => (
                            <div key={property.id} className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#283933] flex flex-col h-full">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                                            <Icon name="home" className="text-2xl" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">{property.name}</h3>

                                    <div className="mt-3 flex">
                                        <Link
                                            to={`/property-ownerships?propertyId=${property.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-black/40 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#283933] transition-colors shadow-sm"
                                        >
                                            <Icon name="real_estate_agent" className="text-[14px]" />
                                            <span>Ownerships</span>
                                        </Link>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#283933] grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Total Incomes</p>
                                            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                +{Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(calculateTotalIncomes(property.id))}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Total Expenses</p>
                                            <p className="text-xl font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                                -{Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(calculateTotalExpenses(property.id))}
                                            </p>
                                        </div>
                                    </div>

                                    {(property.estimatedSaleDate || property.estimatedNetCashOnSale) && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#283933] space-y-2">
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estimated Sale</p>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                    <Icon name="calendar_today" className="text-sm" />
                                                    <span className="text-sm">{property.estimatedSaleDate ? new Date(property.estimatedSaleDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Not set'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                                                    <Icon name="payments" className="text-sm" />
                                                    <span className="text-sm">{property.estimatedNetCashOnSale ? Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(property.estimatedNetCashOnSale) : '£0'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex flex-wrap justify-end gap-2">
                                    <Link
                                        to={`/property-incomes?propertyId=${property.id}`}
                                        className="flex-1 inline-flex justify-center items-center gap-2 bg-slate-100 dark:bg-black/30 hover:bg-slate-200 dark:hover:bg-black/50 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                                    >
                                        <Icon name="payments" className="text-base" />
                                        <span>Incomes</span>
                                    </Link>
                                     <Link
                                        to={`/property-expenses?propertyId=${property.id}`}
                                        className="flex-1 inline-flex justify-center items-center gap-2 bg-slate-100 dark:bg-black/30 hover:bg-slate-200 dark:hover:bg-black/50 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                                    >
                                        <Icon name="receipt_long" className="text-base" />
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
