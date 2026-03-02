import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';

export function IncomePage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Person 1';
    const p2Name = profile?.partner2Name || 'Person 2';

    const dbAccounts = useLiveQuery(() => db.accounts.toArray());
    const dbIncomes = useLiveQuery(() => db.incomes.toArray());

    const p1Incomes = { employment: 0, rental: 0, dividends: 0, interest: 0 };
    const p2Incomes = { employment: 0, rental: 0, dividends: 0, interest: 0 };

    if (dbIncomes) {
        dbIncomes.forEach(inc => {
            const amount = inc.frequency === 'monthly' ? inc.amount * 12 : inc.amount;
            const target = inc.ownerId === 'person1' ? p1Incomes : p2Incomes;

            if (inc.type === 'employment' || inc.type === 'pension') target.employment += amount;
            else if (inc.type === 'rental') target.rental += amount;
            else if (inc.type === 'dividends') target.dividends += amount;
        });
    }

    if (dbAccounts) {
        dbAccounts.forEach(acc => {
            const amount = (acc.balance || 0) * ((acc.interestRate || 0) / 100);
            if (acc.ownerId === 'person1') p1Incomes.interest += amount;
            else if (acc.ownerId === 'person2') p2Incomes.interest += amount;
            else if (acc.ownerId === 'joint') {
                p1Incomes.interest += amount / 2;
                p2Incomes.interest += amount / 2;
            }
        });
    }

    const p1Total = p1Incomes.employment + p1Incomes.rental + p1Incomes.dividends + p1Incomes.interest;
    const p2Total = p2Incomes.employment + p2Incomes.rental + p2Incomes.dividends + p2Incomes.interest;

    const totalRental = p1Incomes.rental + p2Incomes.rental;
    const p1RentalPct = totalRental > 0 ? Math.round((p1Incomes.rental / totalRental) * 100) : 50;
    const p2RentalPct = totalRental > 0 ? Math.round((p2Incomes.rental / totalRental) * 100) : 50;

    const totalInterest = p1Incomes.interest + p2Incomes.interest;
    const p1InterestPct = totalInterest > 0 ? Math.round((p1Incomes.interest / totalInterest) * 100) : 50;
    const p2InterestPct = totalInterest > 0 ? Math.round((p2Incomes.interest / totalInterest) * 100) : 50;

    const totalDividends = p1Incomes.dividends + p2Incomes.dividends;
    const p1DividendsPct = totalDividends > 0 ? Math.round((p1Incomes.dividends / totalDividends) * 100) : 50;
    const p2DividendsPct = totalDividends > 0 ? Math.round((p2Incomes.dividends / totalDividends) * 100) : 50;

    const formatCurr = (v: number) => `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
    const formatCurrK = (v: number) => `£${(v / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })}k`;

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
                                <span className="text-xs font-bold text-primary">{p1RentalPct}% / {p2RentalPct}%</span>
                            </div>
                            <div className="relative h-2 w-full bg-slate-200 dark:bg-primary/20 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-primary/40" style={{ width: `${p1RentalPct}%` }}></div>
                                <div className="absolute top-0 right-0 h-full bg-primary" style={{ width: `${p2RentalPct}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                <span>{p1Name} ({formatCurrK(p1Incomes.rental)})</span>
                                <span>{p2Name} ({formatCurrK(p2Incomes.rental)})</span>
                            </div>
                        </div>

                        {/* Savings Interest Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-semibold">Savings Interest</label>
                                <span className="text-xs font-bold text-primary">{p1InterestPct}% / {p2InterestPct}%</span>
                            </div>
                            <div className="relative h-2 w-full bg-slate-200 dark:bg-primary/20 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-primary/40" style={{ width: `${p1InterestPct}%` }}></div>
                                <div className="absolute top-0 right-0 h-full bg-primary" style={{ width: `${p2InterestPct}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                <span>{p1Name} ({formatCurr(p1Incomes.interest)})</span>
                                <span>{p2Name} ({formatCurr(p2Incomes.interest)})</span>
                            </div>
                        </div>

                        {/* Dividends Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-semibold">Dividends</label>
                                <span className="text-xs font-bold text-primary">{p1DividendsPct}% / {p2DividendsPct}%</span>
                            </div>
                            <div className="relative h-2 w-full bg-slate-200 dark:bg-primary/20 rounded-full overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-primary/40" style={{ width: `${p1DividendsPct}%` }}></div>
                                <div className="absolute top-0 right-0 h-full bg-primary" style={{ width: `${p2DividendsPct}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                <span>{p1Name} ({formatCurr(p1Incomes.dividends)})</span>
                                <span>{p2Name} ({formatCurr(p2Incomes.dividends)})</span>
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
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{p1Name.charAt(0).toUpperCase()}</div>
                                <span className="font-bold">{p1Name}</span>
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
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background-dark font-bold">{p2Name.charAt(0).toUpperCase()}</div>
                                <span className="font-bold">{p2Name}</span>
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
                                    <th className="px-4 py-3 font-bold text-right">{p1Name}</th>
                                    <th className="px-4 py-3 font-bold text-right">{p2Name}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-primary/10 bg-white dark:bg-background-dark/50">
                                <tr>
                                    <td className="px-4 py-4 font-medium">Salary / Pension</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p1Incomes.employment)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p2Incomes.employment)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Rental Income</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(p1Incomes.rental)}</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(p2Incomes.rental)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Dividends</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p1Incomes.dividends)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p2Incomes.dividends)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Interest</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p1Incomes.interest)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p2Incomes.interest)}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-primary/5 font-extrabold">
                                <tr>
                                    <td className="px-4 py-4">Total Gross</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p1Total)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p2Total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
