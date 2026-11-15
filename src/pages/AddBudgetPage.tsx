import { AppLayout } from '@/components/layout/AppLayout';
import { Icon } from '@/components/ui/Icon';
import { IconPicker } from '@/components/ui/IconPicker';
import { DateInput } from '@/components/ui/DateInput';
import { useBudgetForm } from '@/hooks/useBudgetForm';
import { cn } from '@/lib/utils';

export function AddBudgetPage() {
  const {
    budgetAccounts,
    formData,
    handleChange,
    calculatedAnnual,
    navigate,
    handleSave,
  } = useBudgetForm();

  return (
    <AppLayout hideBottomNav>
      <div className="max-w-md mx-auto min-h-dvh bg-background-light dark:bg-background-dark shadow-2xl flex flex-col relative w-full overflow-x-hidden">
        {/* Top Navigation */}
        <div className="flex items-center p-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-slate-200 dark:border-primary/10 sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors"
          >
            <Icon name="arrow_back" className="text-slate-700 dark:text-primary" />
          </button>
          <h1 className="text-xl font-bold ml-2 flex-1 text-slate-900 dark:text-slate-100">
            Add Budget Item
          </h1>
          <button
            onClick={handleSave}
            className="p-2 text-primary font-bold text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Sub-category (Name) */}
          <div className="space-y-2">
            <label
              htmlFor="budgetName"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Budget name
            </label>
            <input
              id="budgetName"
              className="w-full min-w-0 max-w-full block appearance-none rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
              placeholder="e.g. Weekly Food Shop"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          {/* Amount & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="budgetAmount"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
              >
                Amount (£)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  £
                </span>
                <input
                  id="budgetAmount"
                  className="w-full min-w-0 max-w-full block appearance-none rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 pl-8 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Frequency
              </label>
              <div className="flex p-1 bg-slate-200 dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10">
                <button
                  type="button"
                  onClick={() => handleChange('frequency', 'monthly')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold rounded-lg shadow-sm transition-colors',
                    formData.frequency === 'monthly'
                      ? 'bg-primary text-background-dark'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/10'
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('frequency', 'annual')}
                  className={cn(
                    'flex-1 py-3 text-xs font-bold rounded-lg transition-colors',
                    formData.frequency === 'annual'
                      ? 'bg-primary text-background-dark'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/10'
                  )}
                >
                  Annual
                </button>
              </div>
            </div>
          </div>

          {/* Calculated Summary Card */}
          <div className="bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Annualised Equivalent
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-primary">
                £{calculatedAnnual.toFixed(2)}
              </p>
            </div>
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Icon name="analytics" className="text-2xl" />
            </div>
          </div>

          {/* One-off Budget Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50">
            <div>
              <label
                htmlFor="oneOffBudget"
                className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer text-sm block"
              >
                One-off budget
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mark this budget as a one-off item.
              </p>
            </div>
            <input
              id="oneOffBudget"
              type="checkbox"
              checked={formData.oneOffBudget}
              onChange={(e) => handleChange('oneOffBudget', e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 cursor-pointer accent-primary"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label
              htmlFor="budgetStartDate"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Budget Start Date
            </label>
            <DateInput
              id="budgetStartDate"
              className="w-full rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={formData.budgetStartDate}
              onChange={(e) => handleChange('budgetStartDate', e.target.value)}
            />
          </div>

          {/* Account */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Account
            </label>
            <div className="relative">
              <select
                name="accountId"
                required
                value={formData.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                className="w-full min-w-0 max-w-full block appearance-none rounded-xl border border-slate-200 dark:border-primary/20 bg-white dark:bg-slate-900/50 p-4 pr-10 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="" disabled>
                  Select an account
                </option>
                {budgetAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.nickname || acc.name}
                    {acc.last4Digits ? ` (x${acc.last4Digits})` : ''}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              />
            </div>
          </div>

          {/* Icon Picker */}
          <IconPicker
            value={formData.icon}
            onChange={(val) => handleChange('icon', val)}
          />
        </div>

        {/* Sticky Footer */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white dark:bg-background-dark border-t border-slate-200 dark:border-primary/10 sticky bottom-0">
          <button
            disabled={!formData.accountId}
            onClick={handleSave}
            className="w-full py-4 bg-primary text-background-dark font-bold rounded-xl shadow-[0_4px_14px_0_rgba(19,236,164,0.39)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="add_circle" className="text-xl" />
            Add Budget Item
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
