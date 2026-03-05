import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Icon } from '../components/ui/Icon';

export function AddBudgetPage() {
    const navigate = useNavigate();

    return (
        <AppLayout hideBottomNav>
            <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-2xl flex flex-col relative w-full overflow-x-hidden">
                {/* Top Navigation */}
                <div className="flex items-center p-4 border-b border-slate-200 dark:border-primary/10 sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors"
                    >
                        <Icon name="arrow_back" className="text-slate-700 dark:text-primary" />
                    </button>
                    <h1 className="text-xl font-bold ml-2 flex-1 text-slate-900 dark:text-slate-100">Add Budget Item</h1>
                    <button className="p-2 text-primary font-bold text-sm uppercase tracking-wider hover:opacity-80 transition-opacity">
                        Save
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                        <div className="relative">
                            <select defaultValue="" className="w-full appearance-none rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 pr-10 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                                <option disabled value="">Select a category</option>
                                <option value="housing">Housing</option>
                                <option value="utilities">Utilities</option>
                                <option value="transport">Transport</option>
                                <option value="groceries">Groceries</option>
                                <option value="leisure">Leisure &amp; Lifestyle</option>
                            </select>
                            <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                    </div>

                    {/* Sub-category */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Sub-category name</label>
                        <input
                            className="w-full rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                            placeholder="e.g. Weekly Food Shop"
                            type="text"
                        />
                    </div>

                    {/* Amount & Frequency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Amount (£)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                                <input
                                    className="w-full rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 pl-8 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="0.00"
                                    step="0.01"
                                    type="number"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Frequency</label>
                            <div className="flex p-1 bg-slate-200 dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10">
                                <button className="flex-1 py-3 text-xs font-bold rounded-lg bg-primary text-background-dark shadow-sm">Monthly</button>
                                <button className="flex-1 py-3 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white/10 transition-colors">Annual</button>
                            </div>
                        </div>
                    </div>

                    {/* Calculated Summary Card */}
                    <div className="bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Annualised Equivalent</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-primary">£0.00</p>
                        </div>
                        <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="analytics" className="text-2xl" />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Location</label>
                        <div className="relative">
                            <select name="paymentSource" defaultValue="" className="w-full appearance-none rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 pr-10 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                                <option disabled value="">Select a location</option>
                                <option value="Groceries / Incidentals">Groceries / Incidentals</option>
                                <option value="Monthly Bills">Monthly Bills</option>
                                <option value="Annual Bills">Annual Bills</option>
                            </select>
                            <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-4 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-primary/10 sticky bottom-0">
                    <button className="w-full py-4 bg-primary text-background-dark font-bold rounded-xl shadow-[0_4px_14px_0_rgba(19,236,164,0.39)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all">
                        <Icon name="add_circle" className="text-xl" />
                        Add Budget Item
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
