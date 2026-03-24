import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import type { TaxCalculationResult } from '@/models/TaxCalculationResult';

export function IncomePage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Person 1';
    const p2Name = profile?.partner2Name || 'Person 2';

    const {
        p1Incomes, p2Incomes,
        p1TaxResult, p2TaxResult,
        p1TotalIncome: p1Total, p2TotalIncome: p2Total,
        combinedNet
    } = useTaxCalculations();

    const totalInterest = p1Incomes.interest + p2Incomes.interest;
    const p1InterestPct = totalInterest > 0 ? Math.round((p1Incomes.interest / totalInterest) * 100) : 50;
    const p2InterestPct = totalInterest > 0 ? 100 - p1InterestPct : 50;

    const totalDividends = p1Incomes.dividends + p2Incomes.dividends;
    const p1DividendsPct = totalDividends > 0 ? Math.round((p1Incomes.dividends / totalDividends) * 100) : 50;
    const p2DividendsPct = totalDividends > 0 ? 100 - p1DividendsPct : 50;

    const formatCurr = (v: number) => `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
    const formatCurrK = (v: number) => `£${(v / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })}k`;

    const renderTaxBar = (name: string, income: number, taxResult: TaxCalculationResult | null, isPrimary: boolean) => {
        const pa = taxResult?.personalAllowance || 12570;
        const brb = taxResult?.brbExtended || 50270;

        // Scale to a reasonable max, e.g. 150k or income if higher
        const maxScale = Math.max(150000, income, brb + 20000);

        const paWidth = (Math.min(income, pa) / maxScale) * 100;
        const basicInc = Math.max(0, Math.min(income - pa, brb - pa));
        const basicWidth = (basicInc / maxScale) * 100;
        const higherInc = Math.max(0, income - brb);
        const higherWidth = (higherInc / maxScale) * 100;

        return (
            <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isPrimary ? 'bg-primary/20 text-primary' : 'bg-primary text-background-dark'}`}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold">{name}</span>
                </div>
                <div className="space-y-1">
                    <div className="relative h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                        {paWidth > 0 && <div className="h-full bg-primary/30 border-r border-slate-900/10 dark:border-white/10" style={{ width: `${paWidth}%` }} title="Personal Allowance"></div>}
                        {basicWidth > 0 && <div className="h-full bg-primary border-r border-slate-900/10 dark:border-white/10" style={{ width: `${basicWidth}%` }} title="Basic Rate"></div>}
                        {higherWidth > 0 && <div className="h-full bg-primary/80" style={{ width: `${higherWidth}%` }} title="Higher Rate"></div>}
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                        <span>{formatCurrK(pa)} PA</span>
                        <span>{formatCurrK(brb)} Basic</span>
                        <span>Higher</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout
            header={
                <Header
                    title="Incomes"
                    subtitle="Income Overview"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="analytics" className="text-2xl" />
                        </div>
                    }
                    rightElement={<MainHeaderActions showSaveButton />}
                />
            }
        >
            <div className="mx-auto p-4 space-y-6">
                {/* Detailed Breakdown */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40">Detailed Breakdown</h2>
                        <Link to="/income-edit" className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-primary/10">
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
                                    <td className="px-4 py-4 text-right">{formatCurr(p1Incomes.employment + p1Incomes.pension)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p2Incomes.employment + p2Incomes.pension)}</td>
                                </tr>

                                <tr>
                                    <td className="px-4 py-4 font-medium">Property Income (Calculated)</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(p1Incomes.propertyIncome)}</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(p2Incomes.propertyIncome)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Property Expenses</td>
                                    <td className="px-4 py-4 text-right text-red-500 font-bold">{formatCurr(p1Incomes.propertyExpense)}</td>
                                    <td className="px-4 py-4 text-right text-red-500 font-bold">{formatCurr(p2Incomes.propertyExpense)}</td>
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
                                <tr className="border-t border-slate-200 dark:border-primary/10">
                                    <td className="px-4 py-4 text-red-500">Total Tax</td>
                                    <td className="px-4 py-4 text-right text-red-500">{formatCurr(p1TaxResult?.totalTax || 0)}</td>
                                    <td className="px-4 py-4 text-right text-red-500">{formatCurr(p2TaxResult?.totalTax || 0)}</td>
                                </tr>
                                <tr className="border-t border-slate-200 dark:border-primary/10">
                                    <td className="px-4 py-4 text-primary">Combined Net</td>
                                    <td colSpan={2} className="px-4 py-4 text-right text-primary text-lg">{formatCurr(combinedNet)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                {/* Income Allocation Sliders */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40 px-1">Income Allocation</h2>
                    <div className="space-y-6 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5">

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
                        {renderTaxBar(p1Name, p1Total, p1TaxResult, true)}
                        {renderTaxBar(p2Name, p2Total, p2TaxResult, false)}
                    </div>
                </section>

            </div>
        </AppLayout>
    );
}
