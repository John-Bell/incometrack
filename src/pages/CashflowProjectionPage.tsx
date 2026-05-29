import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import LifetimeProjectionChart from '../components/scenarios/LifetimeProjectionChart';
import { FinancialImpactCard } from '../components/scenarios/FinancialImpactCard';
import { useLifetimeProjection } from '../hooks/useLifetimeProjection';

export function CashflowProjectionPage() {
    const { data, isReady } = useLifetimeProjection();

    const currentLiquidAssets = isReady && data.length > 0 ? data[0].liquidAssets : 0;
    const projectedLiquidAssets = isReady && data.length > 0 ? data[data.length - 1].liquidAssets : 0;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);

    return (
        <AppLayout
            header={
                <Header
                    title="Cashflow Projection"
                    subtitle="Lifetime Projection Overview"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="trending_up" className="text-2xl" />
                        </div>
                    }
                />
            }
        >
            <div className="mx-auto p-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40">Projection Chart</h2>
                        </div>
                        <LifetimeProjectionChart />
                    </div>

                    <div className="space-y-6">
                        <FinancialImpactCard
                            title="Terminal Liquid Wealth"
                            icon="account_balance_wallet"
                            iconBg="bg-blue-100 dark:bg-blue-900/30"
                            iconColor="text-blue-600 dark:text-blue-400"
                            badgeText="Lifetime"
                            badgeTrend="up"
                            currentValue={formatCurrency(currentLiquidAssets)}
                            projectedValue={formatCurrency(projectedLiquidAssets)}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
