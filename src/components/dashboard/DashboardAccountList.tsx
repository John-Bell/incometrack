import type { Account, Budget, Transaction } from '@/lib/db';
import { Icon } from '../ui/Icon';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    buildDashboardSummary,
    formatDashboardAmount,
    formatDashboardCurrency,
    getBudgetIconName
} from '@/utils/dashboardUtils';

interface DashboardAccountListProps {
    accounts: Account[];
    budgets: Budget[];
    transactions: Transaction[];
}

export function DashboardAccountList({ accounts, budgets, transactions }: DashboardAccountListProps) {
    const navigate = useNavigate();

    const { sortedAccounts, accountsData, totalMonthlyAllocated } = buildDashboardSummary(
        accounts,
        budgets,
        transactions
    );

    return (
        <div className="w-full max-w-7xl mx-auto pt-4 px-4 pb-24">
            {/* Top Monthly Allocated Card */}
            <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Allocated
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Monthly allocated spending
                    </p>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {formatDashboardCurrency(totalMonthlyAllocated)}
                </div>
            </div>

            {/* Accounts Monthly Allocated Summary */}
            {accountsData.length > 0 && (
                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                        Account Breakdown
                    </h3>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {accountsData.map(({ account, accountMonthlyAllocated }) => (
                            <div
                                key={account.id}
                                className="flex items-center justify-between py-2 first:pt-0 last:pb-0 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate(`/accounts/edit/${account.id}`)}
                            >
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {account.nickname || account.name}
                                    {account.last4Digits && (
                                        <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">
                                            ..{account.last4Digits}
                                        </span>
                                    )}
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {formatDashboardCurrency(accountMonthlyAllocated)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {sortedAccounts.length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                    <Icon name="account_balance" className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p>No accounts configured.</p>
                    <p className="text-sm">Add accounts to see your dashboard.</p>
                </div>
            )}

            {/* Desktop / Tablet Landscape View */}
            <div className="hidden md:block w-full bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-[3fr_1fr_1fr_1fr_100px] gap-4 p-4 border-b border-slate-100 dark:border-slate-800/50 bg-[#F8FAFC] dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <div>ACCOUNT / BUDGET / TRANSACTION</div>
                    <div>DATE</div>
                    <div className="text-right">BUDGETED (£)</div>
                    <div className="text-right">REMAINING (£)</div>
                    <div className="text-right">ACTIONS</div>
                </div>

                {/* Rows */}
                <div className="flex flex-col">
                    {accountsData.map(({ account, budgetItems, accountTotalAllocated, isOnlyAnnual, totalSpent }) => {
                        return (
                            <div key={account.id} className="flex flex-col border-b border-slate-200 dark:border-slate-800 last:border-0">
                                {/* Account Row */}
                                <div className="grid grid-cols-[3fr_1fr_1fr_1fr_100px] gap-4 p-4 items-center bg-[#F8FAFC] dark:bg-slate-800/50">
                                    <div
                                        className="font-bold text-slate-900 dark:text-white text-lg cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                                        onClick={() => navigate(`/accounts/edit/${account.id}`)}
                                    >
                                        {account.nickname || account.name} {account.last4Digits && <span className="text-slate-500 dark:text-slate-400 font-normal">..{account.last4Digits}</span>}
                                    </div>
                                    <div></div>
                                    <div className="text-right text-slate-500 dark:text-slate-400 font-medium">
                                        <div>Allocated: {formatDashboardCurrency(accountTotalAllocated)}</div>
                                        {isOnlyAnnual && (
                                            <div className="text-xs text-slate-400 dark:text-slate-500">
                                                Monthly Allocated: {formatDashboardCurrency(accountTotalAllocated / 12)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right font-bold text-slate-900 dark:text-white text-lg">
                                        Total Remaining: {formatDashboardCurrency(accountTotalAllocated - totalSpent)}
                                    </div>
                                    <div></div>
                                </div>

                                {/* Budgets & Transactions */}
                                {budgetItems.map(({ budget, budgetTransactions, budgetTarget, budgetRemaining }) => {
                                    return (
                                        <div key={budget.id} className="flex flex-col border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                            {/* Budget Row */}
                                            <div className="grid grid-cols-[3fr_1fr_1fr_1fr_100px] gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <div className="font-bold text-slate-800 dark:text-slate-200 text-[15px] pl-4 flex items-center gap-2">
                                                    <span>{budget.name}</span>
                                                    {budget.oneOffBudget && (
                                                        <span title="One-off budget" aria-label="One-off budget" className="flex items-center text-amber-500">
                                                            <Icon name="event_upcoming" className="text-base" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div></div>
                                                <div className="text-right text-slate-700 dark:text-slate-300 font-medium">
                                                    {formatDashboardAmount(budgetTarget)}
                                                </div>
                                                <div
                                                    className={cn(
                                                        'text-right font-bold',
                                                        budgetRemaining < 0 ? 'text-red-500' : 'text-[#1DAF61] dark:text-emerald-400'
                                                    )}
                                                >
                                                    {formatDashboardAmount(budgetRemaining)}
                                                </div>
                                                <div className="flex items-center justify-end gap-4 text-slate-400 dark:text-slate-500">
                                                    <div
                                                        className="cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-2 -m-2"
                                                        onClick={() => navigate(`/transactions/add?budgetId=${budget.id}&accountId=${account.id}&from=dashboard`)}
                                                    >
                                                        <Icon name="receipt_long" className="w-5 h-5" />
                                                    </div>
                                                    <div
                                                        className="cursor-pointer hover:text-slate-700 transition-colors p-2 -m-2"
                                                        onClick={() => navigate(`/budgets/edit/${budget.id}`)}
                                                    >
                                                        <Icon name="edit" className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transaction Rows */}
                                            {budgetTransactions.map(transaction => (
                                                <div
                                                    key={transaction.id}
                                                    className="grid grid-cols-[3fr_1fr_1fr_1fr_100px] gap-4 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                                    onClick={() => navigate(`/transactions/edit/${transaction.id}?from=dashboard`)}
                                                >
                                                    <div className="flex items-center gap-2 pl-8 text-slate-500 dark:text-slate-400 text-sm font-medium group-hover:text-primary transition-colors">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                        {transaction.payee}
                                                    </div>
                                                    <div className="text-slate-500 dark:text-slate-400 text-sm">
                                                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-right text-slate-400 dark:text-slate-500">
                                                        —
                                                    </div>
                                                    <div className="text-right text-slate-600 dark:text-slate-300 text-sm">
                                                        {formatDashboardAmount(transaction.amount)}
                                                    </div>
                                                    <div></div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-6">
                {accountsData.map(({ account, budgetItems, accountTotalAllocated, isOnlyAnnual, totalSpent }) => {
                    return (
                        <div key={account.id} className="flex flex-col gap-2">
                            {/* Account Header */}
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => navigate(`/accounts/edit/${account.id}`)}
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {account.nickname || account.name}
                                    </h2>
                                    {account.last4Digits && (
                                        <p className="text-base text-slate-400 dark:text-slate-500 font-normal">
                                            ..{account.last4Digits}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xl font-bold text-[#1DAF61] dark:text-emerald-400">
                                        {formatDashboardCurrency(accountTotalAllocated - totalSpent)}
                                    </span>
                                    {accountTotalAllocated > 0 && (
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            Allocated: {formatDashboardCurrency(accountTotalAllocated)}
                                        </span>
                                    )}
                                    {isOnlyAnnual && (
                                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                            Monthly Allocated: {formatDashboardCurrency(accountTotalAllocated / 12)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Budgets List */}
                            {budgetItems.length > 0 ? (
                                <div className="flex flex-col gap-2 mt-2">
                                    {budgetItems.map(({ budget, budgetTransactions, budgetTarget, budgetRemaining }) => {
                                        return (
                                            <div key={budget.id} className="flex flex-col gap-3 py-2">
                                                {/* Budget Header */}
                                                <div className="flex items-center justify-between border-b border-green-100 dark:border-emerald-900/30 pb-3">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] dark:bg-emerald-900/20 flex items-center justify-center text-[#1DAF61] dark:text-emerald-400">
                                                            <Icon name={budget.icon || getBudgetIconName(budget.name)} className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">{budget.name}</h3>
                                                            {budget.oneOffBudget && (
                                                                <span title="One-off budget" aria-label="One-off budget" className="flex items-center text-amber-500">
                                                                    <Icon name="event_upcoming" className="text-base" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400">
                                                        <div
                                                            className="cursor-pointer p-2 -m-2"
                                                            onClick={() => navigate(`/transactions/add?budgetId=${budget.id}&accountId=${account.id}&from=dashboard`)}
                                                        >
                                                            <Icon name="receipt_long" className="w-6 h-6 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" />
                                                        </div>
                                                        <div
                                                            className="cursor-pointer p-2 -m-2"
                                                            onClick={() => navigate(`/budgets/edit/${budget.id}`)}
                                                        >
                                                            <Icon name="edit" className="w-6 h-6 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Budget Summary Row */}
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Budgeted</span>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatDashboardCurrency(budgetTarget)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Remaining</span>
                                                        <span
                                                            className={cn(
                                                                'text-sm font-bold',
                                                                budgetRemaining < 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'
                                                            )}
                                                        >
                                                            {formatDashboardCurrency(budgetRemaining)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Transactions List */}
                                                {budgetTransactions.length > 0 && (
                                                    <div className="flex flex-col gap-4 mt-2 px-1">
                                                        {budgetTransactions.map(transaction => (
                                                            <div
                                                                key={transaction.id}
                                                                className="flex items-center justify-between cursor-pointer group"
                                                                onClick={() => navigate(`/transactions/edit/${transaction.id}?from=dashboard`)}
                                                            >
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-base font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                                        {transaction.payee}
                                                                    </span>
                                                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                                                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                                    -{formatDashboardCurrency(transaction.amount)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500 italic pl-1 mb-4">No budgets in this account.</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
