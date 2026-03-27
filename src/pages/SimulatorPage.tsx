import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { useStore } from '@/store/useStore';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { calculateProjectedAnnualInterest } from '@/utils/interestCalculations';
import { getTaxYearDates } from '@/constants/taxConstants';

export function SimulatorPage() {
    const { profile, taxYear } = useStore();
    const p1Name = profile?.partner1Name || 'Person 1';
    const p2Name = profile?.partner2Name || 'Person 2';

    const dbAccounts = useLiveQuery(() => db.accounts.toArray());
    const dbInterestAccruals = useLiveQuery(() => db.interestAccruals.toArray());

    const { startTs, endTs } = getTaxYearDates(taxYear || undefined);

    let p1MovableInterest = 0;
    let p2MovableInterest = 0;

    if (dbAccounts) {
        const allAccruals = dbInterestAccruals || [];
        dbAccounts.forEach(acc => {
            // 1. Exclude tax-free accounts
            const taxFreeCategories = ['Cash ISA', 'Shares ISA', 'Premium Bonds', 'DC Pension'];
            if (acc.category && taxFreeCategories.includes(acc.category as string)) {
                return;
            }

            // 2. Exclude accounts with annual or at_maturity payouts, or specific payout dates
            const frequency = acc.interestPayoutFrequency || 'monthly';
            const payoutTs = acc.interestPayoutDate;

            if (frequency === 'annually' || frequency === 'at_maturity' || payoutTs) {
                return;
            }

            const accountAccruals = allAccruals.filter(a => a.accountId === acc.id);
            const amount = calculateProjectedAnnualInterest(acc, accountAccruals, startTs, endTs);

            if (acc.ownerId === 'person1') p1MovableInterest += amount;
            else if (acc.ownerId === 'person2') p2MovableInterest += amount;
            else if (acc.ownerId === 'joint') {
                p1MovableInterest += amount / 2;
                p2MovableInterest += amount / 2;
            }
        });
    }

    const totalMovableInterest = p1MovableInterest + p2MovableInterest;

    const {
        p1Incomes, p2Incomes,
        p1TotalIncome: p1Total, p2TotalIncome: p2Total,
        combinedNet
    } = useTaxCalculations();

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
                </section>
            </div>
        </AppLayout>
    );
}
