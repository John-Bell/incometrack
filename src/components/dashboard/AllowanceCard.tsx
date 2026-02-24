import { ProgressBar } from '@/components/ui/ProgressBar';

interface AllowanceCardProps {
    initials: string;
    name: string;
    taxPayerType: string;
    usedAmount: string;
    totalAmount: string;
    percentage: number;
    remainingText: string;
}

export function AllowanceCard({
    initials,
    name,
    taxPayerType,
    usedAmount,
    totalAmount,
    percentage,
    remainingText,
}: AllowanceCardProps) {
    return (
        <div className="bg-surface-dark p-6 rounded-2xl border border-white/5 relative overflow-hidden mb-4">
            <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm border-2 border-[#2a4038]">
                        {initials}
                    </div>
                    <div>
                        <p className="text-white font-bold text-base">{name}</p>
                        <p className="text-slate-500 text-xs">{taxPayerType}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-white font-bold text-lg">{usedAmount}</p>
                    <p className="text-slate-400 text-xs">of {totalAmount} PSA</p>
                </div>
            </div>

            <ProgressBar value={percentage} className="mb-2 bg-[#2a4038]" />

            <div className="flex justify-between text-xs font-medium">
                <span className="text-primary">Safe Zone</span>
                <span className="text-slate-500">{remainingText}</span>
            </div>
        </div>
    );
}
