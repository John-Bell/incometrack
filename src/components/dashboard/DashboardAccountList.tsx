import type { Account, Budget, Transaction } from '@/lib/db';
import { Icon } from '../ui/Icon';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

interface DashboardAccountListProps {
    accounts: Account[];
    budgets: Budget[];
    transactions: Transaction[];
}

export function DashboardAccountList({ accounts, budgets, transactions }: DashboardAccountListProps) {
    const navigate = useNavigate();

    // Sort accounts by budgetOrder
    const sortedAccounts = [...accounts].sort((a, b) => {
        const orderA = a.budgetOrder ?? 9999;
        const orderB = b.budgetOrder ?? 9999;
        return orderA - orderB;
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const getBudgetsForAccount = (accountId: string) => {
        return budgets.filter(b => b.accountId === accountId);
    };

    const getTransactionsForBudget = (budgetId: string) => {
        return transactions.filter(t => {
            if (t.type !== 'expense') return false;
            if (t.budgetId !== budgetId) return false;
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    };

    const formatCurrency = (amount: number) => {
        return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-md mx-auto pt-4 px-4 pb-24">
            {sortedAccounts.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                    <Icon name="account_balance" className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>No accounts configured.</p>
                    <p className="text-sm">Add accounts to see your dashboard.</p>
                </div>
            )}

            {sortedAccounts.map(account => {
                const accountBudgets = getBudgetsForAccount(account.id);
                const accountTotalBalance = account.balance;

                return (
                    <div key={account.id} className="flex flex-col gap-2">
                        {/* Account Header */}
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => navigate(`/accounts/edit/${account.id}`)}
                        >
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                {account.name}
                            </h2>
                            <span className="text-xl font-bold text-slate-900">
                                {formatCurrency(accountTotalBalance)}
                            </span>
                        </div>

                        {/* Budgets List */}
                        {accountBudgets.length > 0 ? (
                            <div className="flex flex-col gap-2 mt-2">
                                {accountBudgets.map(budget => {
                                    const budgetTransactions = getTransactionsForBudget(budget.id);
                                    const budgetTotalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);

                                    // Assuming monthly budget for display
                                    const budgetTarget = budget.frequency === 'annual' ? budget.amount / 12 : budget.amount;
                                    const remaining = budgetTarget - budgetTotalSpent;
                                    const isOverBudget = remaining < 0;

                                    return (
                                        <div key={budget.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                                            {/* Budget Header */}
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => navigate(`/budgets/edit/${budget.id}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                                                        <Icon name="category" className="w-5 h-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{budget.name}</h3>
                                                        <p className="text-xs text-slate-500">
                                                            Target: {formatCurrency(budgetTarget)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={clsx(
                                                        "font-bold text-lg",
                                                        isOverBudget ? "text-red-500" : "text-emerald-500"
                                                    )}>
                                                        {formatCurrency(remaining)}
                                                    </p>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                                        Remaining
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Transactions List */}
                                            {budgetTransactions.length > 0 && (
                                                <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-50">
                                                    {budgetTransactions.map(transaction => (
                                                        <div
                                                            key={transaction.id}
                                                            className="flex items-center justify-between py-1 cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                                                            onClick={() => navigate(`/transactions/edit/${transaction.id}`)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                                    <Icon name="receipt_long" className="w-4 h-4 text-slate-500" />
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-700">
                                                                    {transaction.payee}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-900">
                                                                {formatCurrency(transaction.amount)}
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
                            <p className="text-sm text-slate-400 italic pl-1 mb-4">No budgets in this account.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
