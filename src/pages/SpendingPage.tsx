import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { useSpendingPage } from '@/hooks/useSpendingPage';
import { cn } from '@/lib/utils';

export function SpendingPage() {
  const {
    namesLabel,
    currentAccounts,
    selectedYear,
    handleYearChange,
    availableYears,
    selectedAccountId,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedTimeframe,
    setSelectedTimeframe,
    showStacked,
    setShowStacked,
    canShowStacked,
    effectiveShowStacked,
    selectedMonthIndex,
    setSelectedMonthIndex,
    handleMonthBarClick,
    displayLegendItems,
    selectedMonthBar,
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

  const stackSubtitle =
    spendingData.stackMode === 'account'
      ? 'Stacked by Account'
      : spendingData.stackMode === 'budget'
      ? 'Stacked by Budget'
      : 'Monthly Outgoings';

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

          {/* Year Selector Dropdown */}
          <div className="relative w-full">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              aria-label="Year"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none font-semibold shadow-sm cursor-pointer text-sm"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <Icon name="expand_more" className="text-xl" />
            </div>
          </div>

          {/* Account Selector Dropdown */}
          <div className="relative w-full">
            <select
              value={selectedAccountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              aria-label="Account"
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
              aria-label="Budget"
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

          {/* Show Stacked Checkbox - Hidden when a budget is selected */}
          {canShowStacked && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <div>
                <label
                  htmlFor="showStacked"
                  className="font-semibold text-slate-900 dark:text-white cursor-pointer text-sm block select-none"
                >
                  Show Stacked
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedAccountId
                    ? 'Break down monthly spend by budget'
                    : 'Break down monthly spend by account'}
                </p>
              </div>
              <input
                id="showStacked"
                type="checkbox"
                checked={showStacked}
                onChange={(e) => setShowStacked(e.target.checked)}
                className="w-5 h-5 rounded text-purple-900 focus:ring-purple-500 border-slate-300 dark:border-slate-600 cursor-pointer accent-purple-900 dark:accent-purple-500"
              />
            </div>
          )}

          {/* Horizontal Timeframe Selector Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
            {availableTimeframes.map((tf) => {
              const isActive = selectedTimeframe === tf.id || (hasAnnualBudget && tf.id === 'ytd');
              return (
                <button
                  key={tf.id}
                  onClick={() => setSelectedTimeframe(tf.id)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer select-none',
                    isActive
                      ? 'bg-purple-900 text-white shadow-sm dark:bg-purple-700'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
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
                {stackSubtitle}
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
              {spendingData.barData.map((item, idx) => {
                const isSelectedMonth = selectedMonthIndex === item.monthIndex;
                const isDimmed =
                  effectiveShowStacked &&
                  selectedMonthIndex !== null &&
                  !isSelectedMonth;
                const hasSegments =
                  effectiveShowStacked && item.segments && item.segments.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={
                      effectiveShowStacked
                        ? () => handleMonthBarClick(item.monthIndex)
                        : undefined
                    }
                    className={cn(
                      'flex flex-col items-center h-full justify-end group transition-opacity',
                      effectiveShowStacked && 'cursor-pointer select-none',
                      isDimmed && 'opacity-45 hover:opacity-75'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[10px] mb-1 font-medium text-slate-600 dark:text-slate-300',
                        isSelectedMonth && 'font-bold text-purple-900 dark:text-purple-300'
                      )}
                    >
                      {item.amount}
                    </span>
                    {hasSegments ? (
                      <div
                        className={cn(
                          'w-full max-w-[36px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:opacity-90',
                          isSelectedMonth && 'ring-2 ring-purple-900 dark:ring-purple-400 ring-offset-1 dark:ring-offset-slate-900'
                        )}
                        style={{
                          height: `${Math.max(item.heightPct, item.rawAmount > 0 ? 4 : 2)}%`,
                        }}
                      >
                        {item.segments!.map((seg) => (
                          <div
                            key={seg.id}
                            title={`${seg.label}: ${seg.amount}`}
                            style={{
                              height: `${seg.pctOfBar}%`,
                              backgroundColor: seg.color,
                            }}
                            className="w-full transition-all duration-300"
                          />
                        ))}
                      </div>
                    ) : (
                      <div
                        className="w-full max-w-[36px] rounded-t-lg transition-all duration-300 bg-purple-900 dark:bg-purple-500 group-hover:opacity-80"
                        style={{
                          height: `${Math.max(item.heightPct, item.rawAmount > 0 ? 4 : 2)}%`,
                        }}
                      ></div>
                    )}
                    <span
                      className={cn(
                        'text-xs mt-2 text-slate-500 dark:text-slate-400 font-medium',
                        isSelectedMonth && 'font-bold text-purple-900 dark:text-purple-300 underline underline-offset-4'
                      )}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stacked Legend Under Graph */}
          {effectiveShowStacked && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {spendingData.stackMode === 'account'
                      ? 'Spend by Account'
                      : 'Spend by Budget'}
                    {selectedMonthBar ? ` (${selectedMonthBar.month})` : ''}
                  </h4>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {selectedMonthBar
                      ? `Showing breakdown for ${selectedMonthBar.month} · Tap bar again for full period`
                      : 'Tap any month bar to inspect that month'}
                  </span>
                </div>
                {selectedMonthBar && (
                  <button
                    type="button"
                    onClick={() => setSelectedMonthIndex(null)}
                    className="text-xs font-semibold text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity cursor-pointer select-none"
                  >
                    Show All Months
                  </button>
                )}
              </div>

              {displayLegendItems.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-2 text-center">
                  No spending recorded for this selection.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayLegendItems.map((legend) => (
                    <div
                      key={legend.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: legend.color }}
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {legend.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {legend.formattedAmount}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-10 text-right">
                          {legend.percentage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
export default SpendingPage;

