import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { TaxEfficiencyScore } from '../components/dashboard/TaxEfficiencyScore';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { AllowanceCard } from '../components/dashboard/AllowanceCard';
import { NotificationCard } from '../components/dashboard/NotificationCard';
import { useStore } from '@/store/useStore';

export function DashboardPage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';
    const combinedName = profile?.name || `${p1Name} & ${p2Name}`;

    return (
        <AppLayout
            header={
                <Header
                    subtitle="Good morning,"
                    title={combinedName}
                    rightElement={
                        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 dark:bg-surface-dark text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#2a4038] transition-colors">
                            <Icon name="account_circle" />
                        </button>
                    }
                />
            }
        >
            <div className="p-4 flex flex-col gap-2">
                <TaxEfficiencyScore
                    score={92}
                    trend="up"
                    description="Excellent work. You are currently utilizing <span class='text-primary font-bold'>92%</span> of your combined allowances."
                />

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <SummaryCard
                        icon="savings"
                        iconBgColor="bg-primary/20"
                        iconColor="text-primary"
                        label="Monthly Interest"
                        value="£1,450"
                        trendIcon="arrow_upward"
                        trendText="+2.1%"
                        trendColor="text-primary"
                    />
                    <SummaryCard
                        icon="account_balance"
                        iconBgColor="bg-orange-500/20"
                        iconColor="text-orange-400"
                        label="Est. Tax Owed"
                        value="£0.00"
                        trendIcon="check_circle"
                        trendText="Optimal"
                        trendColor="text-primary"
                        isTrendFill
                    />
                </div>

                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">{combinedName}'s Allowances</h3>
                        <button className="text-primary text-sm font-semibold flex items-center gap-0.5">
                            Details <Icon name="chevron_right" className="text-sm" />
                        </button>
                    </div>

                    <AllowanceCard
                        initials={p1Name.slice(0, 2).toUpperCase()}
                        name={p1Name}
                        taxPayerType="Basic Rate Taxpayer"
                        usedAmount="£800"
                        totalAmount="£1,000"
                        percentage={80}
                        remainingText="£200 remaining"
                    />
                    <AllowanceCard
                        initials={p2Name.slice(0, 2).toUpperCase()}
                        name={p2Name}
                        taxPayerType="Higher Rate Taxpayer"
                        usedAmount="£225"
                        totalAmount="£500"
                        percentage={45}
                        remainingText="£275 remaining"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button variant="primary" className="py-4">
                        <Icon name="add_circle" />
                        <span>Add Account</span>
                    </Button>
                    <Button variant="secondary" className="py-4">
                        <Icon name="science" />
                        <span>Simulate</span>
                    </Button>
                </div>

                <NotificationCard
                    title="Month Ending soon"
                    description="Archive your July data now"
                    icon="archive"
                    buttonText="Close Month"
                    onClick={() => { }}
                />

                <div className="mb-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Insights</h3>
                    <div className="bg-surface-dark/50 rounded-xl p-4 border border-white/5 flex gap-4 items-start">
                        <div className="mt-1 min-w-[24px]">
                            <Icon name="lightbulb" className="text-yellow-500" />
                        </div>
                        <div>
                            <h4 className="text-white font-semibold text-sm mb-1">Optimize {p2Name}'s ISA</h4>
                            <p className="text-slate-400 text-xs leading-relaxed">{p2Name} has £5k remaining in their ISA allowance. Moving cash here could save £120 in potential tax.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
