import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { useStore } from '@/store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

interface AccountScopeData {
  id: string;
  label: string;
  baselineCap: string;
  barData: { month: string; amount: string; heightPct: number; exceeded: boolean }[];
  underCount: number;
  exceededCount: number;
  categories: {
    name: string;
    icon: string;
    cap: string;
    statusText: string;
    isError: boolean;
    avgSpend: string;
    peakMonth: string;
    peakAmount: string;
    months: { name: string; isError: boolean }[];
    proposalIcon: string;
    proposalText: string;
    actionLabel: string;
    actionIsLocked?: boolean;
  }[];
}

const ACCOUNTS_DATA: Record<string, AccountScopeData> = {
  acc_2: {
    id: 'acc_2',
    label: 'Joint Household (acc_2) [Monthly]',
    baselineCap: '£2,710/mo',
    underCount: 3,
    exceededCount: 3,
    barData: [
      { month: 'May', amount: '£2.58k', heightPct: 75, exceeded: false },
      { month: 'Jun', amount: '£2.69k', heightPct: 80, exceeded: false },
      { month: 'Jul', amount: '£2.82k', heightPct: 86, exceeded: true },
      { month: 'Aug', amount: '£2.91k', heightPct: 94, exceeded: true },
      { month: 'Sep', amount: '£2.64k', heightPct: 77, exceeded: false },
      { month: 'Oct', amount: '£2.77k', heightPct: 84, exceeded: true },
    ],
    categories: [
      {
        name: 'Utilities & High-Speed Comms',
        icon: 'bolt',
        cap: '£380/mo',
        statusText: 'Breached: 4 of last 6 months',
        isError: true,
        avgSpend: '£415/mo',
        peakMonth: 'August',
        peakAmount: '£460',
        months: [
          { name: 'May', isError: false },
          { name: 'Jun', isError: false },
          { name: 'Jul', isError: true },
          { name: 'Aug', isError: true },
          { name: 'Sep', isError: true },
          { name: 'Oct', isError: true },
        ],
        proposalIcon: 'trending_up',
        proposalText: 'Under-budgeted by £35/mo · Suggest adjusting cap to £415/mo',
        actionLabel: 'Tune',
      },
      {
        name: 'Family & Transport',
        icon: 'directions_car',
        cap: '£480/mo',
        statusText: 'Always within budget',
        isError: false,
        avgSpend: '£390/mo',
        peakMonth: 'July',
        peakAmount: '£420',
        months: [
          { name: 'May', isError: false },
          { name: 'Jun', isError: false },
          { name: 'Jul', isError: false },
          { name: 'Aug', isError: false },
          { name: 'Sep', isError: false },
          { name: 'Oct', isError: false },
        ],
        proposalIcon: 'check_circle',
        proposalText: 'Unused cushion: £90/mo · Safe to trim cap to £420/mo',
        actionLabel: 'Trim',
      },
      {
        name: 'Mortgage & Rates',
        icon: 'home',
        cap: '£1,850/mo',
        statusText: '100% Fixed / On Target',
        isError: false,
        avgSpend: '£1,850/mo',
        peakMonth: 'Stable',
        peakAmount: '£1,850',
        months: [
          { name: 'May', isError: false },
          { name: 'Jun', isError: false },
          { name: 'Jul', isError: false },
          { name: 'Aug', isError: false },
          { name: 'Sep', isError: false },
          { name: 'Oct', isError: false },
        ],
        proposalIcon: 'lock',
        proposalText: 'Zero variance · Maintain current £1,850/mo cap',
        actionLabel: 'Locked',
        actionIsLocked: true,
      },
    ],
  },
  acc_1: {
    id: 'acc_1',
    label: 'Current & Discretionary (acc_1) [Monthly]',
    baselineCap: '£1,420/mo',
    underCount: 5,
    exceededCount: 1,
    barData: [
      { month: 'May', amount: '£1.20k', heightPct: 65, exceeded: false },
      { month: 'Jun', amount: '£1.31k', heightPct: 72, exceeded: false },
      { month: 'Jul', amount: '£1.48k', heightPct: 88, exceeded: true },
      { month: 'Aug', amount: '£1.25k', heightPct: 68, exceeded: false },
      { month: 'Sep', amount: '£1.18k', heightPct: 62, exceeded: false },
      { month: 'Oct', amount: '£1.26k', heightPct: 69, exceeded: false },
    ],
    categories: [
      {
        name: 'Groceries & Household Goods',
        icon: 'shopping_bag',
        cap: '£650/mo',
        statusText: '100% within budget',
        isError: false,
        avgSpend: '£540/mo',
        peakMonth: 'June',
        peakAmount: '£610',
        months: [
          { name: 'May', isError: false },
          { name: 'Jun', isError: false },
          { name: 'Jul', isError: false },
          { name: 'Aug', isError: false },
          { name: 'Sep', isError: false },
          { name: 'Oct', isError: false },
        ],
        proposalIcon: 'check_circle',
        proposalText: '£110 remaining cushion · Safe to keep cap at £650/mo',
        actionLabel: 'Keep',
      },
      {
        name: 'Dining & Social',
        icon: 'restaurant',
        cap: '£550/mo',
        statusText: 'Breached: 2 of last 6 months',
        isError: true,
        avgSpend: '£610/mo',
        peakMonth: 'July',
        peakAmount: '£670',
        months: [
          { name: 'May', isError: false },
          { name: 'Jun', isError: false },
          { name: 'Jul', isError: true },
          { name: 'Aug', isError: false },
          { name: 'Sep', isError: false },
          { name: 'Oct', isError: true },
        ],
        proposalIcon: 'trending_up',
        proposalText: 'Under-budgeted by £60/mo · Suggest adjusting cap to £600/mo',
        actionLabel: 'Tune',
      },
    ],
  },
  all: {
    id: 'all',
    label: 'All Accounts Combined [Aggregate]',
    baselineCap: '£4,130/mo',
    underCount: 4,
    exceededCount: 2,
    barData: [
      { month: 'May', amount: '£3.78k', heightPct: 70, exceeded: false },
      { month: 'Jun', amount: '£4.00k', heightPct: 76, exceeded: false },
      { month: 'Jul', amount: '£4.30k', heightPct: 88, exceeded: true },
      { month: 'Aug', amount: '£4.16k', heightPct: 82, exceeded: true },
      { month: 'Sep', amount: '£3.82k', heightPct: 71, exceeded: false },
      { month: 'Oct', amount: '£4.03k', heightPct: 77, exceeded: false },
    ],
    categories: [
      {
        name: 'Joint Household Caps',
        icon: 'groups',
        cap: '£2,710/mo',
        statusText: '3 of 6 months breached',
        isError: true,
        avgSpend: '£2,735/mo',
        peakMonth: 'August',
        peakAmount: '£2,910',
        months: [
          { name: 'May', isError: false },
          { name: 'Jun', isError: false },
          { name: 'Jul', isError: true },
          { name: 'Aug', isError: true },
          { name: 'Sep', isError: false },
          { name: 'Oct', isError: true },
        ],
        proposalIcon: 'trending_up',
        proposalText: 'Joint caps slightly over by £25/mo aggregate',
        actionLabel: 'Review',
      },
      {
        name: 'Current & Discretionary',
        icon: 'wallet',
        cap: '£1,420/mo',
        statusText: 'Overall healthy',
        isError: false,
        avgSpend: '£1,280/mo',
        peakMonth: 'July',
        peakAmount: '£1,480',
        months: [
          { name: 'May', isError: false },
          { name: 'Jun', isError: false },
          { name: 'Jul', isError: true },
          { name: 'Aug', isError: false },
          { name: 'Sep', isError: false },
          { name: 'Oct', isError: false },
        ],
        proposalIcon: 'check_circle',
        proposalText: 'Unused cushion available across discretionary budgets',
        actionLabel: 'Trim',
      },
    ],
  },
};

