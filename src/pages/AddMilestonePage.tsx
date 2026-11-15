import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { DateInput } from '@/components/ui/DateInput';
import { useMilestoneForm } from '@/hooks/useMilestoneForm';

export function AddMilestonePage() {
  const { formData, navigate, handleChange, handleSave } = useMilestoneForm();

  return (
    <AppLayout
      header={
        <Header
          title="Add Milestone"
          leftElement={
            <button
              onClick={() => navigate('/milestones')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors"
            >
              <Icon
                name="arrow_back"
                className="text-2xl text-slate-700 dark:text-slate-300"
              />
            </button>
          }
        />
      }
    >
      <div className="max-w-2xl mx-auto p-4">
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#283933] space-y-6"
        >
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-[#283933] pb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Icon name="flag" className="text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Milestone Details
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Describe a life event that impacts your finances.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Milestone Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Retirement, House Move, Inheritance"
                className="w-full min-w-0 max-w-full block appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Date <span className="text-red-500">*</span>
              </label>
              <DateInput
                id="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Amount (£)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  £
                </span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full min-w-0 max-w-full block appearance-none pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-[#283933] bg-white dark:bg-black/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Positive for inflows, negative for outflows.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-[#283933] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/milestones')}
              className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.date}
              className="px-6 py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Icon name="save" />
              <span>Save Milestone</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
