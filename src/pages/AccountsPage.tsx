import { useNavigate } from 'react-router-dom';
import { useAccountsPage } from '@/hooks/useAccountsPage';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { PortfolioOverview } from '../components/accounts/PortfolioOverview';
import { AccountCard } from '../components/accounts/AccountCard';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { ForecastWidget } from '../components/accounts/ForecastWidget';

export function AccountsPage() {
    const navigate = useNavigate();
    const {
        sortBy,
        setSortBy,
        activeAccountsTab,
        setActiveAccountsTab,
        startTs,
        endTs,
        formattedTotalSavings,
        formattedNonPensionSavings,
        formattedTaxableSavings,
        tabSummaries,
        filteredAccounts,
    } = useAccountsPage();

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
                        <MainHeaderActions showSaveButton />
                    }
                />
            }
        >
            <div className="px-4 pb-4">
                <PortfolioOverview
                    totalSavings={formattedTotalSavings}
                    nonPensionSavings={formattedNonPensionSavings}
                    taxableSavings={formattedTaxableSavings}
                />

                <div className="my-6">
                    <ForecastWidget startTs={startTs} endTs={endTs} />
                </div>

                <button
                    onClick={() => navigate('/accounts/add')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-xl mb-6 shadow-[0_4px_14px_0_rgba(255,184,80,0.39)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    <Icon name="add" className="text-xl" />
                    <span>Add Account</span>
                </button>

                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl mb-4 text-sm font-medium border border-black/5 dark:border-white/5">
                    {tabSummaries.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveAccountsTab(tab.id)}
                            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                                activeAccountsTab === tab.id
                                    ? 'bg-white dark:bg-[#1a2b25] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-slate-500 dark:text-[#7d998f] hover:text-slate-700 dark:hover:text-[#9db9b0]'
                            }`}
                        >
                            <div className="font-semibold">{tab.label}</div>
                            <div className="text-xs font-normal opacity-80 mt-0.5">
                                {tab.formattedTaxableInterest}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 pb-6">
                <div className="flex items-center justify-between mb-4 mt-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Accounts</h2>
                    <button
                        onClick={() => setSortBy((prev) => (prev === 'rate' ? 'name' : 'rate'))}
                        className="text-sm font-medium text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                        Sort by {sortBy === 'rate' ? 'Rate' : 'Name'}
                        <Icon name="sort" className="text-base" />
                    </button>
                </div>

                <div className="space-y-3 relative">
                    {filteredAccounts.map((account) => (
                        <AccountCard key={account.id} {...account} />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
