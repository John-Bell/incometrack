import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { Link } from 'react-router-dom';

export function IncomePage() {
    return (
        <AppLayout
            header={
                <Header
                    title="Tax Breakdown"
                    subtitle="Income Overview"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="analytics" className="text-2xl" />
                        </div>
                    }
                    rightElement={<MainHeaderActions onSave={() => { }} />}
                />
            }
        >
            <div className="mx-auto p-4 space-y-6">
                {/* Summary Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-xl p-3 flex flex-col gap-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-primary/60">Tax Saved</p>
                        <p className="text-lg font-extrabold text-primary">£4,250</p>
                        <p className="text-[10px] text-emerald-500 font-bold">+£120</p>
                    </div>
                    <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-xl p-3 flex flex-col gap-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-primary/60">Combined Net</p>
                        <p className="text-lg font-extrabold">£8,420</p>
                        <p className="text-[10px] text-emerald-500 font-bold">+5.2%</p>
                    </div>
                    <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-xl p-3 flex flex-col gap-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-primary/60">Eff. Rate</p>
                        <p className="text-lg font-extrabold">18.4%</p>
                        <p className="text-[10px] text-rose-500 font-bold">-0.8%</p>
                    </div>
                </div>

                {/* Income Allocation Sliders */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40 px-1">Income Allocation</h2>
                    <div className="space-y-6 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5">
                        {/* Rental Income Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-semibold">Rental Income Split</label>
                                <span className="text-xs font-bold text-primary">20% / 80%</span>
                            </div>
                            <div className="relative h-2 w-full bg-slate-200 dark:bg-primary/20 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-primary/40 w-1/5"></div>
                                <div className="absolute top-0 right-0 h-full bg-primary w-4/5"></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>JOHN (£2k)</span>
                                <span>BILLIE (£8k)</span>
                            </div>
                        </div>

                        {/* Savings Interest Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-semibold">Savings Interest</label>
                                <span className="text-xs font-bold text-primary">50% / 50%</span>
                            </div>
                            <div className="relative h-2 w-full bg-slate-200 dark:bg-primary/20 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-primary/40 w-1/2"></div>
                                <div className="absolute top-0 right-0 h-full bg-primary w-1/2"></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>JOHN (£450)</span>
                                <span>BILLIE (£450)</span>
                            </div>
                        </div>

                        {/* Dividends Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-semibold">Dividends</label>
                                <span className="text-xs font-bold text-primary">0% / 100%</span>
                            </div>
                            <div className="relative h-2 w-full bg-slate-200 dark:bg-primary/20 rounded-full overflow-hidden">
                                <div className="absolute top-0 right-0 h-full bg-primary w-full"></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>JOHN (£0)</span>
                                <span>BILLIE (£5,000)</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tax Band Progress Bars */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40 px-1">Tax Band Utilization</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {/* John's Bar */}
                        <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">J</div>
                                <span className="font-bold">John</span>
                            </div>
                            <div className="space-y-1">
                                <div className="relative h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                                    <div className="h-full bg-primary/30 w-[25%] border-r border-slate-900/10 dark:border-white/10" title="Personal Allowance"></div>
                                    <div className="h-full bg-primary w-[45%] border-r border-slate-900/10 dark:border-white/10" title="Basic Rate"></div>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                                    <span>£12.5k PA</span>
                                    <span>£50.2k Basic</span>
                                    <span>Higher</span>
                                </div>
                            </div>
                        </div>

                        {/* Billie's Bar */}
                        <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background-dark font-bold">B</div>
                                <span className="font-bold">Billie</span>
                            </div>
                            <div className="space-y-1">
                                <div className="relative h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                                    <div className="h-full bg-primary/30 w-[25%] border-r border-slate-900/10 dark:border-white/10"></div>
                                    <div className="h-full bg-primary w-[75%]"></div>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                                    <span>£12.5k PA</span>
                                    <span>£50.2k Basic</span>
                                    <span>Higher</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Detailed Breakdown */}
                <section className="space-y-4 mb-24">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40">Detailed Breakdown</h2>
                        <Link to="/income-config" className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-primary/10">
                            <Icon name="edit" className="text-[20px]" />
                        </Link>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-primary/10">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-primary/10 text-slate-500 dark:text-primary/60">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Source</th>
                                    <th className="px-4 py-3 font-bold text-right">John</th>
                                    <th className="px-4 py-3 font-bold text-right">Billie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-primary/10 bg-white dark:bg-background-dark/50">
                                <tr>
                                    <td className="px-4 py-4 font-medium">Salary / Pension</td>
                                    <td className="px-4 py-4 text-right">£45,000</td>
                                    <td className="px-4 py-4 text-right">£62,000</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Rental Income</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">£2,000</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">£8,000</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Dividends</td>
                                    <td className="px-4 py-4 text-right">£0</td>
                                    <td className="px-4 py-4 text-right">£5,000</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Interest</td>
                                    <td className="px-4 py-4 text-right">£450</td>
                                    <td className="px-4 py-4 text-right">£450</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-primary/5 font-extrabold">
                                <tr>
                                    <td className="px-4 py-4">Total Gross</td>
                                    <td className="px-4 py-4 text-right">£47,450</td>
                                    <td className="px-4 py-4 text-right">£75,450</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
