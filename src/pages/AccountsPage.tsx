import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { Tabs } from '../components/ui/Tabs';
import { PortfolioOverview } from '../components/accounts/PortfolioOverview';
import { AccountCard } from '../components/accounts/AccountCard';
import { useStore } from '@/store/useStore';

export function AccountsPage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    return (
        <AppLayout
            header={
                <Header
                    title="The Chaser"
                    subtitle="Portfolio Overview"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="account_balance_wallet" className="text-2xl" />
                        </div>
                    }
                    rightElement={
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                            <Icon name="notifications" className="text-slate-600 dark:text-[#9db9b0]" />
                        </button>
                    }
                />
            }
        >
            <div className="px-4 pb-4">
                <PortfolioOverview totalSavings="£452,000" blendedRate="4.2%" trend="up" />
                <Tabs
                    options={[p1Name, p2Name, 'Joint']}
                    selected="Joint"
                    onValueChange={() => { }}
                    className="mb-2"
                />
            </div>

            <div className="px-4 pb-6">
                <div className="flex items-center justify-between mb-4 mt-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Accounts</h2>
                    <button className="text-sm font-medium text-primary flex items-center gap-1">
                        Sort by Rate
                        <Icon name="sort" className="text-base" />
                    </button>
                </div>

                <div className="space-y-3 relative">
                    <AccountCard
                        institutionCode="S"
                        institutionColor="red"
                        accountName="Santander eSaver"
                        ownerTag="Joint"
                        ownerTagColor="purple"
                        balance="£85,000"
                        rate="5.20%"
                        updatedAt="2 days ago"
                        alertText="Bonus ends Oct 24"
                        alertType="warning"
                    />

                    <AccountCard
                        institutionCode="B"
                        institutionColor="blue"
                        accountName="Barclays Rainy Day"
                        ownerTag="Spouse A"
                        ownerTagColor="blue"
                        balance="£5,000"
                        rate="5.12%"
                        updatedAt="12 Oct 23"
                    />

                    <AccountCard
                        institutionCode="N"
                        institutionColor="gray"
                        accountName="Nationwide FlexDirect"
                        ownerTag={p2Name}
                        ownerTagColor="pink"
                        balance="£1,500"
                        rate="1.00%"
                        isStale
                        isWarned
                        updatedAt="Today"
                        alertText="Rate dropped"
                        alertType="error"
                    />

                    <AccountCard
                        institutionCode="L"
                        institutionColor="green"
                        accountName="Lloyds Club"
                        ownerTag="Joint"
                        ownerTagColor="purple"
                        balance="£50,000"
                        rate="4.50%"
                        updatedAt="30 Sep 23"
                    />
                </div>
            </div>

            <button className="fixed z-30 bottom-24 right-4 w-14 h-14 bg-primary text-black rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform hover:brightness-110">
                <Icon name="add" className="text-3xl" />
            </button>

        </AppLayout>
    );
}
