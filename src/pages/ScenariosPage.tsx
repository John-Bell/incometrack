import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { ScenarioSetup } from '../components/scenarios/ScenarioSetup';
import { FinancialImpactCard } from '../components/scenarios/FinancialImpactCard';
import { useStore } from '@/store/useStore';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';

export function ScenariosPage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    return (
        <AppLayout
            header={
                <Header
                    title="Rebalance Simulator"
                    rightElement={
                        <MainHeaderActions onSave={() => { }} />
                    }
                />
            }
        >
            <div className="p-4 flex flex-col gap-6">
                <ScenarioSetup />

                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon name="insights" className="text-primary text-xl" />
                        <h2 className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wider">Financial Impact</h2>
                    </div>

                    <FinancialImpactCard
                        title="Combined Net Monthly Income"
                        icon="account_balance_wallet"
                        iconBg="bg-blue-500/20"
                        iconColor="text-blue-500 dark:text-blue-400"
                        badgeText="£250/mo"
                        badgeTrend="up"
                        currentValue="£4,200"
                        projectedValue="£4,450"
                    />

                    <FinancialImpactCard
                        title="Total Tax Liability (Yearly)"
                        icon="receipt_long"
                        iconBg="bg-red-500/20"
                        iconColor="text-red-500 dark:text-red-400"
                        badgeText="£1,200/yr"
                        badgeTrend="down"
                        currentValue="£6,000"
                        projectedValue="£4,800"
                    />

                    <div className="bg-gray-50 dark:bg-surface-dark border border-gray-100 dark:border-[#2a3833] rounded-xl px-4 py-3 flex items-start gap-2">
                        <Icon name="info" className="text-slate-400 text-[18px] mt-0.5" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                            {p2Name} is a Basic Rate taxpayer, while {p1Name} is a Higher Rate taxpayer. Moving savings interest to {p2Name} avoids the 40% tax trap.
                        </p>
                    </div>
                </section>

                <div className="h-4"></div>
            </div>

            <div className="fixed bottom-[88px] left-0 right-0 px-4 z-40 max-w-md mx-auto w-full pointer-events-none">
                <Button className="w-full py-4 pointer-events-auto shadow-lg shadow-primary/20 text-base">
                    Apply Rebalance Strategy
                    <Icon name="arrow_forward" />
                </Button>
            </div>
        </AppLayout>
    );
}
