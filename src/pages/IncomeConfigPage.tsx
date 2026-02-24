import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { TaxBandVisualizer } from '../components/income/TaxBandVisualizer';
import { IncomeInputCard } from '../components/income/IncomeInputCard';
import { useStore } from '@/store/useStore';

export function IncomeConfigPage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    return (
        <AppLayout
            hideBottomNav
            header={
                <Header
                    title="Income Configuration"
                    className="text-center justify-center relative"
                    leftElement={
                        <button className="absolute left-4 flex w-10 h-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            <Icon name="arrow_back" className="text-2xl text-slate-900 dark:text-slate-100" />
                        </button>
                    }
                />
            }
        >
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <Tabs options={[p1Name, p2Name]} selected={p1Name} onValueChange={() => { }} />
            </div>

            <div className="px-4 py-6">
                <TaxBandVisualizer />
            </div>

            <div className="px-4 pb-2">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="account_balance_wallet" className="text-primary text-xl" />
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Non-Savings Income</h3>
                </div>

                <div className="flex flex-col gap-4">
                    <IncomeInputCard label="State / Private Pension" value="11500" />
                    <IncomeInputCard label="Rental Income (Net)" value="12000" />
                    <IncomeInputCard label="Employment / Other" value="21070" />
                </div>
            </div>

            <div className="px-4 py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="pie_chart" className="text-primary text-xl" />
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Dividend Income</h3>
                </div>

                <IncomeInputCard
                    label="Total Dividends"
                    value="0"
                    tooltipText="Dividends are taxed differently but count towards your total income band."
                />

                <p className="mt-3 text-xs text-slate-500 dark:text-[#9db9b0] leading-relaxed">
                    Dividend allowance of £500 is applied automatically. This income sits on top of non-savings income in your tax stack.
                </p>
            </div>

            <div className="h-24"></div>

            <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark pointer-events-none z-30 max-w-md mx-auto">
                <Button className="w-full py-3.5 pointer-events-auto shadow-lg shadow-primary/20 text-lg">
                    <Icon name="check" className="font-bold" />
                    Save & Calculate
                </Button>
            </div>
        </AppLayout>
    );
}