export function BudgetReviewPage() {
  const { profile } = useStore();
  const p1Name = profile?.partner1Name || 'Dan';
  const p2Name = profile?.partner2Name || 'Freya';
  const namesLabel = `${p1Name} & ${p2Name}`;

  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const currentAccounts = accounts
    .filter(account => account.category === 'Current Account')
    .sort((a, b) => a.name.localeCompare(b.name));

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('6m');

  const currentData = ACCOUNTS_DATA[selectedAccountId] || ACCOUNTS_DATA.all;

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
              onChange={(e) => setSelectedAccountId(e.target.value)}
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

          {/* Horizontal Timeframe Selector Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
            {[
              { id: '3m', label: 'Last 3 Months' },
              { id: '6m', label: 'Last 6 Months' },
              { id: '9m', label: 'Last 9 Months' },
              { id: '12m', label: 'YTD / 12 Months' },
            ].map((tf) => {
              const isActive = selectedTimeframe === tf.id;
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

        {/* Historical Comparison Graph Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Account Spend vs Budget Cap
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Past 6 Months trajectory · Baseline {currentData.baselineCap}
              </p>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Under Cap ({currentData.underCount})
                </span>
              </div>
              <div className="flex items-center space-x-1.5 bg-red-100 dark:bg-red-950/50 px-2.5 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span className="text-xs text-red-700 dark:text-red-300">
                  Exceeded ({currentData.exceededCount})
                </span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="relative w-full pt-6 pb-2">
            {/* Cap Reference Line Overlay */}
            <div className="absolute left-0 right-0 top-[38%] flex items-center z-10 pointer-events-none">
              <div className="w-full border-t border-dashed border-purple-800 dark:border-purple-400 opacity-60"></div>
              <span className="absolute right-0 -top-3 bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                Cap: {currentData.baselineCap.split('/')[0]}
              </span>
            </div>

            {/* Chart Columns Container */}
            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 w-full pt-4">
              {currentData.barData.map((item, idx) => (
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

        {/* Action Required KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Persistent Overspend Alert */}
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
                    Utilities & Comms
                  </h4>
                </div>
              </div>
              <span className="bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
                Breached 4 of 6 mos
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Consistently exceeding target by an average of{' '}
              <span className="font-bold text-red-600 dark:text-red-400">+£35/mo</span>. Rate review strongly recommended.
            </p>
          </div>

          {/* Excess Slack Available Alert */}
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
                    Family & Transport
                  </h4>
                </div>
              </div>
              <span className="bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm whitespace-nowrap">
                Low 5 of 6 mos
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Under-utilized budget leaving approx{' '}
              <span className="font-bold text-purple-900 dark:text-purple-300">£90/mo unspent</span>. Ready to reallocate into reserves.
            </p>
          </div>
        </div>

        {/* Category Calibration & Tuning List */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Category Calibration & Tuning
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {currentData.categories.length} Budgets Monitored
            </span>
          </div>

          {currentData.categories.map((cat, idx) => (
            <div
              key={idx}
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
                      cat.isError
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
                    {cat.peakAmount}{' '}
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                      ({cat.peakMonth})
                    </span>
                  </span>
                </div>
              </div>

              {/* Month Dot Sequence */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>6-Month Audit Trend</span>
                  <span>
                    {cat.months.filter((m) => m.isError).length > 0
                      ? `${cat.months.filter((m) => m.isError).length} Out of Bounds`
                      : '100% Healthy'}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-center">
                  {cat.months.map((m, mIdx) => (
                    <div key={mIdx} className="flex flex-col items-center py-0.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mb-1 ${
                          m.isError ? 'bg-red-600' : 'bg-purple-900 dark:bg-purple-400'
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
                  disabled={cat.actionIsLocked}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-opacity ${
                    cat.actionIsLocked
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-default'
                      : 'bg-purple-900 text-white dark:bg-purple-700 hover:opacity-90 cursor-pointer'
                  }`}
                >
                  {cat.actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
