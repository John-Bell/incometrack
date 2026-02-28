import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Icon } from '../components/ui/Icon';

export function EditBudgetPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // TODO: Load actual budget item once dynamic data is implemented. For now static view.

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
                        <button className="flex items-center justify-center rounded-lg h-12 bg-transparent text-primary hover:bg-primary/10 transition-colors p-2">
                            <Icon name="check" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full">
                    {/* Category & Sub-category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Category</label>
                            <select className="custom-select w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                                <option value="cars">Cars</option>
                                <option value="housing">Housing</option>
                                <option value="food">Food & Dining</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Sub-category</label>
                            <select className="custom-select w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                                <option value="insurance">Insurance</option>
                                <option value="fuel">Fuel</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    {/* Amount Section */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Monthly Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">£</span>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 pl-8 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                type="text"
                                defaultValue="25.00"
                            />
                        </div>
                    </div>

                    {/* Frequency */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Frequency</label>
                        <div className="flex flex-wrap gap-2">
                            <button className="px-4 py-2 rounded-full text-sm font-medium border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">Monthly</button>
                            <button className="px-4 py-2 rounded-full text-sm font-medium border-2 border-primary bg-primary/10 text-primary">Annual</button>
                            <button className="px-4 py-2 rounded-full text-sm font-medium border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">One-off</button>
                        </div>
                    </div>

                    {/* Payment Source & Ownership */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Payment Source</label>
                            <select className="custom-select w-full rounded-lg border border-slate-300 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                                <option value="current">Current Account</option>
                                <option value="annual">Annual Account</option>
                                <option value="savings">Savings Account</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">Ownership</label>
                            <div className="flex p-1 bg-slate-200 dark:bg-primary/5 rounded-lg">
                                <button className="flex-1 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-white/10 transition-colors">Personal</button>
                                <button className="flex-1 py-2 text-sm font-medium rounded-md bg-white dark:bg-primary text-slate-900 dark:text-background-dark shadow-sm">Joint</button>
                            </div>
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
                        <button className="w-full bg-primary text-background-dark font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(19,236,164,0.39)] hover:brightness-110 active:scale-[0.98] transition-all">
                            Save Changes
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 text-rose-500 font-medium py-4 rounded-xl hover:bg-rose-500/10 transition-colors">
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
