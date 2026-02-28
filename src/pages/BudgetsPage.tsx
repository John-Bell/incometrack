import { AppLayout } from '../components/layout/AppLayout';
import { Icon } from '../components/ui/Icon';

export function BudgetsPage() {
    return (
        <AppLayout
            header={
                <div className="flex items-center p-4 justify-between border-b border-slate-200 dark:border-primary/10">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary cursor-pointer">
                        <Icon name="settings" className="text-xl" />
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Tax Optimizer</h2>
                    <div className="flex w-10 items-center justify-end">
                        <button className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-primary text-[#10221c] hover:brightness-110 active:scale-95 transition-all">
                            <Icon name="download" className="text-xl" />
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-6 pt-4 pb-6">
                {/* Combined Household Budget Summary */}
                <div className="px-4">
                    <div className="flex flex-col gap-2 rounded-xl p-6 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Combined Household Budget</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-extrabold leading-tight">$4,500.00</p>
                            <span className="text-primary text-xs font-bold">+5.2% vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Budget vs Actuals Chart */}
                <div className="px-4 py-2">
                    <div className="bg-white dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-primary/5">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Monthly Spending</p>
                                <p className="text-2xl font-bold leading-tight">$3,240 spent</p>
                            </div>
                            <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                                <Icon name="trending_up" className="text-sm" />
                                <p className="text-xs font-bold">12%</p>
                            </div>
                        </div>

                        <div className="flex items-end justify-between h-32 gap-3 px-2">
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="bg-primary/20 rounded-t-sm w-full relative" style={{ height: '60%' }}>
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-t-sm" style={{ height: '80%' }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">Jan</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="bg-primary/20 rounded-t-sm w-full relative" style={{ height: '45%' }}>
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-t-sm" style={{ height: '95%' }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">Feb</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="bg-primary/20 rounded-t-sm w-full relative" style={{ height: '55%' }}>
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-t-sm" style={{ height: '70%' }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">Mar</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="bg-primary/20 rounded-t-sm w-full relative" style={{ height: '85%' }}>
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm" style={{ height: '90%' }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">Apr</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="bg-primary/20 rounded-t-sm w-full relative" style={{ height: '30%' }}>
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-t-sm" style={{ height: '40%' }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">May</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="bg-primary/20 rounded-t-sm w-full relative" style={{ height: '50%' }}>
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-t-sm" style={{ height: '65%' }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">Jun</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Budget Categories Section */}
                <div className="px-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold tracking-tight">Budget Categories</h3>
                        <button className="text-primary text-sm font-semibold hover:opacity-80 transition-opacity">Edit</button>
                    </div>

                    <div className="space-y-4">
                        {/* Category Item: Groceries */}
                        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 p-4 rounded-xl">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                                        <Icon name="shopping_cart" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Groceries</p>
                                        <p className="text-xs text-slate-500">12 transactions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">$640 / $800</p>
                                    <p className="text-xs text-slate-500">80% used</p>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: '80%' }}></div>
                            </div>
                        </div>

                        {/* Category Item: Utilities */}
                        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 p-4 rounded-xl">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                                        <Icon name="bolt" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Utilities</p>
                                        <p className="text-xs text-slate-500">4 transactions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">$210 / $250</p>
                                    <p className="text-xs text-slate-500">84% used</p>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '84%' }}></div>
                            </div>
                        </div>

                        {/* Category Item: Leisure */}
                        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 p-4 rounded-xl">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Icon name="celebration" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Leisure</p>
                                        <p className="text-xs text-slate-500">8 transactions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">$850 / $600</p>
                                    <p className="text-xs text-red-500 font-bold">142% used</p>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        {/* Category Item: Transportation */}
                        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 p-4 rounded-xl">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 flex items-center justify-center rounded-full bg-purple-500/10 text-purple-500">
                                        <Icon name="directions_car" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Transportation</p>
                                        <p className="text-xs text-slate-500">22 transactions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">$320 / $500</p>
                                    <p className="text-xs text-slate-500">64% used</p>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: '64%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
