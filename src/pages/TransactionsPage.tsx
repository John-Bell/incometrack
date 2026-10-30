import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { Link } from 'react-router-dom';
import { useTransactionsPage } from '@/hooks/useTransactionsPage';
import { formatTransactionAmount } from '@/utils/transactionUtils';

export function TransactionsPage() {
    const {
        selectedAccountId,
        selectedBudgetId,
        currentAccounts,
        availableBudgets,
        groupedTransactions,
        budgetsMap,
        handleAccountChange,
        handleBudgetChange,
        handleAddPayment,
        getEditUrl,
    } = useTransactionsPage();

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
            <div className="flex flex-col gap-8 px-4 py-6 pb-24">
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <select
                                value={selectedAccountId}
                                onChange={(e) => handleAccountChange(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none font-semibold shadow-sm"
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
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none font-semibold shadow-sm"
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

                    <button
                        onClick={handleAddPayment}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-xl shadow-[0_4px_14px_0_rgba(255,184,80,0.39)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Icon name="add" className="text-xl" />
                        <span>Add Payment</span>
                    </button>
                </div>

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
