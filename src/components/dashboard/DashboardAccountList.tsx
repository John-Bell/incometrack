import type { Account, Budget, Transaction } from '@/lib/db';
import { Icon } from '../ui/Icon';
import { useNavigate } from 'react-router-dom';

interface DashboardAccountListProps {
    accounts: Account[];
    budgets: Budget[];
    transactions: Transaction[];
}

export function DashboardAccountList({ accounts, budgets, transactions }: DashboardAccountListProps) {
    const navigate = useNavigate();

    // Filter out accounts with no budgets, then sort by budgetOrder
    const sortedAccounts = [...accounts]
        .filter(account => budgets.some(b => b.accountId === account.id))
        .sort((a, b) => {
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
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const formatCurrency = (amount: number) => {
        return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getBudgetIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('hous') || lowerName.includes('mortgage') || lowerName.includes('rent')) return 'home';
        if (lowerName.includes('food') || lowerName.includes('din') || lowerName.includes('groc')) return 'restaurant';
        if (lowerName.includes('util') || lowerName.includes('water') || lowerName.includes('gas') || lowerName.includes('electric')) return 'water_drop';
        if (lowerName.includes('trans') || lowerName.includes('car') || lowerName.includes('auto') || lowerName.includes('fuel')) return 'directions_car';
        if (lowerName.includes('shop') || lowerName.includes('cloth')) return 'shopping_bag';
        if (lowerName.includes('health') || lowerName.includes('med')) return 'medical_services';
        if (lowerName.includes('entert') || lowerName.includes('fun') || lowerName.includes('hobby')) return 'confirmation_number';
        if (lowerName.includes('save') || lowerName.includes('invest')) return 'savings';
        if (lowerName.includes('holiday') || lowerName.includes('travel') || lowerName.includes('vacation')) return 'flight_takeoff';
        return 'category';
    };


    return (
        <div className="w-full max-w-7xl mx-auto pt-4 px-4 pb-24">
            {sortedAccounts.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                    <Icon name="account_balance" className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>No accounts configured.</p>
                    <p className="text-sm">Add accounts to see your dashboard.</p>
                </div>
            )}

            {/* Desktop / Tablet Landscape View */}
            <div className="hidden md:block w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-[3fr_1fr_1fr_1fr_100px] gap-4 p-4 border-b border-slate-100 bg-[#F8FAFC] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <div>ACCOUNT / BUDGET / TRANSACTION</div>
                    <div>DATE</div>
                    <div className="text-right">BUDGETED (£)</div>
                    <div className="text-right">REMAINING (£)</div>
                    <div className="text-right">ACTIONS</div>
                </div>

                {/* Rows */}
                <div className="flex flex-col">
                    {sortedAccounts.map(account => {
                        const accountBudgets = getBudgetsForAccount(account.id);
                        // const accountTotalBalance = account.balance; // Removed unused variable
                        const accountTotalAllocated = accountBudgets.reduce((sum, budget) => {
                            return sum + (budget.frequency === 'annual' ? budget.amount / 12 : budget.amount);
                        }, 0);

                        let totalSpent = 0;
                        accountBudgets.forEach(budget => {
                            const budgetTransactions = getTransactionsForBudget(budget.id);
                            totalSpent += budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
                        });

                        return (
                            <div key={account.id} className="flex flex-col border-b border-slate-200 last:border-0">
                                {/* Account Row */}
                                <div className="grid grid-cols-[3fr_1fr_1fr_1fr_100px] gap-4 p-4 items-center bg-[#F8FAFC]">
                                    <div
                                        className="font-bold text-slate-900 text-lg cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                                        onClick={() => navigate(`/accounts/edit/${account.id}`)}
                                    >
                                        {account.nickname || account.name} {account.last4Digits && <span className="text-slate-500 font-normal">..{account.last4Digits}</span>}
                                    </div>
                                    <div></div>
                                    <div className="text-right text-slate-500 font-medium">
                                        Allocated: {formatCurrency(accountTotalAllocated)}
                                    </div>
                                    <div className="text-right font-bold text-slate-900 text-lg">
                                        Total Remaining: {formatCurrency(accountTotalAllocated - totalSpent)}
                                    </div>
                                    <div></div>
                                </div>

                                {/* Budgets & Transactions */}
                                {accountBudgets.map(budget => {
                                    const budgetTransactions = getTransactionsForBudget(budget.id);
                                    const budgetTotalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
                                    const budgetTarget = budget.frequency === 'annual' ? budget.amount / 12 : budget.amount;

                                    return (
                                        <div key={budget.id} className="flex flex-col border-b border-slate-100 last:border-0">
                                            {/* Budget Row */}
                                            <div className="grid grid-cols-[3fr_1fr_1fr_1fr_100px] gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                                                <div className="font-bold text-slate-800 text-[15px] pl-4">
                                                    {budget.name}
                                                </div>
                                                <div></div>
                                                <div className="text-right text-slate-700 font-medium">
                                                    {budgetTarget.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className={`text-right font-bold ${budgetTarget - budgetTotalSpent < 0 ? 'text-red-500' : 'text-[#1DAF61]'}`}>
                                                    {(budgetTarget - budgetTotalSpent).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="flex items-center justify-end gap-2 text-slate-400">
                                                    <div
                                                        className="cursor-pointer hover:text-slate-700 transition-colors"
                                                        onClick={() => navigate(`/transactions/add?budgetId=${budget.id}&accountId=${account.id}&from=dashboard`)}
                                                    >
                                                        <Icon name="receipt_long" className="w-5 h-5" />
                                                    </div>
                                                    <div
                                                        className="cursor-pointer hover:text-slate-700 transition-colors"
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
                                                    className="grid grid-cols-[3fr_1fr_1fr_1fr_100px] gap-4 p-3 items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                                                    onClick={() => navigate(`/transactions/edit/${transaction.id}?from=dashboard`)}
                                                >
                                                    <div className="flex items-center gap-2 pl-8 text-slate-500 text-sm font-medium group-hover:text-primary transition-colors">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                        {transaction.payee}
                                                    </div>
                                                    <div className="text-slate-500 text-sm">
                                                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-right text-slate-400">
                                                        —
                                                    </div>
                                                    <div className="text-right text-slate-600 text-sm">
                                                        {transaction.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                {sortedAccounts.map(account => {
                    const accountBudgets = getBudgetsForAccount(account.id);
                    const accountTotalBalance = account.balance;
                    const accountTotalAllocated = accountBudgets.reduce((sum, budget) => {
                        return sum + (budget.frequency === 'annual' ? budget.amount / 12 : budget.amount);
                    }, 0);

                    return (
                        <div key={account.id} className="flex flex-col gap-2">
                            {/* Account Header */}
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => navigate(`/accounts/edit/${account.id}`)}
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                        {account.nickname || account.name}
                                    </h2>
                                    {account.last4Digits && (
                                        <p className="text-base text-slate-400 font-normal">
                                            ..{account.last4Digits}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xl font-bold text-[#1DAF61]">
                                        {formatCurrency(accountTotalBalance)}
                                    </span>
                                    {accountTotalAllocated > 0 && (
                                        <span className="text-sm font-medium text-slate-500">
                                            Allocated: {formatCurrency(accountTotalAllocated)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Budgets List */}
                            {accountBudgets.length > 0 ? (
                                <div className="flex flex-col gap-2 mt-2">
                                    {accountBudgets.map(budget => {
                                        const budgetTransactions = getTransactionsForBudget(budget.id);
                                        const budgetTotalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);

                                        // Assuming monthly budget for display
                                        const budgetTarget = budget.frequency === 'annual' ? budget.amount / 12 : budget.amount;

                                        return (
                                            <div key={budget.id} className="flex flex-col gap-3 py-2">
                                                {/* Budget Header */}
                                                <div className="flex items-center justify-between border-b border-green-100 pb-3">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#1DAF61]">
                                                            <Icon name={budget.icon || getBudgetIcon(budget.name)} className="w-6 h-6" />
                                                        </div>
                                                        <h3 className="text-[17px] font-bold text-slate-900">{budget.name}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-slate-500">
                                                        <div
                                                            className="cursor-pointer"
                                                            onClick={() => navigate(`/transactions/add?budgetId=${budget.id}&accountId=${account.id}&from=dashboard`)}
                                                        >
                                                            <Icon name="receipt_long" className="w-6 h-6 hover:text-slate-800 transition-colors" />
                                                        </div>
                                                        <div
                                                            className="cursor-pointer"
                                                            onClick={() => navigate(`/budgets/edit/${budget.id}`)}
                                                        >
                                                            <Icon name="edit" className="w-6 h-6 hover:text-slate-800 transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Budget Summary Row */}
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Budgeted</span>
                                                        <span className="text-sm font-bold text-slate-700">{formatCurrency(budgetTarget)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Remaining</span>
                                                        <span className={`text-sm font-bold ${budgetTarget - budgetTotalSpent < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                                            {formatCurrency(budgetTarget - budgetTotalSpent)}
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
                                                                    <span className="text-base font-medium text-slate-900 group-hover:text-primary transition-colors">
                                                                        {transaction.payee}
                                                                    </span>
                                                                    <span className="text-sm text-slate-500">
                                                                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <span className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                                    -{formatCurrency(transaction.amount)}
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
        </div>
    );

}
