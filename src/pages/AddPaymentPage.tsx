import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { DateInput } from '@/components/ui/DateInput';
import { usePaymentForm } from '@/hooks/usePaymentForm';
import { cn } from '@/lib/utils';

export function AddPaymentPage() {
  const {
    budgets,
    currentAccounts,
    availableBudgets,
    formData,
    suggestedBudgetIds,
    navigate,
    handleChange,
    handlePayeeChange,
    applySuggestion,
    handleSave,
  } = usePaymentForm();

  return (
    <AppLayout
      header={
        <Header
          title="Add Payment"
          leftElement={
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <Icon name="arrow_back" className="text-2xl" />
            </button>
          }
        />
      }
    >
      <form
        onSubmit={handleSave}
        className="px-4 py-6 space-y-6 max-w-md mx-auto"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleChange('type', 'expense')}
                className={cn(
                  'py-2 text-sm font-semibold rounded-lg transition-colors',
                  formData.type === 'expense'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-500'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleChange('type', 'income')}
                className={cn(
                  'py-2 text-sm font-semibold rounded-lg transition-colors',
                  formData.type === 'income'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                )}
              >
                Income
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Account
            </label>
            <div className="relative">
              <select
                required
                value={formData.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                className="w-full min-w-0 max-w-full block appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              >
                <option value="" disabled>
                  Select an account
                </option>
                {currentAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.nickname || account.name}
                    {account.last4Digits ? ` (x${account.last4Digits})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                <Icon name="expand_more" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payee
            </label>
            <input
              type="text"
              required
              value={formData.payee}
              onChange={(e) => handlePayeeChange(e.target.value)}
              className="w-full min-w-0 max-w-full block appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="E.g. Tesco, Salary, etc."
            />
            {suggestedBudgetIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedBudgetIds.map((sId) => {
                  const budget = budgets.find((b) => b.id === sId);
                  if (!budget) return null;
                  const isSelected = formData.budgetId === sId;
                  return (
                    <button
                      key={sId}
                      type="button"
                      onClick={() => applySuggestion(sId)}
                      className={cn(
                        'text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all',
                        isSelected
                          ? 'bg-primary border-primary text-black shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      )}
                    >
                      {budget.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                £
              </span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full min-w-0 max-w-full block appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="min-w-0 w-full">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Date
            </label>
            <DateInput
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Budget
            </label>
            <div className="relative">
              <select
                value={formData.budgetId}
                onChange={(e) => handleChange('budgetId', e.target.value)}
                className="w-full min-w-0 max-w-full block appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              >
                <option value="" disabled>
                  Select a budget (optional)
                </option>
                {availableBudgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                <Icon name="expand_more" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 pb-24">
          <button
            type="submit"
            disabled={!formData.accountId}
            className="w-full bg-primary text-background-dark font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Payment
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
