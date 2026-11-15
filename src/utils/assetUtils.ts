import type { Account } from '@/lib/db';
import type { DrawdownStrategy, ProjectionYearResult } from '@/utils/projectionEngine';

export const ASSET_CHART_COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
];

export interface AssetCategoryChartItem {
    name: string;
    value: number;
    percentage: string;
    color: string;
}

export interface AssetCompositionSummary {
    chartData: AssetCategoryChartItem[];
    totalAssets: number;
}

export function formatAssetCurrency(val: number, fractionDigits = 2): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    }).format(val);
}

export function formatAssetPercentage(val: number, totalAssets: number): string {
    if (totalAssets <= 0) return '0.0%';
    return ((val / totalAssets) * 100).toFixed(1) + '%';
}

export function calculateAssetComposition(accounts: Account[]): AssetCompositionSummary {
    const categoryDataMap = accounts.reduce((acc, account) => {
        const category = account.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + (account.balance || 0);
        return acc;
    }, {} as Record<string, number>);

    const sortedEntries = Object.entries(categoryDataMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const totalAssets = sortedEntries.reduce((sum, item) => sum + item.value, 0);

    const chartData: AssetCategoryChartItem[] = sortedEntries.map((item, index) => ({
        name: item.name,
        value: item.value,
        percentage: formatAssetPercentage(item.value, totalAssets),
        color: ASSET_CHART_COLORS[index % ASSET_CHART_COLORS.length]
    }));

    return {
        chartData,
        totalAssets
    };
}

export interface DrawdownStrategyOption {
    id: DrawdownStrategy;
    label: string;
    shortLabel: string;
    icon: string;
    description: string;
}

export const DRAWDOWN_STRATEGIES: DrawdownStrategyOption[] = [
    {
        id: 'taxable_first',
        label: 'Taxable First',
        shortLabel: 'Taxable',
        icon: 'account_balance',
        description: 'Withdraws from taxable accounts first, preserving tax-free and pension growth as long as possible.'
    },
    {
        id: 'tax_free_first',
        label: 'Tax-Free First',
        shortLabel: 'Tax-Free',
        icon: 'savings',
        description: 'Uses ISAs and other tax-free assets first. Generally less efficient for long-term tax planning.'
    },
    {
        id: 'pensions_first',
        label: 'Pensions First',
        shortLabel: 'Pensions',
        icon: 'history_edu',
        description: 'Draws from pension pots first. Useful if you expect higher tax rates in later life.'
    },
    {
        id: 'proportional',
        label: 'Proportional',
        shortLabel: 'Proportional',
        icon: 'balance',
        description: 'Withdraws from all pots relative to their current size, maintaining the same asset allocation over time.'
    }
];

export interface PotTerminalSummary {
    currentValue: string;
    projectedValue: string;
    trend: 'up' | 'down';
}

export interface BurndownPotSummaries {
    taxable: PotTerminalSummary;
    taxFree: PotTerminalSummary;
    pensions: PotTerminalSummary;
}

export function calculateBurndownPotSummaries(
    data: ProjectionYearResult[],
    isReady: boolean
): BurndownPotSummaries {
    const firstPoint = isReady && data.length > 0 ? data[0] : null;
    const lastPoint = isReady && data.length > 0 ? data[data.length - 1] : null;

    const currentTaxable = firstPoint?.potBalances.taxable || 0;
    const projectedTaxable = lastPoint?.potBalances.taxable || 0;

    const currentTaxFree = firstPoint?.potBalances.taxFree || 0;
    const projectedTaxFree = lastPoint?.potBalances.taxFree || 0;

    const currentPensions = firstPoint?.potBalances.pensions || 0;
    const projectedPensions = lastPoint?.potBalances.pensions || 0;

    return {
        taxable: {
            currentValue: formatAssetCurrency(currentTaxable, 0),
            projectedValue: formatAssetCurrency(projectedTaxable, 0),
            trend: lastPoint && projectedTaxable > currentTaxable ? 'up' : 'down'
        },
        taxFree: {
            currentValue: formatAssetCurrency(currentTaxFree, 0),
            projectedValue: formatAssetCurrency(projectedTaxFree, 0),
            trend: lastPoint && projectedTaxFree > currentTaxFree ? 'up' : 'down'
        },
        pensions: {
            currentValue: formatAssetCurrency(currentPensions, 0),
            projectedValue: formatAssetCurrency(projectedPensions, 0),
            trend: lastPoint && projectedPensions > currentPensions ? 'up' : 'down'
        }
    };
}
