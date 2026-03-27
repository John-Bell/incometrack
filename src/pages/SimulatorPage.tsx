import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { useStore } from '@/store/useStore';
import { useSimulatorCalculations } from '@/hooks/useSimulatorCalculations';

export function SimulatorPage() {
    const { profile } = useStore();
    const [movableInterestP1Percent, setMovableInterestP1Percent] = React.useState<number | undefined>();
    const p1Name = profile?.partner1Name || 'Person 1';
    const p2Name = profile?.partner2Name || 'Person 2';

    const {
        p1Incomes, p2Incomes,
        p1TotalIncome: p1Total, p2TotalIncome: p2Total,
        p1TaxResult, p2TaxResult,
        combinedNet,
        propertyBreakdowns,
        p1MovableInterest,
        p2MovableInterest,
        totalMovableInterest
    } = useSimulatorCalculations(movableInterestP1Percent);

    const formatCurr = (v: number) => `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

    return (
        <AppLayout
            header={
                <Header
                    title="Simulator"
                    subtitle="Income & Interest Projection"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="science" className="text-2xl" />
                        </div>
                    }
                    rightElement={<MainHeaderActions showSaveButton />}
                />
            }
        >
            <div className="mx-auto p-4 space-y-6">
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40">Detailed Breakdown</h2>
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
                                {propertyBreakdowns.length > 0 ? (
                                    propertyBreakdowns.map((prop) => (
                                        <React.Fragment key={prop.propertyId}>
                                            <tr>
                                                <td className="px-4 py-4 font-medium">{prop.propertyName} Income</td>
                                                <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(prop.p1Income)}</td>
                                                <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(prop.p2Income)}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-4 font-medium">{prop.propertyName} Expenses</td>
                                                <td className="px-4 py-4 text-right text-red-500 font-bold">{formatCurr(prop.p1Expense)}</td>
                                                <td className="px-4 py-4 text-right text-red-500 font-bold">{formatCurr(prop.p2Expense)}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <>
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
                                    </>
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
                                    <td className="px-4 py-4 font-medium text-slate-500">Tax</td>
                                    <td className="px-4 py-4 text-right text-red-500 font-bold">{formatCurr(p1TaxResult?.totalTax || 0)}</td>
                                    <td className="px-4 py-4 text-right text-red-500 font-bold">{formatCurr(p2TaxResult?.totalTax || 0)}</td>
                                </tr>
                                <tr className="border-t border-slate-200 dark:border-primary/10">
                                    <td className="px-4 py-4 text-primary">Combined Net</td>
                                    <td colSpan={2} className="px-4 py-4 text-right text-primary text-lg">{formatCurr(combinedNet)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40">Movable Interest</h2>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-primary/10">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-primary/10 text-slate-500 dark:text-primary/60">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Source</th>
                                    <th className="px-4 py-3 font-bold text-right">{p1Name}</th>
                                    <th className="px-4 py-3 font-bold text-right">{p2Name}</th>
                                    <th className="px-4 py-3 font-bold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-primary/10 bg-white dark:bg-background-dark/50">
                                <tr>
                                    <td className="px-4 py-4 font-medium">Movable Interest</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p1MovableInterest)}</td>
                                    <td className="px-4 py-4 text-right">{formatCurr(p2MovableInterest)}</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">{formatCurr(totalMovableInterest)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {totalMovableInterest > 0 && (
                        <div className="bg-slate-50 dark:bg-primary/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Savings Interest</h3>
                                    <p className="text-sm text-slate-500 dark:text-primary/60">Split projected {formatCurr(totalMovableInterest)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-background-dark flex items-center justify-center text-primary shadow-sm">
                                    <Icon name="savings" className="text-2xl" />
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <div className="space-y-1">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{p1Name}</div>
                                    <div className="text-2xl font-bold text-primary">{formatCurr(p1MovableInterest)}</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{p2Name}</div>
                                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{formatCurr(p2MovableInterest)}</div>
                                </div>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={movableInterestP1Percent !== undefined ? movableInterestP1Percent : (totalMovableInterest > 0 ? (p1MovableInterest / totalMovableInterest) * 100 : 50)}
                                onChange={(e) => setMovableInterestP1Percent(Number(e.target.value))}
                                className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-slate-200 dark:[&::-webkit-slider-runnable-track]:bg-primary/20 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:-mt-2"
                            />
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
