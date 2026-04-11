
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { formatRelativeTime } from '@/lib/utils';
import { calculateTotalSavings, calculateNonPensionSavings, calculateTaxableSavings, calculateTaxableInterest } from '@/services/accountCalculations';
import { calculateProjectedAnnualInterest } from '@/utils/interestCalculations';
import { getTaxYearDates } from '@/constants/taxConstants';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { PortfolioOverview } from '../components/accounts/PortfolioOverview';
import { AccountCard } from '../components/accounts/AccountCard';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { ForecastWidget } from '../components/accounts/ForecastWidget';

export function AccountsPage() {
    const navigate = useNavigate();
    const { profile, activeAccountsTab, setActiveAccountsTab, taxYear } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    const [sortBy, setSortBy] = useState<'rate' | 'name'>('rate');

    const rawAccounts = useLiveQuery(() => db.accounts.toArray()) || [];
    const allAccruals = useLiveQuery(() => db.interestAccruals.toArray()) || [];

    const sortedRawAccounts = [...rawAccounts].sort((a, b) => {
        if (sortBy === 'rate') {
            return (a.interestRate || 0) - (b.interestRate || 0);
        } else {
            return (a.name || '').localeCompare(b.name || '');
        }
    });

    const { startTs, endTs } = getTaxYearDates(taxYear || undefined);

    const mappedAccounts = sortedRawAccounts.map(acc => {
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

        const accountAccruals = allAccruals.filter(a => a.accountId === acc.id);
        const projectedInterestValue = calculateProjectedAnnualInterest(acc, accountAccruals, startTs, endTs);
        const projectedInterest = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(projectedInterestValue);

        return {
            id: acc.id,
            ownerId: acc.ownerId, // used for filtering
            accountIcon,
            iconColor,
            accountName: acc.name,
            nickname: acc.nickname,
            last4Digits: acc.last4Digits,
            category: acc.category,
            ownerTag: acc.ownerId === 'joint' ? 'Joint' : (acc.ownerId === 'person1' ? p1Name : p2Name),
            ownerTagColor,
            balance: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(acc.balance),
            projectedInterest: projectedInterestValue > 0 ? projectedInterest : undefined,
            rate: acc.interestRate === 0 ? undefined : acc.interestRate.toFixed(2) + '%',
            interestPayoutFrequency: acc.interestPayoutFrequency,
            interestPayoutDate: acc.interestPayoutDate,
            updatedAt: formatRelativeTime(acc.updatedAt),
            alertText: acc.alertText,
            alertType: acc.alertType as any,
        };
    });

    const totalSavingsValue = calculateTotalSavings(rawAccounts);
    const formattedTotalSavings = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(totalSavingsValue);

    const nonPensionSavingsValue = calculateNonPensionSavings(rawAccounts);
    const formattedNonPensionSavings = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(nonPensionSavingsValue);

    const taxableSavingsValue = calculateTaxableSavings(rawAccounts);
    const formattedTaxableSavings = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(taxableSavingsValue);

    const filteredAccounts = mappedAccounts.filter(acc => acc.ownerId === activeAccountsTab);

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
                <PortfolioOverview totalSavings={formattedTotalSavings} nonPensionSavings={formattedNonPensionSavings} taxableSavings={formattedTaxableSavings} />

                <div className="my-6">
                    <ForecastWidget />
                </div>

                <button
                    onClick={() => navigate('/accounts/add')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-xl mb-6 shadow-[0_4px_14px_0_rgba(255,184,80,0.39)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    <Icon name="add" className="text-xl" />
                    <span>Add Account</span>
                </button>

                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl mb-4 text-sm font-medium border border-black/5 dark:border-white/5">
                    {['person1', 'person2', 'joint'].map((tab) => {
                        const tabAccounts = rawAccounts.filter(acc => acc.ownerId === tab);
                        const tabTaxableInterest = calculateTaxableInterest(tabAccounts, allAccruals, taxYear || undefined);
                        const formattedTabTaxableInterest = new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }).format(tabTaxableInterest);

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveAccountsTab(tab)}
                                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${activeAccountsTab === tab
                                    ? 'bg-white dark:bg-[#1a2b25] text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-slate-500 dark:text-[#7d998f] hover:text-slate-700 dark:hover:text-[#9db9b0]'
                                    }`}
                            >
                                <div className="font-semibold">{tab === 'joint' ? 'Joint' : (tab === 'person1' ? p1Name : p2Name)}</div>
                                <div className="text-xs font-normal opacity-80 mt-0.5">{formattedTabTaxableInterest}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="px-4 pb-6">
                <div className="flex items-center justify-between mb-4 mt-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Accounts</h2>
                    <button
                        onClick={() => setSortBy(prev => prev === 'rate' ? 'name' : 'rate')}
                        className="text-sm font-medium text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                        Sort by {sortBy === 'rate' ? 'Rate' : 'Name'}
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

        </AppLayout>
    );
}
