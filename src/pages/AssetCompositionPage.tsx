import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Icon } from '@/components/ui/Icon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
];

export function AssetCompositionPage() {
    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

    const categoryDataMap = accounts.reduce((acc, account) => {
        const category = account.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + (account.balance || 0);
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(categoryDataMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const totalAssets = chartData.reduce((sum, item) => sum + item.value, 0);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);

    const formatPercentage = (val: number) => ((val / totalAssets) * 100).toFixed(1) + '%';

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
                                            {chartData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [formatCurrency(value), 'Value']}
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
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAssets)}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white px-1">Detailed Breakdown</h2>
                            {chartData.map((item, index) => (
                                <div
                                    key={item.name}
                                    className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-[#283933] flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatPercentage(item.value)} of total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</p>
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
