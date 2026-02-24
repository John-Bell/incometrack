import { Icon } from '@/components/ui/Icon';
import { useStore } from '@/store/useStore';

export function ScenarioSetup() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
                <Icon name="swap_horiz" className="text-primary text-xl" />
                <h2 className="text-slate-900 dark:text-slate-100 text-sm font-semibold uppercase tracking-wider">Scenario Setup</h2>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#2a3833]">
                <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-2 uppercase tracking-wide">
                    Select Asset to Transfer
                </label>
                <div className="relative">
                    <select className="w-full appearance-none bg-gray-50 dark:bg-[#2a3833] border border-gray-200 dark:border-[#3b4b45] text-slate-900 dark:text-white rounded-lg py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow font-medium text-base">
                        <option>Chase Saver (£85,000)</option>
                        <option>Marcus Easy Access (£20,000)</option>
                        <option>Premium Bonds (£50,000)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
                        <Icon name="expand_more" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#2a3833]">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">New Owner Simulation</span>
                    <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">SIMULATION MODE</span>
                </div>

                <div className="grid grid-cols-2 bg-gray-100 dark:bg-[#2a3833] p-1 rounded-lg gap-1">
                    <button className="relative flex flex-col items-center justify-center py-2 px-4 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                        <span className="text-xs font-medium opacity-60">{p1Name}</span>
                        <span className="text-sm font-bold">Current Owner</span>
                    </button>

                    <button className="relative flex flex-col items-center justify-center py-2 px-4 rounded-md bg-white dark:bg-primary shadow-sm text-primary dark:text-[#10221c] transition-all transform scale-[1.02]">
                        <span className="text-xs font-bold opacity-80">New Owner</span>
                        <span className="text-sm font-extrabold flex items-center gap-1">
                            {p2Name}
                            <Icon name="check_circle" className="text-[16px]" fill />
                        </span>
                    </button>
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    By moving this asset from <span className="text-slate-900 dark:text-white font-semibold">{p1Name}</span> to <span className="text-slate-900 dark:text-white font-semibold">{p2Name}</span>, you are utilizing their remaining <span className="text-slate-900 dark:text-white font-semibold">Personal Savings Allowance</span> for the tax year.
                </p>
            </div>
        </div>
    );
}
