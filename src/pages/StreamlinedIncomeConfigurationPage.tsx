import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { IncomeInputCard } from '@/components/income/IncomeInputCard';
import { useStore } from '@/store/useStore';

export function StreamlinedIncomeConfigurationPage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    const [activeTabKey, setActiveTabKey] = useState<'partner1' | 'partner2'>('partner1');

    const [incomeData, setIncomeData] = useState({
        partner1: {
            pension: "11500",
            rental: "12000",
            employment: "21070",
            dividends: ""
        },
        partner2: {
            pension: "0",
            rental: "0",
            employment: "0",
            dividends: ""
        }
    });

    const handleInputChange = (field: keyof typeof incomeData.partner1, value: string) => {
        setIncomeData(prev => ({
            ...prev,
            [activeTabKey]: {
                ...prev[activeTabKey],
                [field]: value
            }
        }));
    };

    const currentData = incomeData[activeTabKey];

    return (
        <AppLayout hideBottomNav={true}>
            {/* Header */}
            <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800 shrink-0 z-20">
                <button className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <Icon name="arrow_back" className="text-2xl" />
                </button>
                <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
                    Income Configuration
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {/* Partner Toggle */}
                <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex h-10 w-full items-center justify-center rounded-lg bg-slate-200 dark:bg-[#1c2723] p-1">
                        <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-[0.2rem] px-2 transition-all duration-200 has-[:checked]:bg-white dark:has-[:checked]:bg-[#2f3e37] has-[:checked]:shadow-sm has-[:checked]:text-primary text-slate-500 dark:text-[#9db9b0] text-sm font-semibold leading-normal">
                            <span className="truncate">{p1Name}</span>
                            <input
                                type="radio"
                                name="partner_toggle"
                                value={p1Name}
                                className="invisible w-0 h-0 absolute"
                                checked={activeTabKey === 'partner1'}
                                onChange={() => setActiveTabKey('partner1')}
                            />
                        </label>
                        <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-[0.2rem] px-2 transition-all duration-200 has-[:checked]:bg-white dark:has-[:checked]:bg-[#2f3e37] has-[:checked]:shadow-sm has-[:checked]:text-primary text-slate-500 dark:text-[#9db9b0] text-sm font-semibold leading-normal">
                            <span className="truncate">{p2Name}</span>
                            <input
                                type="radio"
                                name="partner_toggle"
                                value={p2Name}
                                className="invisible w-0 h-0 absolute"
                                checked={activeTabKey === 'partner2'}
                                onChange={() => setActiveTabKey('partner2')}
                            />
                        </label>
                    </div>
                </div>

                {/* Non-Savings Income */}
                <div className="px-4 pb-2 mt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon name="account_balance_wallet" className="text-primary text-xl" />
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
                            Non-Savings Income
                        </h3>
                    </div>
                    <div className="flex flex-col gap-4">
                        <IncomeInputCard
                            label="State / Private Pension"
                            value={currentData.pension}
                            onChange={(e) => handleInputChange('pension', e.target.value)}
                        />
                        <IncomeInputCard
                            label="Rental Income (Net)"
                            value={currentData.rental}
                            onChange={(e) => handleInputChange('rental', e.target.value)}
                        />
                        <IncomeInputCard
                            label="Employment / Other"
                            value={currentData.employment}
                            onChange={(e) => handleInputChange('employment', e.target.value)}
                        />
                    </div>
                </div>

                {/* Dividend Income */}
                <div className="px-4 py-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon name="pie_chart" className="text-primary text-xl" />
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
                            Dividend Income
                        </h3>
                    </div>

                    <IncomeInputCard
                        label="Total Dividends"
                        value={currentData.dividends}
                        tooltipText="Dividends are taxed differently but count towards your total income band."
                        onChange={(e) => handleInputChange('dividends', e.target.value)}
                    />
                    <p className="mt-3 text-xs text-slate-500 dark:text-[#9db9b0] leading-relaxed">
                        Dividend allowance of £500 is applied automatically. This income sits on top of non-savings income in your tax stack.
                    </p>
                </div>

                <div className="h-24"></div>
            </div>

            {/* Save & Calculate Footer Button */}
            <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark pointer-events-none z-30 max-w-md mx-auto">
                <Button className="pointer-events-auto w-full bg-primary hover:bg-[#0fd693] text-[#10221c] font-bold text-lg py-3.5 px-6 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] h-auto">
                    <Icon name="check" className="font-bold" />
                    Save & Calculate
                </Button>
            </div>

            {/* Bottom Nav Bar from UI Spec */}
            <div className="fixed bottom-0 z-40 w-full max-w-md mx-auto border-t border-slate-200 dark:border-[#283933] bg-background-light dark:bg-[#1c2723] px-4 pb-6 pt-2 shrink-0">
                <div className="flex gap-2">
                    <a href="#" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-slate-900 dark:text-white">
                        <div className="text-slate-900 dark:text-primary flex h-8 items-center justify-center">
                            <Icon name="currency_pound" className="text-[28px] fill" />
                        </div>
                        <p className="text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-wider leading-normal">Baselines</p>
                    </a>
                    <a href="#" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-[#9db9b0]">
                        <div className="text-slate-400 dark:text-[#5f7e73] flex h-8 items-center justify-center">
                            <Icon name="account_balance" className="text-[28px]" />
                        </div>
                        <p className="text-slate-400 dark:text-[#5f7e73] text-[10px] font-bold uppercase tracking-wider leading-normal">Savings</p>
                    </a>
                    <a href="#" className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-[#9db9b0]">
                        <div className="text-slate-400 dark:text-[#5f7e73] flex h-8 items-center justify-center">
                            <Icon name="monitoring" className="text-[28px]" />
                        </div>
                        <p className="text-slate-400 dark:text-[#5f7e73] text-[10px] font-bold uppercase tracking-wider leading-normal">Optimiser</p>
                    </a>
                </div>
            </div>
        </AppLayout>
    );
}
