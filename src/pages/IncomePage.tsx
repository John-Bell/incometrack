import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import type { TaxCalculationResult } from '@/models/TaxCalculationResult';
import { TaxBandVisualizer } from '../components/income/TaxBandVisualizer';

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

    const totalRental = p1Incomes.propertyIncome + p2Incomes.propertyIncome;
    const p1RentalPct = totalRental > 0 ? Math.round((p1Incomes.propertyIncome / totalRental) * 100) : 50;
    const p2RentalPct = totalRental > 0 ? 100 - p1RentalPct : 50;

    const totalInterest = p1Incomes.interest + p2Incomes.interest;
    const p1InterestPct = totalInterest > 0 ? Math.round((p1Incomes.interest / totalInterest) * 100) : 50;
    const p2InterestPct = totalInterest > 0 ? 100 - p1InterestPct : 50;

    const totalDividends = p1Incomes.dividends + p2Incomes.dividends;
    const p1DividendsPct = totalDividends > 0 ? Math.round((p1Incomes.dividends / totalDividends) * 100) : 50;
    const p2DividendsPct = totalDividends > 0 ? 100 - p1DividendsPct : 50;

    const formatCurr = (v: number) => `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
    const formatCurrK = (v: number) => `£${(v / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })}k`;

    const renderTaxBarWrapper = (name: string, income: number, taxResult: TaxCalculationResult | null, isPrimary: boolean) => {
        return (
            <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isPrimary ? 'bg-primary/20 text-primary' : 'bg-primary text-background-dark'}`}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold">{name}</span>
                </div>
                <TaxBandVisualizer totalIncome={income} taxResult={taxResult} />
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
                                    <td className="px-4 py-4 font-medium">Employment</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p1Incomes.employment)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p2Incomes.employment)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Pensions</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p1Incomes.pension)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p2Incomes.pension)}</td>
                                </tr>

                                <tr>
                                    <td className="px-4 py-4 font-medium">Rental Income</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(p1Incomes.propertyIncome)}</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(p2Incomes.propertyIncome)}</td>
                                </tr>

                                <tr>
                                    <td className="px-4 py-4 font-medium">Rental Expenses</td>
                                    <td className="px-4 py-4 text-right text-red-500 font-bold">{formatCurr(p1Incomes.propertyExpense)}</td>
                                    <td className="px-4 py-4 text-right text-red-500 font-bold">{formatCurr(p2Incomes.propertyExpense)}</td>
                                </tr>
                                {(p1TaxResult?.propertyAllowanceApplied || p2TaxResult?.propertyAllowanceApplied) && (
                                    <tr className="bg-slate-50/50 dark:bg-primary/5 text-xs text-slate-500 dark:text-primary/60 italic">
                                        <td className="px-4 py-2"></td>
                                        <td className="px-4 py-2 text-right">{p1TaxResult?.propertyAllowanceApplied ? 'Property Allowance Applied' : ''}</td>
                                        <td className="px-4 py-2 text-right">{p2TaxResult?.propertyAllowanceApplied ? 'Property Allowance Applied' : ''}</td>
                                    </tr>
                                )}
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
                                <span>{p1Name} ({formatCurrK(p1Incomes.propertyIncome)})</span>
                                <span>{p2Name} ({formatCurrK(p2Incomes.propertyIncome)})</span>
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
                        {renderTaxBarWrapper(p1Name, p1Total, p1TaxResult, true)}
                        {renderTaxBarWrapper(p2Name, p2Total, p2TaxResult, false)}
                    </div>
                </section>

            </div>
        </AppLayout>
    );
}
