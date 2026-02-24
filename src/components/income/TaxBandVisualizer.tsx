export function TaxBandVisualizer() {
    return (
        <div className="bg-slate-200 dark:bg-[#1c2723] rounded-xl p-5 shadow-sm border border-slate-300 dark:border-[#2f3e37]">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9db9b0]">Current Tax Band</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        Basic Rate <span className="text-primary text-lg font-normal">(20%)</span>
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-slate-500 dark:text-[#9db9b0]">PSA Remaining</p>
                    <p className="text-lg font-bold text-primary">£1,000</p>
                </div>
            </div>
            <div className="relative w-full h-8 bg-slate-300 dark:bg-[#111816] rounded-full overflow-hidden flex">
                <div className="h-full bg-primary/40 flex items-center justify-center text-[10px] font-bold text-primary-900" style={{ width: '25%' }}>£12,570</div>
                <div className="h-full bg-primary flex items-center justify-center text-[10px] font-bold text-[#10221c]" style={{ width: '45%' }}>£32,000</div>
                <div className="h-full flex-1"></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-[#9db9b0]">
                <span>£0</span>
                <span className="font-medium text-slate-900 dark:text-white">Total: £44,570</span>
                <span>£50,270</span>
            </div>
        </div>
    );
}
