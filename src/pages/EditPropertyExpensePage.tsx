import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePropertyExpenseForm } from '@/hooks/usePropertyExpenseForm';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { DateInput } from '@/components/ui/DateInput';

export function EditPropertyExpensePage() {
  const { id } = useParams<{ id: string }>();
  const {
    formData,
    handleChange,
    handleSubmit,
    handleDelete,
    navigate,
    returnUrl,
    properties,
    expense,
  } = usePropertyExpenseForm(id);

  if (!expense) {
    return (
      <AppLayout
        header={
          <Header
            title="Edit Expense"
            leftElement={
              <button onClick={() => navigate(returnUrl)}>
                <Icon name="arrow_back" className="text-2xl" />
              </button>
            }
          />
        }
      >
        <div className="max-w-2xl mx-auto flex items-center justify-center h-64 p-4">
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Icon name="refresh" className="animate-spin text-xl" /> Loading
            expense details...
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      header={
        <Header
          title="Edit Expense"
          leftElement={
            <button onClick={() => navigate(returnUrl)}>
              <Icon name="arrow_back" className="text-2xl" />
            </button>
          }
        />
      }
    >
      <div className="max-w-2xl mx-auto p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#283933] space-y-6"
        >
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-[#283933] pb-6">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 dark:text-rose-400">
              <Icon name="receipt_long" className="text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Expense Details
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Update the details of your property expense.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Property <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.propertyId}
                    onChange={(e) => handleChange('propertyId', e.target.value)}
                    className="w-full min-w-0 max-w-full block appearance-none px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  >
                    <option value="" disabled>
                      Select a property
                    </option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <DateInput
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payee <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.payee}
                onChange={(e) => handleChange('payee', e.target.value)}
                placeholder="e.g. British Gas, Wickes"
                className="w-full min-w-0 max-w-full block appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Amount (£) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                className="w-full min-w-0 max-w-full block appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="e.g. Boiler repair"
                className="w-full min-w-0 max-w-full block appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-[#283933] flex justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <Icon name="delete" />
              Delete Expense
            </button>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(returnUrl)}
                className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !formData.propertyId ||
                  !formData.date ||
                  !formData.payee ||
                  !formData.amount
                }
                className="px-6 py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
              >
                <Icon name="save" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
