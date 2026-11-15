import { Fragment } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { useSimulatorPage } from '@/hooks/useIncomePages';
import {
    calculateSliderPercent,
    formatWholeCurrency
} from '@/utils/incomeCalculations';

export function SimulatorPage() {
    const {
        p1Name,
        p2Name,
        effectiveTaxYear,
        availableTaxYears,
        isaSweep,
        isModified,
        p1Incomes,
        p2Incomes,
        p1Total,
        p2Total,
        p1TaxResult,
        p2TaxResult,
        combinedNet,
        propertyBreakdowns,
        p1MovableInterest,
        p2MovableInterest,
        totalMovableInterest,
        movableInterestSliderValue,
        propertySplits,
        setSelectedTaxYear,
        setMovableInterestP1Percent,
        setIsaSweep,
        handlePropertySplitChange,
        handleReset
    } = useSimulatorPage();

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
                    rightElement={
                        <div className="flex items-center gap-2">
                            {isModified && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="text-xs font-bold uppercase tracking-wider"
                                >
                                    <Icon name="restart_alt" className="text-lg" />
                                    Reset
                                </Button>
                            )}
                            <MainHeaderActions showSaveButton />
                        </div>
                    }
                />
            }
        >
            <div className="mx-auto p-4 space-y-6">
                <div className="flex flex-col gap-4 bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-200 dark:border-[#283933] shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Icon name="calendar_today" className="text-slate-500 dark:text-primary/60 text-lg" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tax Year</span>
                        </div>
                        <div className="relative w-full sm:w-48">
                            <select
                                value={effectiveTaxYear}
                                onChange={(e) => setSelectedTaxYear(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#283933] rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                                aria-label="Tax Year"
                            >
                                {availableTaxYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <Icon name="unfold_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                            <Icon name="event" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-[#283933] flex items-center gap-2">
                        <label htmlFor="isa-sweep-checkbox" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                id="isa-sweep-checkbox"
                                type="checkbox"
                                checked={isaSweep}
                                onChange={(e) => setIsaSweep(e.target.checked)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 dark:bg-black/20 cursor-pointer"
                            />
                            <span>ISA sweep</span>
                        </label>
                    </div>
                </div>

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
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p1Incomes.employment)}</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p2Incomes.employment)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Pensions</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p1Incomes.pension)}</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p2Incomes.pension)}</td>
                                </tr>
                                {propertyBreakdowns.length > 0 ? (
                                    propertyBreakdowns.map((prop) => (
                                        <Fragment key={prop.propertyId}>
                                            <tr>
                                                <td className="px-4 py-4 font-medium">{prop.propertyName} Income</td>
                                                <td className="px-4 py-4 text-right text-primary font-bold">{formatWholeCurrency(prop.p1Income)}</td>
                                                <td className="px-4 py-4 text-right text-primary font-bold">{formatWholeCurrency(prop.p2Income)}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-4 font-medium">{prop.propertyName} Expenses</td>
                                                <td className="px-4 py-4 text-right text-red-500 font-bold">{formatWholeCurrency(prop.p1Expense)}</td>
                                                <td className="px-4 py-4 text-right text-red-500 font-bold">{formatWholeCurrency(prop.p2Expense)}</td>
                                            </tr>
                                        </Fragment>
                                    ))
                                ) : (
                                    <>
                                        <tr>
                                            <td className="px-4 py-4 font-medium">Rental Income</td>
                                            <td className="px-4 py-4 text-right text-primary font-bold">{formatWholeCurrency(p1Incomes.propertyIncome)}</td>
                                            <td className="px-4 py-4 text-right text-primary font-bold">{formatWholeCurrency(p2Incomes.propertyIncome)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-4 font-medium">Rental Expenses</td>
                                            <td className="px-4 py-4 text-right text-red-500 font-bold">{formatWholeCurrency(p1Incomes.propertyExpense)}</td>
                                            <td className="px-4 py-4 text-right text-red-500 font-bold">{formatWholeCurrency(p2Incomes.propertyExpense)}</td>
                                        </tr>
                                    </>
                                )}
                                {(p1TaxResult?.propertyAllowanceApplied || p2TaxResult?.propertyAllowanceApplied) && (
                                    <tr className="bg-slate-50/50 dark:bg-primary/5 text-xs text-slate-500 dark:text-primary/60 italic">
                                        <td className="px-4 py-2"></td>
                                        <td className="px-4 py-2 text-right">{p1TaxResult?.propertyAllowanceApplied ? 'Property Allowance Applied' : ''}</td>
                                        <td className="px-4 py-2 text-right">{p2TaxResult?.propertyAllowanceApplied ? 'Property Allowance Applied' : ''}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="px-4 py-4 font-medium">Dividends</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p1Incomes.dividends)}</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p2Incomes.dividends)}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 font-medium">Interest</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p1Incomes.interest)}</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p2Incomes.interest)}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-primary/5 font-extrabold">
                                <tr>
                                    <td className="px-4 py-4">Total Gross</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p1Total)}</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p2Total)}</td>
                                </tr>
                                <tr className="border-t border-slate-200 dark:border-primary/10">
                                    <td className="px-4 py-4 font-medium text-slate-500">Tax</td>
                                    <td className="px-4 py-4 text-right text-red-500 font-bold">{formatWholeCurrency(p1TaxResult?.totalTax || 0)}</td>
                                    <td className="px-4 py-4 text-right text-red-500 font-bold">{formatWholeCurrency(p2TaxResult?.totalTax || 0)}</td>
                                </tr>
                                <tr className="border-t border-slate-200 dark:border-primary/10">
                                    <td className="px-4 py-4 text-primary">Combined Net</td>
                                    <td colSpan={2} className="px-4 py-4 text-right text-primary text-lg">{formatWholeCurrency(combinedNet)}</td>
                                </tr>
                                <tr className="border-t border-slate-200 dark:border-primary/10">
                                    <td className="px-4 py-4 text-red-500">Combined Tax</td>
                                    <td colSpan={2} className="px-4 py-4 text-right text-red-500 font-bold text-lg">{formatWholeCurrency((p1TaxResult?.totalTax || 0) + (p2TaxResult?.totalTax || 0))}</td>
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
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p1MovableInterest)}</td>
                                    <td className="px-4 py-4 text-right">{formatWholeCurrency(p2MovableInterest)}</td>
                                    <td className="px-4 py-4 text-right text-primary font-bold">{formatWholeCurrency(totalMovableInterest)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {totalMovableInterest > 0 && (
                        <div className="bg-slate-50 dark:bg-primary/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Savings Interest</h3>
                                    <p className="text-sm text-slate-500 dark:text-primary/60">Split projected {formatWholeCurrency(totalMovableInterest)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-background-dark flex items-center justify-center text-primary shadow-sm">
                                    <Icon name="savings" className="text-2xl" />
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <div className="space-y-1">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{p1Name}</div>
                                    <div className="text-2xl font-bold text-primary">{formatWholeCurrency(p1MovableInterest)}</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{p2Name}</div>
                                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{formatWholeCurrency(p2MovableInterest)}</div>
                                </div>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={movableInterestSliderValue}
                                onChange={(e) => setMovableInterestP1Percent(Number(e.target.value))}
                                className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-slate-200 dark:[&::-webkit-slider-runnable-track]:bg-primary/20 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:-mt-2"
                            />
                        </div>
                    )}

                    {propertyBreakdowns.length > 0 && propertyBreakdowns.map((prop) => {
                        const totalPropIncome = prop.p1Income + prop.p2Income;
                        const currentValue = calculateSliderPercent(
                            propertySplits[prop.propertyId],
                            prop.p1Income,
                            totalPropIncome
                        );

                        return (
                            <div key={prop.propertyId} className="bg-slate-50 dark:bg-primary/5 rounded-2xl p-6 space-y-4 mt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{prop.propertyName} Income Split</h3>
                                        <p className="text-sm text-slate-500 dark:text-primary/60">Split projected {formatWholeCurrency(totalPropIncome)}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-background-dark flex items-center justify-center text-primary shadow-sm">
                                        <Icon name="home" className="text-2xl" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mb-2">
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{p1Name}</div>
                                        <div className="text-2xl font-bold text-primary">{formatWholeCurrency(prop.p1Income)}</div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{p2Name}</div>
                                        <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{formatWholeCurrency(prop.p2Income)}</div>
                                    </div>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={currentValue}
                                    onChange={(e) => handlePropertySplitChange(prop.propertyId, Number(e.target.value))}
                                    className="w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-slate-200 dark:[&::-webkit-slider-runnable-track]:bg-primary/20 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:-mt-2"
                                />
                            </div>
                        );
                    })}
                </section>
            </div>
        </AppLayout>
    );
}
