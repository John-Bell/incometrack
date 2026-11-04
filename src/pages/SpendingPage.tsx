import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { useSpendingPage } from '@/hooks/useSpendingPage';

export function SpendingPage() {
  const {
    namesLabel,
    currentAccounts,
    selectedAccountId,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedTimeframe,
    setSelectedTimeframe,
    scopedBudgets,
    availableTimeframes,
    hasAnnualBudget,
    selectedBudget,
    selectedAccount,
    spendingData,
    handleAccountChange,
  } = useSpendingPage();

  const filterSubtitle = selectedBudget
    ? `${selectedBudget.name}`
    : selectedAccount
    ? `${selectedAccount.nickname || selectedAccount.name}`
    : 'All Accounts & Budgets';

  return (
    <AppLayout
      header={
        <Header
          title="Spending Analysis"
          subtitle={`${namesLabel} · Spending Trends`}
          rightElement={
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="hidden md:inline">Household</span>
              <Icon name="more_vert" className="text-base text-slate-500" />
            </div>
          }
        />
      }
    >
      <div className="flex flex-col w-full px-4 py-6 pb-24 space-y-6">
        {/* Interactive Header & Filters */}
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Spending
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {namesLabel} · {filterSubtitle}
            </p>
          </div>

          {/* Account Selector Dropdown */}
          <div className="relative w-full">
            <select
              value={selectedAccountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none font-semibold shadow-sm cursor-pointer text-sm"
            >
              <option value="">All Accounts</option>
              {currentAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nickname || account.name}
                  {account.last4Digits ? ` (x${account.last4Digits})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <Icon name="expand_more" className="text-xl" />
            </div>
          </div>

          {/* Budget Selector Dropdown */}
          <div className="relative w-full">
            <select
              value={selectedBudgetId}
              onChange={(e) => setSelectedBudgetId(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none font-semibold shadow-sm cursor-pointer text-sm"
            >
              <option value="">All Budgets</option>
              {[...scopedBudgets]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name}
                  </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <Icon name="expand_more" className="text-xl" />
            </div>
          </div>

          {/* Horizontal Timeframe Selector Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
            {availableTimeframes.map((tf) => {
              const isActive = selectedTimeframe === tf.id || (hasAnnualBudget && tf.id === 'ytd');
              return (
                <button
                  key={tf.id}
                  onClick={() => setSelectedTimeframe(tf.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-900 text-white shadow-sm dark:bg-purple-700'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Spent
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
              £{Math.round(spendingData.totalSpend).toLocaleString('en-GB')}
            </span>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Avg / Month
            </span>
            <span className="text-base sm:text-lg font-bold text-purple-900 dark:text-purple-300 mt-1">
              £{Math.round(spendingData.avgMonthlySpend).toLocaleString('en-GB')}
            </span>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Peak Month
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
              {spendingData.peakAmount > 0 ? (
                <>
                  £{Math.round(spendingData.peakAmount).toLocaleString('en-GB')}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({spendingData.peakMonth})
                  </span>
                </>
              ) : (
                '£0'
              )}
            </span>
          </div>
        </div>

        {/* Spend Graph Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Spend Over Time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filterSubtitle} · {spendingData.barData.length} Months
              </p>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full w-fit">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-900 dark:bg-purple-400"></span>
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Monthly Outgoings
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="relative w-full pt-6 pb-2">
            <div
              className="grid gap-2 sm:gap-4 items-end h-52 w-full pt-4"
              style={{
                gridTemplateColumns: `repeat(${Math.max(spendingData.barData.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              {spendingData.barData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] mb-1 font-medium text-slate-600 dark:text-slate-300">
                    {item.amount}
                  </span>
                  <div
                    className="w-full max-w-[36px] rounded-t-lg transition-all duration-300 bg-purple-900 dark:bg-purple-500 group-hover:opacity-80"
                    style={{ height: `${Math.max(item.heightPct, item.rawAmount > 0 ? 4 : 2)}%` }}
                  ></div>
                  <span className="text-xs mt-2 text-slate-500 dark:text-slate-400 font-medium">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
export default SpendingPage;
