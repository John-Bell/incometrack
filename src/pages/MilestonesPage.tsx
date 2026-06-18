import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';

export function MilestonesPage() {
    const navigate = useNavigate();
    const milestones = useLiveQuery(() => db.milestones.orderBy('date').toArray(), []);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <AppLayout
            header={
                <Header
                    title="Milestones"
                    subtitle="Projection Life Events"
                    leftElement={
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors">
                            <Icon name="arrow_back" className="text-2xl text-slate-700 dark:text-slate-300" />
                        </button>
                    }
                />
            }
        >
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Milestones</h2>
                    <Link
                        to="/milestones/add"
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                    >
                        <Icon name="add" />
                        <span>Add Milestone</span>
                    </Link>
                </div>

                {!milestones || milestones.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-[#283933]">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-black/30 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                            <Icon name="flag" className="text-3xl" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Milestones Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                            Add life events like retirements, house purchases, or inheritances to see their impact on your projection.
                        </p>
                        <Link
                            to="/milestones/add"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                            <Icon name="add" />
                            <span>Add Your First Milestone</span>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {milestones.map(milestone => (
                            <div
                                key={milestone.id}
                                onClick={() => navigate(`/milestones/edit/${milestone.id}`)}
                                className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-[#283933] flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Icon name="flag" className="text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{milestone.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(milestone.date)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold ${milestone.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {milestone.amount >= 0 ? '+' : ''}{formatCurrency(milestone.amount)}
                                    </div>
                                    <Icon name="chevron_right" className="text-slate-300 dark:text-slate-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                    <Icon name="info" className="text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        Milestones with a positive amount represent cash injections (e.g., inheritance, tax-free lump sum). Negative amounts represent large one-off expenses (e.g., house purchase).
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
