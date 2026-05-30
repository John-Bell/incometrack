import { useSearchParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { getTaxYearOrLatest, getTaxYearDates } from '@/constants/taxConstants';

export function PropertyIncomesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const propertyIdFilter = searchParams.get('propertyId') || 'all';
    const defaultTaxYear = getTaxYearOrLatest();
    const taxYearFilter = searchParams.get('taxYear') || defaultTaxYear;

    const properties = useLiveQuery(() => db.properties.toArray(), []) || [];
    const taxRules = useLiveQuery(() => db.taxRules.toArray(), []) || [];

    const incomes = useLiveQuery(async () => {
        let collection = db.propertyIncomes.orderBy('date').reverse();
        const filteredArray = await collection.toArray();
        const { startTs, endTs } = getTaxYearDates(taxYearFilter);

        return filteredArray.filter(e => {
            const matchesProperty = propertyIdFilter === 'all' || e.propertyId === propertyIdFilter;
            const matchesTaxYear = e.date >= startTs && e.date <= endTs;
            return matchesProperty && matchesTaxYear;
        });
    }, [propertyIdFilter, taxYearFilter]);

    const handlePropertyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'all') {
            searchParams.delete('propertyId');
        } else {
            searchParams.set('propertyId', value);
        }
        setSearchParams(searchParams);
    };

    const handleTaxYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === defaultTaxYear) {
            searchParams.delete('taxYear');
        } else {
            searchParams.set('taxYear', value);
        }
        setSearchParams(searchParams);
    };

    const getPropertyName = (id: string) => {
        return properties.find(p => p.id === id)?.name || 'Unknown Property';
    };

    const formatCurrency = (amount: number) => {
        return Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <AppLayout header={<Header title="Property Incomes" />}>
            <div className="max-w-4xl mx-auto space-y-6 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                         <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                             <Icon name="payments" className="text-xl" />
                         </div>
                         Incomes
                    </h2>

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

                         <div className="relative flex-1 sm:w-48">
                            <select
                                value={propertyIdFilter}
                                onChange={handlePropertyFilterChange}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#283933] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                            >
                                <option value="all">All Properties</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <Icon name="filter_alt" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        </div>

                        <Link
                            to={`/property-incomes/add${propertyIdFilter !== 'all' ? `?propertyId=${propertyIdFilter}` : ''}`}
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm whitespace-nowrap"
                        >
                            <Icon name="add" className="text-xl" />
                            <span>Add Income</span>
                        </Link>
                    </div>
                </div>

                {!incomes || incomes.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-[#283933]">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-black/30 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                            <Icon name="payments" className="text-3xl" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Incomes Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                            {propertyIdFilter === 'all'
                                ? "You haven't added any property incomes yet."
                                : "No incomes found for this property."}
                        </p>
                        <Link
                            to={`/property-incomes/add${propertyIdFilter !== 'all' ? `?propertyId=${propertyIdFilter}` : ''}`}
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                            <Icon name="add" />
                            <span>Add Your First Income</span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-[#283933] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-black/20 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#283933]">
                                        <th className="px-6 py-4 font-semibold w-1/5">Date</th>
                                        <th className="px-6 py-4 font-semibold w-1/4">Property</th>
                                        <th className="px-6 py-4 font-semibold w-1/4">Description</th>
                                        <th className="px-6 py-4 font-semibold text-right w-1/6">Amount</th>
                                        <th className="px-6 py-4 font-semibold text-right w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-[#283933]">
                                    {incomes.map(income => (
                                        <tr key={income.id} className="hover:bg-slate-50/50 dark:hover:bg-black/10 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                {formatDate(income.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                                                        <Icon name="home" className="text-sm" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {getPropertyName(income.propertyId)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {income.description && (
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{income.description}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                                    +{formatCurrency(income.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Link
                                                    to={`/property-incomes/edit/${income.id}?propertyId=${propertyIdFilter}`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
                                                    aria-label="Edit income"
                                                >
                                                    <Icon name="edit" className="text-xl" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
