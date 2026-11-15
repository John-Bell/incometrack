import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAssetCompositionPage } from '@/hooks/useAssetPages';
import { formatAssetCurrency } from '@/utils/assetUtils';

export function AssetCompositionPage() {
    const { accounts, chartData, totalAssets } = useAssetCompositionPage();

    return (
        <AppLayout
            header={
                <Header
                    title="Asset Composition"
                    subtitle="Portfolio Breakdown"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="pie_chart" className="text-2xl" />
                        </div>
                    }
                />
            }
        >
            <div className="p-4 space-y-6">
                {accounts.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-[#283933]">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-black/30 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
                            <Icon name="account_balance_wallet" className="text-3xl" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Assets Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                            Add some accounts to see your asset composition breakdown.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-[#283933]">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Allocation by Category</h2>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: unknown) => [formatAssetCurrency(Number(value) || 0, 2), 'Value']}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                color: '#1e293b'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Net Worth</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatAssetCurrency(totalAssets, 2)}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white px-1">Detailed Breakdown</h2>
                            {chartData.map((item) => (
                                <div
                                    key={item.name}
                                    className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-[#283933] flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.percentage} of total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-white">{formatAssetCurrency(item.value, 2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
