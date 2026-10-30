import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { Icon } from '../components/ui/Icon';
import { useBudgetsPage } from '../hooks/useBudgetsPage';

export function BudgetsPage() {
    const navigate = useNavigate();
    const {
        selectedAccountId,
        setSelectedAccountId,
        budgets,
        sortedBudgets,
        budgetAccounts,
        budgetItems,
    } = useBudgetsPage();

    return (
        <AppLayout
            header={
                <div className="flex flex-col w-full">
                    <Header
                        title="The Chaser"
                        subtitle="Budgets"
                        leftElement={
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <Icon name="pie_chart" className="text-2xl" />
                            </div>
                        }
                        rightElement={
                            <MainHeaderActions showSaveButton />
                        }
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-8 px-4 py-6 pb-24">
                <button
                    onClick={() => navigate('/budgets/add')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-xl shadow-[0_4px_14px_0_rgba(255,184,80,0.39)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    <Icon name="add" className="text-xl" />
                    <span>Add Budget</span>
                </button>

                {(sortedBudgets.length > 0 || selectedAccountId) && (
                    <section className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <h2 className="text-lg font-bold text-primary flex items-center gap-2 capitalize">
                                    <Icon name="label" className="text-xl" />
                                    {selectedAccountId ? 'Filtered Budgets' : 'All Budgets'}
                                </h2>
                                <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full sm:hidden">
                                    {sortedBudgets.length} {sortedBudgets.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 justify-between w-full sm:w-auto">
                                <select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary/50 flex-grow sm:flex-grow-0"
                                >
                                    <option value="">All Accounts</option>
                                    {budgetAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.nickname || acc.name}{acc.last4Digits ? ` (x${acc.last4Digits})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full hidden sm:inline-flex">
                                    {sortedBudgets.length} {sortedBudgets.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>
                        </div>

                        {sortedBudgets.length === 0 && selectedAccountId && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon name="filter_list_off" className="text-3xl text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No Budgets Found</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">There are no budgets linked to this account.</p>
                            </div>
                        )}
                        <div className="space-y-3">
                            {budgetItems.map(({ budget, details }) => (
                                <div key={budget.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1 w-full">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <Icon name={budget.icon || "label"} className="text-[#1DAF61] text-lg" />
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{budget.name}</p>
                                                </div>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${details.chipClass}`}>
                                                    {details.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-4 mt-2">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{details.isAnnual ? 'As Monthly' : 'Monthly'}</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">£{details.monthlyAmount.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{details.isAnnual ? 'Annual' : 'Annualised'}</p>
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">£{details.annualAmount.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Starts</p>
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{details.formattedStartDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 ml-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0" onClick={() => navigate(`/budgets/edit/${budget.id}`)}>
                                            <Icon name="edit" className="text-[18px] text-slate-500 dark:text-slate-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{details.isAnnual ? 'Annual Actual' : 'Monthly Actual'}</span>
                                                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">£{details.actualAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                Target: £{details.targetNum.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${details.barColor}`}
                                                style={{ width: `${details.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {budgets.length === 0 && !selectedAccountId && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="account_balance_wallet" className="text-3xl text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No Budgets Yet</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Add your first budget item to start tracking your expenses.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
