import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { Tabs } from '../components/ui/Tabs';

import { TaxBandVisualizer } from '../components/income/TaxBandVisualizer';
import { IncomeInputCard } from '../components/income/IncomeInputCard';
import { useStore } from '@/store/useStore';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';

export function IncomeConfigPage() {
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    const [activeTabKey, setActiveTabKey] = useState<'partner1' | 'partner2'>('partner1');

    const [incomeData, setIncomeData] = useState({
        partner1: {
            pension: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
            rental: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
            employment: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
            dividends: { amount: "0", frequency: "annual" as 'annual' | 'monthly' }
        },
        partner2: {
            pension: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
            rental: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
            employment: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
            dividends: { amount: "0", frequency: "annual" as 'annual' | 'monthly' }
        }
    });

    const [isSaving, setIsSaving] = useState(false);
    const dbIncomes = useLiveQuery(() => db.incomes.toArray());

    useEffect(() => {
        if (dbIncomes && dbIncomes.length > 0) {
            setIncomeData(prev => {
                const newData = {
                    partner1: {
                        pension: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
                        rental: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
                        employment: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
                        dividends: { amount: "0", frequency: "annual" as 'annual' | 'monthly' }
                    },
                    partner2: {
                        pension: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
                        rental: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
                        employment: { amount: "0", frequency: "annual" as 'annual' | 'monthly' },
                        dividends: { amount: "0", frequency: "annual" as 'annual' | 'monthly' }
                    }
                };
                let hasChanges = false;

                dbIncomes.forEach(inc => {
                    const partnerKey = inc.ownerId === 'person1' ? 'partner1' : 'partner2';
                    if (newData[partnerKey] && inc.type in newData[partnerKey]) {
                        newData[partnerKey][inc.type as keyof typeof newData['partner1']] = {
                            amount: inc.amount.toString(),
                            frequency: (inc.frequency as 'annual' | 'monthly') || 'annual'
                        };
                        const prevField = prev[partnerKey][inc.type as keyof typeof newData['partner1']];
                        if (prevField.amount !== inc.amount.toString() || prevField.frequency !== inc.frequency) {
                            hasChanges = true;
                        }
                    }
                });

                return hasChanges ? newData : prev;
            });
        }
    }, [dbIncomes]);

    const handleSave = async () => {
        if (!dbIncomes) return;
        setIsSaving(true);
        try {
            const updates = dbIncomes.map(inc => {
                const partnerKey = inc.ownerId === 'person1' ? 'partner1' : 'partner2';
                const fieldData = incomeData[partnerKey][inc.type as keyof typeof incomeData['partner1']];
                return {
                    ...inc,
                    amount: fieldData.amount ? parseFloat(fieldData.amount) || 0 : 0,
                    frequency: fieldData.frequency
                };
            });
            await db.incomes.bulkPut(updates);
        } catch (error) {
            console.error("Failed to save incomes:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (field: keyof typeof incomeData.partner1, value: string) => {
        setIncomeData(prev => ({
            ...prev,
            [activeTabKey]: {
                ...prev[activeTabKey],
                [field]: { ...prev[activeTabKey][field], amount: value }
            }
        }));
    };

    const handleFrequencyChange = (field: keyof typeof incomeData.partner1, freq: 'annual' | 'monthly') => {
        setIncomeData(prev => ({
            ...prev,
            [activeTabKey]: {
                ...prev[activeTabKey],
                [field]: { ...prev[activeTabKey][field], frequency: freq }
            }
        }));
    };

    const currentData = incomeData[activeTabKey];

    return (
        <AppLayout
            hideBottomNav
            header={
                <Header
                    title="Income Configuration"
                    className="text-center justify-center relative"
                    leftElement={
                        <button className="absolute left-4 flex w-10 h-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            <Icon name="arrow_back" className="text-2xl text-slate-900 dark:text-slate-100" />
                        </button>
                    }
                    rightElement={<MainHeaderActions onSave={handleSave} isSaving={isSaving} />}
                />
            }
        >
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <Tabs
                    options={[p1Name, p2Name]}
                    selected={activeTabKey === 'partner1' ? p1Name : p2Name}
                    onValueChange={(val) => setActiveTabKey(val === p1Name ? 'partner1' : 'partner2')}
                />
            </div>

            <div className="px-4 py-6">
                <TaxBandVisualizer />
            </div>

            <div className="px-4 pb-2">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="account_balance_wallet" className="text-primary text-xl" />
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Non-Savings Income</h3>
                </div>

                <div className="flex flex-col gap-4">
                    <IncomeInputCard
                        label="State / Private Pension"
                        value={currentData.pension.amount}
                        frequency={currentData.pension.frequency}
                        onChange={(e) => handleInputChange('pension', e.target.value)}
                        onFrequencyChange={(freq) => handleFrequencyChange('pension', freq)}
                    />
                    <IncomeInputCard
                        label="Rental Income (Net)"
                        value={currentData.rental.amount}
                        frequency={currentData.rental.frequency}
                        onChange={(e) => handleInputChange('rental', e.target.value)}
                        onFrequencyChange={(freq) => handleFrequencyChange('rental', freq)}
                    />
                    <IncomeInputCard
                        label="Employment / Other"
                        value={currentData.employment.amount}
                        frequency={currentData.employment.frequency}
                        onChange={(e) => handleInputChange('employment', e.target.value)}
                        onFrequencyChange={(freq) => handleFrequencyChange('employment', freq)}
                    />
                </div>
            </div>

            <div className="px-4 py-6">
                <div className="flex items-center gap-2 mb-4">
                    <Icon name="pie_chart" className="text-primary text-xl" />
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Dividend Income</h3>
                </div>

                <IncomeInputCard
                    label="Total Dividends"
                    value={currentData.dividends.amount}
                    frequency={currentData.dividends.frequency}
                    tooltipText="Dividends are taxed differently but count towards your total income band."
                    onChange={(e) => handleInputChange('dividends', e.target.value)}
                    onFrequencyChange={(freq) => handleFrequencyChange('dividends', freq)}
                />

                <p className="mt-3 text-xs text-slate-500 dark:text-[#9db9b0] leading-relaxed">
                    Dividend allowance of £500 is applied automatically. This income sits on top of non-savings income in your tax stack.
                </p>
            </div>

            <div className="h-6"></div>
        </AppLayout>
    );
}
