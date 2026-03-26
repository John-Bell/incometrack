import type { TaxCalculationResult } from '@/models/TaxCalculationResult';

interface TaxBandVisualizerProps {
    totalIncome: number;
    taxResult: TaxCalculationResult | null;
}

export function TaxBandVisualizer({ totalIncome, taxResult }: TaxBandVisualizerProps) {
    const pa = taxResult?.personalAllowance || 12570;
    // brbExtended is the width of the basic rate band (e.g. 37700)
    const brbWidth = taxResult?.brbExtended || 37700;
    const brThreshold = pa + brbWidth; // e.g. 50270

    // Scale primarily to basic rate threshold + a bit extra, unless higher rate is significant.
    const maxScale = Math.max(brThreshold * 1.05, totalIncome * 1.05);

    const paUsed = Math.min(totalIncome, pa);
    const paWidth = (paUsed / maxScale) * 100;

    const basicInc = Math.max(0, Math.min(totalIncome - pa, brbWidth));
    const basicWidth = (basicInc / maxScale) * 100;

    const higherInc = Math.max(0, totalIncome - brThreshold);
    const higherWidth = (higherInc / maxScale) * 100;

    const formatCurr = (v: number) => `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

    let currentBand = 'Within PA';
    let bandRate = '0%';
    let psaTotal = 1000;

    if (totalIncome <= pa) {
        currentBand = 'Personal Allowance';
        bandRate = '0%';
        psaTotal = 1000;
    } else if (totalIncome <= brThreshold) {
        currentBand = 'Basic Rate';
        bandRate = '20%';
        psaTotal = 1000;
    } else if (totalIncome <= 125140) {
        currentBand = 'Higher Rate';
        bandRate = '40%';
        psaTotal = 500;
    } else {
        currentBand = 'Additional Rate';
        bandRate = '45%';
        psaTotal = 0;
    }

    const savingsIncome = taxResult?.incomeBreakdown?.savingsIncome || 0;
    const psaRemaining = Math.max(0, psaTotal - savingsIncome);

    return (
        <div className="bg-slate-200 dark:bg-[#1c2723] rounded-xl p-5 shadow-sm border border-slate-300 dark:border-[#2f3e37]">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9db9b0]">Current Tax Band</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {currentBand} <span className={currentBand === 'Higher Rate' || currentBand === 'Additional Rate' ? "text-red-500 text-lg font-normal" : "text-primary text-lg font-normal"}>({bandRate})</span>
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-slate-500 dark:text-[#9db9b0]">PSA Remaining</p>
                    <p className="text-lg font-bold text-primary">{formatCurr(psaRemaining)}</p>
                </div>
            </div>

            <div className="relative w-full h-8 bg-slate-300 dark:bg-[#111816] rounded-full overflow-hidden flex">
                {paWidth > 0 && <div className="h-full bg-primary/40 flex items-center justify-center text-[10px] font-bold text-primary-900" style={{ width: `${paWidth}%` }}>{formatCurr(paUsed)}</div>}
                {basicWidth > 0 && <div className="h-full bg-primary flex items-center justify-center text-[10px] font-bold text-[#10221c]" style={{ width: `${basicWidth}%` }}>{formatCurr(basicInc)}</div>}
                {higherWidth > 0 && <div className="h-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${higherWidth}%` }}>{formatCurr(higherInc)}</div>}
            </div>

            <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-[#9db9b0]">
                <span>£0</span>
                <span className="font-medium text-slate-900 dark:text-white">Total: {formatCurr(totalIncome)}</span>
                <span>{formatCurr(maxScale)}</span>
            </div>
        </div>
    );
}
