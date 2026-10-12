import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { useStore } from '@/store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function BudgetReviewPage() {
  const { profile } = useStore();
  const p1Name = profile?.partner1Name || 'Dan';
  const p2Name = profile?.partner2Name || 'Freya';
  const namesLabel = `${p1Name} & ${p2Name}`;

  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const currentAccounts = accounts
    .filter((account) => account.category === 'Current Account')
    .sort((a, b) => a.name.localeCompare(b.name));

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ytd');

  // Filter budgets based on the selected account scope
  const scopedBudgets = selectedAccountId
    ? budgets.filter((b) => b.accountId === selectedAccountId)
    : budgets;

  // Filter budgets based on account scope AND selected budget filter
  const filteredBudgets = selectedBudgetId
    ? scopedBudgets.filter((b) => b.id === selectedBudgetId)
    : scopedBudgets;

  const sortedBudgets = [...filteredBudgets].sort((a, b) => a.name.localeCompare(b.name));

  const handleAccountChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId);
    if (selectedBudgetId) {
      const budget = budgets.find((b) => b.id === selectedBudgetId);
      if (budget && newAccountId && budget.accountId !== newAccountId) {
        setSelectedBudgetId('');
      }
    }
  };

  const hasAnnualBudget = scopedBudgets.some((b) => b.frequency === 'annual');

  const availableTimeframes = hasAnnualBudget
    ? [{ id: 'ytd', label: 'YTD' }]
    : [
        { id: '3m', label: 'Last 3 Months' },
        { id: '6m', label: 'Last 6 Months' },
        { id: '9m', label: 'Last 9 Months' },
        { id: 'ytd', label: 'YTD' },
      ];

  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);

  const isMonthlyBudgetSelected = Boolean(
    selectedBudget && (selectedBudget.frequency === 'monthly' || selectedBudget.frequency === 'month')
  );

  const capAmount = selectedBudget ? Number(selectedBudget.amount) || 0 : 0;

  const getTargetMonths = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const activeTimeframe = (hasAnnualBudget && selectedTimeframe !== 'ytd') ? 'ytd' : selectedTimeframe;

    const targetMonths: { year: number; monthIndex: number; label: string }[] = [];

    if (activeTimeframe === 'ytd') {
      for (let m = 0; m <= currentMonth; m++) {
        const d = new Date(currentYear, m, 1);
        targetMonths.push({
          year: currentYear,
          monthIndex: m,
          label: d.toLocaleString('en-GB', { month: 'short' }),
        });
      }
    } else {
      const count = activeTimeframe === '3m' ? 3 : activeTimeframe === '9m' ? 9 : 6;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        targetMonths.push({
          year: d.getFullYear(),
          monthIndex: d.getMonth(),
          label: d.toLocaleString('en-GB', { month: 'short' }),
        });
      }
    }
    return targetMonths;
  };

  const targetMonths = getTargetMonths();

  const calculateGraphData = () => {
    if (!isMonthlyBudgetSelected || !selectedBudget) {
      return { barData: [], underCount: 0, exceededCount: 0, cap: 0 };
    }

    let underCount = 0;
    let exceededCount = 0;

    const barData = targetMonths.map(({ year, monthIndex, label }) => {
      const monthSpent = transactions
        .filter((t) => {
          if (t.budgetId !== selectedBudget.id) return false;
          if (t.type && t.type !== 'expense') return false;
          const d = new Date(t.date);
          return d.getFullYear() === year && d.getMonth() === monthIndex;
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const exceeded = capAmount > 0 ? monthSpent > capAmount : monthSpent > 0;
      if (exceeded) {
        exceededCount++;
      } else {
        underCount++;
      }

      const heightPct = capAmount > 0
        ? Math.min(100, Math.round((monthSpent / capAmount) * 70))
        : (monthSpent > 0 ? 100 : 0);

      const formattedAmount = monthSpent >= 1000
        ? `£${(monthSpent / 1000).toFixed(2)}k`
        : `£${Math.round(monthSpent)}`;

      return {
        month: label,
        amount: formattedAmount,
        heightPct,
        exceeded,
      };
    });

    return { barData, underCount, exceededCount, cap: capAmount };
  };

  const graphData = calculateGraphData();

  const calculateBudgetAlerts = () => {
    const totalPeriods = targetMonths.length;

    if (totalPeriods === 0 || scopedBudgets.length === 0) {
      return { overspendAlert: null, slackAlert: null };
    }

    const overspendCandidates: {
      budget: typeof scopedBudgets[0];
      breachedCount: number;
      avgExcess: number;
    }[] = [];

    const slackCandidates: {
      budget: typeof scopedBudgets[0];
      slackCount: number;
      avgUnspent: number;
    }[] = [];

    for (const budget of scopedBudgets) {
      const cap = Number(budget.amount) || 0;
      if (cap <= 0) continue;

      let breachedCount = 0;
      let slackCount = 0;
      let totalSpent = 0;
      let breachedExcessTotal = 0;
      let slackUnspentTotal = 0;

      for (const { year, monthIndex } of targetMonths) {
        const monthSpent = transactions
          .filter((t) => {
            if (t.budgetId !== budget.id) return false;
            if (t.type && t.type === 'income') return false;
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === monthIndex;
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        totalSpent += monthSpent;

        if (monthSpent > cap) {
          breachedCount++;
          breachedExcessTotal += (monthSpent - cap);
        }
        if (monthSpent < 0.20 * cap) {
          slackCount++;
          slackUnspentTotal += (cap - monthSpent);
        }
      }

      const avgSpend = totalSpent / totalPeriods;

      if (breachedCount / totalPeriods > 0.10) {
        const avgExcess = avgSpend > cap ? (avgSpend - cap) : (breachedExcessTotal / breachedCount);
        overspendCandidates.push({
          budget,
          breachedCount,
          avgExcess,
        });
      }

      const isMonthly = budget.frequency === 'monthly' || budget.frequency === 'month';

      if (isMonthly && slackCount / totalPeriods > 0.10) {
        const avgUnspent = cap > avgSpend ? (cap - avgSpend) : (slackUnspentTotal / slackCount);
        slackCandidates.push({
          budget,
          slackCount,
          avgUnspent,
        });
      }
    }

    overspendCandidates.sort((a, b) => b.breachedCount - a.breachedCount || b.avgExcess - a.avgExcess);
    slackCandidates.sort((a, b) => b.slackCount - a.slackCount || b.avgUnspent - a.avgUnspent);

    const topOverspend = overspendCandidates[0] || null;
    const filteredSlackCandidates = topOverspend
      ? slackCandidates.filter((c) => c.budget.id !== topOverspend.budget.id)
      : slackCandidates;
    const topSlack = filteredSlackCandidates[0] || null;

    return {
      overspendAlert: topOverspend
        ? {
            budgetName: topOverspend.budget.name,
            breachedCount: topOverspend.breachedCount,
            totalPeriods,
            avgExcess: topOverspend.avgExcess,
          }
        : null,
      slackAlert: topSlack
        ? {
            budgetName: topSlack.budget.name,
            slackCount: topSlack.slackCount,
            totalPeriods,
            avgUnspent: topSlack.avgUnspent,
          }
        : null,
    };
  };

  const { overspendAlert, slackAlert } = calculateBudgetAlerts();

  // Dynamic Category Calibration & Tuning data
  const categoryTuningItems = sortedBudgets.map((budget) => {
    const cap = Number(budget.amount) || 0;
    const isAnnual = budget.frequency === 'annual';
    const isMonthly = budget.frequency === 'monthly' || budget.frequency === 'month';
    const monthlyCap = isAnnual ? cap / 12 : cap;

    let totalSpent = 0;
    let breachedCount = 0;
    let maxSpend = -1;
    let peakMonthLabel = targetMonths[0]?.label || 'Current';

    const monthsData = targetMonths.map(({ year, monthIndex, label }) => {
      const monthSpent = transactions
        .filter((t) => {
          if (t.budgetId !== budget.id) return false;
          if (t.type && t.type === 'income') return false;
          const d = new Date(t.date);
          return d.getFullYear() === year && d.getMonth() === monthIndex;
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      totalSpent += monthSpent;

      if (monthSpent > maxSpend) {
        maxSpend = monthSpent;
        peakMonthLabel = label;
      }

      const isError = monthlyCap > 0 ? monthSpent > monthlyCap : monthSpent > 0;
      if (isError) {
        breachedCount++;
      }

      return {
        name: label,
        isError,
        amount: monthSpent,
      };
    });

    const avgSpend = targetMonths.length > 0 ? totalSpent / targetMonths.length : 0;

    let statusText = 'Always within budget';
    if (breachedCount > 0) {
      statusText = `Breached: ${breachedCount} of last ${targetMonths.length} months`;
    }

    let proposalIcon = 'check_circle';
    let proposalText = `On target · Maintain current £${Math.round(monthlyCap).toLocaleString('en-GB')}/mo cap`;
    let actionLabel = 'Keep';

    if (monthlyCap <= 0) {
      proposalIcon = 'info';
      proposalText = 'No budget cap set';
      actionLabel = 'Set Cap';
    } else if (avgSpend > monthlyCap) {
      const diff = Math.round(avgSpend - monthlyCap);
      const suggestedCap = Math.round(avgSpend);
      proposalIcon = 'trending_up';
      proposalText = `Under-budgeted by £${diff.toLocaleString('en-GB')}/mo · Suggest adjusting cap to £${suggestedCap.toLocaleString('en-GB')}/mo`;
      actionLabel = 'Tune';
    } else if (monthlyCap - avgSpend >= 10) {
      const cushion = Math.round(monthlyCap - avgSpend);
      const suggestedCap = Math.round(avgSpend);
      proposalIcon = 'check_circle';
      proposalText = `Unused cushion: £${cushion.toLocaleString('en-GB')}/mo · Safe to trim cap to £${suggestedCap.toLocaleString('en-GB')}/mo`;
      actionLabel = 'Trim';
    }

    const capText = isAnnual
      ? `£${cap.toLocaleString('en-GB')}/yr (£${Math.round(monthlyCap).toLocaleString('en-GB')}/mo)`
      : `£${cap.toLocaleString('en-GB')}/mo`;

    return {
      id: budget.id,
      name: budget.name,
      icon: budget.icon || 'payments',
      cap: capText,
      statusText,
      isError: breachedCount > 0,
      isMonthly,
      avgSpend: isMonthly ? `£${Math.round(avgSpend).toLocaleString('en-GB')}/mo` : 'N/A',
      peakMonth: peakMonthLabel,
      peakAmount: maxSpend >= 0 ? `£${Math.round(maxSpend).toLocaleString('en-GB')}` : '£0',
      months: monthsData,
      proposalIcon,
      proposalText,
      actionLabel,
    };
  });

  return (
    <AppLayout
      header={
        <Header
          title="Budget vs Actual"
          subtitle={`${namesLabel} · Current Period Matching`}
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
              Budget Tuning
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {namesLabel} · Multi-Month Variance Audit
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

        {/* Historical Comparison Graph Card - Only rendered when a monthly budget is selected */}
        {isMonthlyBudgetSelected && (
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Budget Spend vs Cap
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedBudget?.name} · Baseline £{graphData.cap.toLocaleString('en-GB')}/mo
                </p>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Under Cap ({graphData.underCount})
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 bg-red-100 dark:bg-red-950/50 px-2.5 py-1 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span className="text-xs text-red-700 dark:text-red-300">
                    Exceeded ({graphData.exceededCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="relative w-full pt-6 pb-2">
              {/* Cap Reference Line Overlay */}
              <div className="absolute left-0 right-0 top-[30%] flex items-center z-10 pointer-events-none">
                <div className="w-full border-t border-dashed border-purple-800 dark:border-purple-400 opacity-60"></div>
                <span className="absolute right-0 -top-3 bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  Cap: £{graphData.cap.toLocaleString('en-GB')}
                </span>
              </div>

              {/* Chart Columns Container */}
              <div
                className="grid gap-2 sm:gap-4 items-end h-48 w-full pt-4"
                style={{ gridTemplateColumns: `repeat(${graphData.barData.length}, minmax(0, 1fr))` }}
              >
                {graphData.barData.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span
                      className={`text-[10px] mb-1 font-medium ${
                        item.exceeded ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.amount}
                    </span>
                    <div
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 group-hover:opacity-90 ${
                        item.exceeded ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ height: `${item.heightPct}%` }}
                    ></div>
                    <span
                      className={`text-xs mt-2 ${
                        item.exceeded
                          ? 'text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Required KPI Cards - Only show when no budget is selected */}
        {!selectedBudgetId && (overspendAlert || slackAlert) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Persistent Overspend Alert */}
            {overspendAlert ? (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-4 rounded-xl shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                      <Icon name="warning" className="text-lg" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Persistent Overspend
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {overspendAlert.budgetName}
                      </h4>
                    </div>
                  </div>
                  <span className="bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
                    Breached {overspendAlert.breachedCount} of {overspendAlert.totalPeriods} mos
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Consistently exceeding target by an average of{' '}
                  <span className="font-bold text-red-600 dark:text-red-400">
                    +£{Math.round(overspendAlert.avgExcess)}/mo
                  </span>
                  . Rate review strongly recommended.
                </p>
              </div>
            ) : null}

            {/* Excess Slack Available Alert */}
            {slackAlert ? (
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 p-4 rounded-xl shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-900 text-white flex items-center justify-center shrink-0">
                      <Icon name="savings" className="text-lg" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                        Excess Slack Available
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {slackAlert.budgetName}
                      </h4>
                    </div>
                  </div>
                  <span className="bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
                    Low {slackAlert.slackCount} of {slackAlert.totalPeriods} mos
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Under-utilized budget leaving approx{' '}
                  <span className="font-bold text-purple-900 dark:text-purple-300">
                    £{Math.round(slackAlert.avgUnspent)}/mo unspent
                  </span>
                  . Ready to reallocate into reserves.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Category Calibration & Tuning List */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Category Calibration & Tuning
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {categoryTuningItems.length} Budgets Monitored
            </span>
          </div>

          {categoryTuningItems.length === 0 ? (
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No budgets found for current account/filter criteria.
            </div>
          ) : (
            categoryTuningItems.map((cat) => (
              <div
                key={cat.id}
                className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        cat.isError
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300'
                      }`}
                    >
                      <Icon name={cat.icon} className="text-xl" />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Current Cap: {cat.cap}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      cat.isError
                        ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                        : 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300'
                    }`}
                  >
                    {cat.statusText}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Avg Monthly Spend
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        !cat.isMonthly
                          ? 'text-slate-900 dark:text-white'
                          : cat.isError
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-purple-900 dark:text-purple-300'
                      }`}
                    >
                      {cat.avgSpend}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Peak Month
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {cat.isMonthly ? (
                        <>
                          {cat.peakAmount}{' '}
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                            ({cat.peakMonth})
                          </span>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                </div>

                {/* Month Dot Sequence */}
                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {selectedTimeframe === 'ytd' || (hasAnnualBudget && selectedTimeframe !== 'ytd')
                        ? 'YTD Audit Trend'
                        : `${targetMonths.length}-Month Audit Trend`}
                    </span>
                    <span>
                      {cat.months.filter((m) => m.isError).length > 0
                        ? `${cat.months.filter((m) => m.isError).length} Out of Bounds`
                        : '100% Healthy'}
                    </span>
                  </div>
                  <div
                    className="grid gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-center"
                    style={{ gridTemplateColumns: `repeat(${cat.months.length}, minmax(0, 1fr))` }}
                  >
                    {cat.months.map((m, mIdx) => (
                      <div key={mIdx} className="flex flex-col items-center py-0.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full mb-1 ${
                            m.amount === 0
                              ? 'bg-slate-300 dark:bg-slate-600'
                              : m.isError
                              ? 'bg-red-600'
                              : 'bg-purple-900 dark:bg-purple-400'
                          }`}
                        ></span>
                        <span
                          className={`text-[10px] font-medium ${
                            m.isError
                              ? 'text-red-600 dark:text-red-400 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proposal Action Pill */}
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <Icon
                      name={cat.proposalIcon}
                      className={`text-base shrink-0 ${
                        cat.isError ? 'text-red-600 dark:text-red-400' : 'text-purple-900 dark:text-purple-300'
                      }`}
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      {cat.proposalText}
                    </span>
                  </div>
                  <button
                    className="px-3 py-1 rounded-full text-xs font-semibold shrink-0 bg-purple-900 text-white dark:bg-purple-700 hover:opacity-90 cursor-pointer transition-opacity"
                  >
                    {cat.actionLabel}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
