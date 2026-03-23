import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Link, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { useStore } from '@/store/useStore';

export function PropertyOwnershipsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const propertyIdFilter = searchParams.get('propertyId') || 'all';
    const { profile } = useStore();

    const properties = useLiveQuery(() => db.properties.toArray(), []) || [];

    const ownerships = useLiveQuery(
        async () => {
            let collection = db.propertyOwnership.orderBy('startDate').reverse();
            let allOwnerships = await collection.toArray();

            if (propertyIdFilter !== 'all') {
                allOwnerships = allOwnerships.filter(o => o.propertyId === propertyIdFilter);
            }

            return allOwnerships;
        },
        [propertyIdFilter]
    );

    const handlePropertyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'all') {
            searchParams.delete('propertyId');
        } else {
            searchParams.set('propertyId', value);
        }
        setSearchParams(searchParams);
    };

    const getPropertyName = (id: string) => {
        return properties.find(p => p.id === id)?.name || 'Unknown Property';
    };

    const person1Name = profile?.partner1Name || 'Person 1';
    const person2Name = profile?.partner2Name || 'Person 2';

    return (
        <AppLayout header={<Header title="Property Ownership" />}>
            <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1a2e26] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-[#283933]">
                    <div className="flex items-center gap-2">
                        <Icon name="real_estate_agent" className="text-2xl text-primary" />
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Ownership Records</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Manage how your properties are split.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <select
                            className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#283933] text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                            value={propertyIdFilter}
                            onChange={handlePropertyFilterChange}
                        >
                            <option value="all">All Properties</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        <Link
                            to={`/property-ownerships/add${propertyIdFilter !== 'all' ? `?propertyId=${propertyIdFilter}` : ''}`}
                            className="bg-primary hover:bg-primary/90 text-primary-content px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                        >
                            <Icon name="add" className="text-xl" />
                            Add Record
                        </Link>
                    </div>
                </div>

                {!ownerships || ownerships.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a2e26] rounded-xl shadow-sm border border-slate-200 dark:border-[#283933] p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-black/30 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                            <Icon name="real_estate_agent" className="text-3xl" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">No ownership records</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                            {propertyIdFilter === 'all'
                                ? "You haven't added any property ownership records yet."
                                : "No ownership records found for this property."}
                        </p>
                        <Link
                            to={`/property-ownerships/add${propertyIdFilter !== 'all' ? `?propertyId=${propertyIdFilter}` : ''}`}
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-content px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Icon name="add" />
                            Add Record
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#1a2e26] rounded-xl shadow-sm border border-slate-200 dark:border-[#283933] overflow-hidden">
                        {/* Desktop Table Header */}
                        <div className="hidden md:grid grid-cols-5 gap-4 p-4 bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-[#283933] font-medium text-slate-500 dark:text-slate-400 text-sm">
                            <div className="col-span-1">Start Date</div>
                            <div className="col-span-1">Property</div>
                            <div className="col-span-1 text-right">{person1Name}</div>
                            <div className="col-span-1 text-right">{person2Name}</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-[#283933]/50">
                            {ownerships.map(ownership => (
                                <div key={ownership.id} className="p-4 hover:bg-slate-50 dark:hover:bg-black/10 transition-colors">
                                    <div className="flex flex-col md:grid md:grid-cols-5 md:items-center gap-4">
                                        <div className="flex items-center gap-3 col-span-1">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary">
                                                <Icon name="calendar_today" className="text-xl" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 dark:text-slate-200 md:hidden">Start Date</div>
                                                <div className="text-sm text-slate-600 dark:text-slate-300">
                                                    {new Date(ownership.startDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-1">
                                            <div className="font-medium text-slate-800 dark:text-slate-200 md:hidden">Property</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                {getPropertyName(ownership.propertyId)}
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:text-right">
                                            <div className="font-medium text-slate-800 dark:text-slate-200 md:hidden">{person1Name}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                {ownership.person1Percent}%
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:text-right">
                                            <div className="font-medium text-slate-800 dark:text-slate-200 md:hidden">{person2Name}</div>
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                {ownership.person2Percent}%
                                            </div>
                                        </div>

                                        <div className="col-span-1 flex items-center justify-end">
                                            <Link
                                                to={`/property-ownerships/edit/${ownership.id}?propertyId=${propertyIdFilter}`}
                                                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm font-medium"
                                                aria-label={`Edit ownership from ${new Date(ownership.startDate).toLocaleDateString()}`}
                                            >
                                                <Icon name="edit" className="text-base" />
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
