import type { Account, Budget, Profile, Transaction } from '@/lib/db';

export interface DashboardBudgetItem {
    budget: Budget;
    budgetTransactions: Transaction[];
    budgetTotalSpent: number;
    budgetTarget: number;
    budgetRemaining: number;
}

export interface DashboardAccountData {
    account: Account;
    accountBudgets: Budget[];
    budgetItems: DashboardBudgetItem[];
    accountTotalAllocated: number;
    accountMonthlyAllocated: number;
    isOnlyAnnual: boolean;
    totalSpent: number;
}

export interface DashboardSummary {
    sortedAccounts: Account[];
    accountsData: DashboardAccountData[];
    totalMonthlyAllocated: number;
}

export function getProfileCombinedName(profile?: Profile | null): string {
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';
    return profile?.name || `${p1Name} & ${p2Name}`;
}

export function formatDashboardCurrency(amount: number): string {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDashboardAmount(amount: number): string {
    return amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getBudgetIconName(name: string): string {
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
}

export function getBudgetsForAccount(budgets: Budget[], accountId: string): Budget[] {
    return budgets.filter(b => b.accountId === accountId);
}

export function getTransactionsForBudget(
    transactions: Transaction[],
    budgetId: string,
    frequency?: string,
    referenceDate: Date = new Date()
): Transaction[] {
    const currentMonth = referenceDate.getMonth();
    const currentYear = referenceDate.getFullYear();

    return transactions
        .filter(t => {
            if (t.type !== 'expense') return false;
            if (t.budgetId !== budgetId) return false;
            const d = new Date(t.date);
            if (frequency === 'annual') {
                return d.getFullYear() === currentYear;
            }
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function buildDashboardSummary(
    accounts: Account[],
    budgets: Budget[],
    transactions: Transaction[],
    referenceDate: Date = new Date()
): DashboardSummary {
    const sortedAccounts = [...accounts]
        .filter(account => budgets.some(b => b.accountId === account.id))
        .sort((a, b) => {
            const orderA = a.budgetOrder ?? 9999;
            const orderB = b.budgetOrder ?? 9999;
            return orderA - orderB;
        });

    const accountsData: DashboardAccountData[] = sortedAccounts.map(account => {
        const accountBudgets = getBudgetsForAccount(budgets, account.id);
        const accountTotalAllocated = accountBudgets
            .filter(budget => !budget.oneOffBudget)
            .reduce((sum, budget) => sum + budget.amount, 0);
        const accountMonthlyAllocated = accountBudgets
            .filter(budget => !budget.oneOffBudget)
            .reduce((sum, budget) => {
                const monthlyValue = budget.frequency === 'annual' ? budget.amount / 12 : budget.amount;
                return sum + monthlyValue;
            }, 0);
        const isOnlyAnnual = accountBudgets.length > 0 && accountBudgets.every(budget => budget.frequency === 'annual');

        let totalSpent = 0;
        const budgetItems: DashboardBudgetItem[] = accountBudgets.map(budget => {
            const budgetTransactions = getTransactionsForBudget(transactions, budget.id, budget.frequency, referenceDate);
            const budgetTotalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
            totalSpent += budgetTotalSpent;
            const budgetTarget = budget.amount;
            return {
                budget,
                budgetTransactions,
                budgetTotalSpent,
                budgetTarget,
                budgetRemaining: budgetTarget - budgetTotalSpent
            };
        });

        return {
            account,
            accountBudgets,
            budgetItems,
            accountTotalAllocated,
            accountMonthlyAllocated,
            isOnlyAnnual,
            totalSpent
        };
    });

    const totalMonthlyAllocated = budgets
        .filter(budget => !budget.oneOffBudget)
        .reduce((sum, budget) => {
            const monthlyValue = budget.frequency === 'annual' ? budget.amount / 12 : budget.amount;
            return sum + monthlyValue;
        }, 0);

    return {
        sortedAccounts,
        accountsData,
        totalMonthlyAllocated
    };
}
