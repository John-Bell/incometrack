import { Icon } from '@/components/ui/Icon';

interface TaxEfficiencyScoreProps {
    score: number;
    trend: 'up' | 'down' | 'neutral';
    description: string;
}

export function TaxEfficiencyScore({ score, trend, description }: TaxEfficiencyScoreProps) {
    return (
        <div className="bg-surface-dark rounded-2xl p-6 mb-6 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Tax Efficiency Score</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold text-white tracking-tight">{score}</span>
                        <span className="text-slate-500 text-lg font-medium">/100</span>
                    </div>
                </div>

                <div className="w-12 h-12 rounded-full border-4 border-[#2a4038] border-t-primary border-r-primary flex items-center justify-center rotate-45 bg-[#1c2e28]">
                    <Icon name={trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat'} className="text-primary -rotate-45 font-bold" />
                </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed relative z-10" dangerouslySetInnerHTML={{ __html: description }}></p>

            <div className="mt-6 flex gap-1 h-2 w-full rounded-full overflow-hidden bg-[#2a4038]">
                <div
                    className="bg-primary shadow-[0_0_10px_rgba(19,236,164,0.4)]"
                    style={{ width: `${score}%` }}
                ></div>
            </div>
        </div>
    );
}
