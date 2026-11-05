import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { Link } from 'react-router-dom';
import { useTransactionsPage } from '@/hooks/useTransactionsPage';
import { formatTransactionAmount } from '@/utils/transactionUtils';
import { DateInput } from '@/components/ui/DateInput';

export function TransactionsPage() {
    const {
        selectedAccountId,
        selectedBudgetId,
        startDate,
        endDate,
        searchQuery,
        currentAccounts,
        availableBudgets,
        groupedTransactions,
        budgetsMap,
        handleAccountChange,
        handleBudgetChange,
        handleStartDateChange,
        handleEndDateChange,
        handleSearchQueryChange,
        handleClearFilters,
        handleAddPayment,
        getEditUrl,
    } = useTransactionsPage();

    const hasActiveFilters = Boolean(startDate || endDate || searchQuery);
    const hasTransactions = Object.keys(groupedTransactions).length > 0;

    return (
        <AppLayout
            header={
                <Header
                    title="The Chaser"
                    subtitle="Recent Transactions"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="receipt_long" className="text-2xl" />
                        </div>
                    }
                    rightElement={
                        <MainHeaderActions showSaveButton />
                    }
                />
            }
        >
            <div className="flex flex-col gap-6 px-4 py-6 pb-24">
                <div className="flex flex-col gap-3">
                    {/* Text-based search input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Icon name="search" className="text-xl" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchQueryChange(e.target.value)}
                            placeholder="Search payments..."
                            aria-label="Search payments"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-10 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm font-semibold shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => handleSearchQueryChange('')}
                                aria-label="Clear search"
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                <Icon name="cancel" className="text-lg" />
                            </button>
                        )}
                    </div>

                    {/* Account and Budget Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                            <select
                                value={selectedAccountId}
                                onChange={(e) => handleAccountChange(e.target.value)}
                                aria-label="Filter by account"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none font-semibold shadow-sm text-sm cursor-pointer"
                            >
                                <option value="">All Accounts</option>
                                {currentAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.nickname || account.name}{account.last4Digits ? ` (x${account.last4Digits})` : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                                <Icon name="expand_more" className="text-xl" />
                            </div>
                        </div>

                        <div className="relative">
                            <select
                                value={selectedBudgetId}
                                onChange={(e) => handleBudgetChange(e.target.value)}
                                aria-label="Filter by budget"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none font-semibold shadow-sm text-sm cursor-pointer"
                            >
                                <option value="">All Budgets</option>
                                {availableBudgets.map((budget) => (
                                    <option key={budget.id} value={budget.id}>
                                        {budget.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                                <Icon name="expand_more" className="text-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Date Timeframe Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-10 shrink-0">From</span>
                            <DateInput
                                value={startDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                aria-label="Filter from date"
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors shadow-sm"
                            />
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-10 sm:w-auto shrink-0">To</span>
                            <DateInput
                                value={endDate}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                aria-label="Filter to date"
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors shadow-sm"
                            />
                        </div>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-1"
                            >
                                <Icon name="clear" className="text-sm" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleAddPayment}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-xl shadow-[0_4px_14px_0_rgba(255,184,80,0.39)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer mt-1"
                    >
                        <Icon name="add" className="text-xl" />
                        <span>Add Payment</span>
                    </button>
                </div>

                {!hasTransactions && (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                            <Icon name="search_off" className="text-2xl" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">No Payments Found</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                            {hasActiveFilters || selectedAccountId || selectedBudgetId
                                ? 'No payments match your active filters. Try adjusting your search query, timeframe, or account selection.'
                                : 'No payments have been recorded yet.'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="mt-4 px-4 py-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                                Clear search and date filters
                            </button>
                        )}
                    </div>
                )}

                {Object.entries(groupedTransactions).map(([dateLabel, dailyTransactions]) => (
                    <section key={dateLabel}>
                        <div className="mb-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-primary/60">{dateLabel}</h2>
                        </div>
                        <div className="space-y-1">
                            {dailyTransactions.map((tx) => (
                                <Link
                                    to={getEditUrl(tx.id)}
                                    key={tx.id}
                                    className="group flex items-center gap-4 py-4 hover:bg-primary/5 transition-colors cursor-pointer border-b border-slate-100 dark:border-primary/5"
                                >
                                    <div className="size-12 min-w-[3rem] rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Icon name={tx.icon} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{tx.payee}</h3>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold ${tx.type === 'expense' ? 'text-rose-500 dark:text-rose-400' : 'text-primary'}`}>
                                                    {formatTransactionAmount(tx.amount, tx.type)}
                                                </span>
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors flex-shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                                                    <Icon name="edit" className="text-[18px] text-slate-500 dark:text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{tx.budgetId ? (budgetsMap[tx.budgetId]?.name || 'Uncategorized') : 'Uncategorized'}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </AppLayout>
    );
}
