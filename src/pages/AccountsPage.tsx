import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { PortfolioOverview } from '../components/accounts/PortfolioOverview';
import { AccountCard } from '../components/accounts/AccountCard';

export function AccountsPage() {
    const navigate = useNavigate();
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    const [selectedTab, setSelectedTab] = useState('joint');

    const rawAccounts = useLiveQuery(() => db.accounts.toArray()) || [];

    const mappedAccounts = rawAccounts.map(acc => {
        let ownerTagColor: 'blue' | 'pink' | 'purple' = 'purple';

        if (acc.ownerId === 'person1') {
            ownerTagColor = 'blue';
        } else if (acc.ownerId === 'person2') {
            ownerTagColor = 'pink';
        }

        const accountIcon = acc.name ? acc.name.charAt(0).toUpperCase() : '?';
        let iconColor: 'red' | 'blue' | 'gray' | 'green' = 'gray';
        if (accountIcon === 'S') iconColor = 'red';
        else if (accountIcon === 'B') iconColor = 'blue';
        else if (accountIcon === 'L') iconColor = 'green';

        return {
            id: acc.id,
            ownerId: acc.ownerId, // used for filtering
            accountIcon,
            iconColor,
            accountName: acc.name,
            ownerTag: acc.ownerId === 'joint' ? 'Joint' : (acc.ownerId === 'person1' ? p1Name : p2Name),
            ownerTagColor,
            balance: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(acc.balance),
            rate: acc.interestRate.toFixed(2) + '%',
            updatedAt: 'Recently', // Keep it simple for now, instead of computing relative time from acc.updatedAt
            alertText: acc.alertText,
            alertType: acc.alertType as any,
        };
    });

    const totalSavingsValue = rawAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const formattedTotalSavings = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0
    }).format(totalSavingsValue);

    const totalInterestValue = rawAccounts.reduce((sum, acc) => sum + (acc.balance * (acc.interestRate / 100)), 0);
    const blendedRateValue = totalSavingsValue > 0 ? (totalInterestValue / totalSavingsValue) * 100 : 0;
    const formattedBlendedRate = `${blendedRateValue.toFixed(2)}%`;

    const filteredAccounts = mappedAccounts.filter(acc => acc.ownerId === selectedTab);

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
                <PortfolioOverview totalSavings={formattedTotalSavings} blendedRate={formattedBlendedRate} trend="up" />
                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl mb-4 text-sm font-medium border border-black/5 dark:border-white/5">
                    {['person1', 'person2', 'joint'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${selectedTab === tab
                                ? 'bg-white dark:bg-[#1a2b25] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-slate-500 dark:text-[#7d998f] hover:text-slate-700 dark:hover:text-[#9db9b0]'
                                }`}
                        >
                            {tab === 'joint' ? 'Joint' : (tab === 'person1' ? p1Name : p2Name)}
                        </button>
                    ))}
                </div>
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
                    {filteredAccounts.map((account) => (
                        <AccountCard
                            key={account.id}
                            {...account}
                        />
                    ))}
                </div>
            </div>

            <button
                onClick={() => navigate('/accounts/add')}
                className="fixed z-30 bottom-24 right-4 w-14 h-14 bg-primary text-black rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform hover:brightness-110"
            >
                <Icon name="add" className="text-3xl" />
            </button>

        </AppLayout>
    );
}
