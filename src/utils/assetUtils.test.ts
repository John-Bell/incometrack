import { describe, it, expect } from 'vitest';
import {
    ASSET_CHART_COLORS,
    calculateAssetComposition,
    calculateBurndownPotSummaries,
    DRAWDOWN_STRATEGIES,
    formatAssetCurrency,
    formatAssetPercentage
} from './assetUtils';
import type { Account } from '@/lib/db';
import type { ProjectionYearResult } from './projectionEngine';

describe('assetUtils', () => {
    describe('formatAssetCurrency and formatAssetPercentage', () => {
        it('formats GBP currency with requested decimal places', () => {
            expect(formatAssetCurrency(12500.5, 2)).toBe('£12,500.50');
            expect(formatAssetCurrency(12500, 0)).toBe('£12,500');
        });

        it('formats percentage of total assets and handles zero total safely', () => {
            expect(formatAssetPercentage(250, 1000)).toBe('25.0%');
            expect(formatAssetPercentage(100, 0)).toBe('0.0%');
        });
    });

    describe('calculateAssetComposition', () => {
        it('aggregates accounts by category, sorts descending by value, and computes percentages', () => {
            const accounts: Account[] = [
                {
                    id: '1',
                    ownerId: 'person1',
                    name: 'Cash 1',
                    category: 'Current Account',
                    balance: 2000,
                    interestRate: 0,
                    updatedAt: 0
                },
                {
                    id: '2',
                    ownerId: 'person1',
                    name: 'ISA 1',
                    category: 'Cash ISA',
                    balance: 6000,
                    interestRate: 0,
                    updatedAt: 0
                },
                {
                    id: '3',
                    ownerId: 'person2',
                    name: 'Cash 2',
                    category: 'Current Account',
                    balance: 2000,
                    interestRate: 0,
                    updatedAt: 0
                }
            ];

            const result = calculateAssetComposition(accounts);
            expect(result.totalAssets).toBe(10000);
            expect(result.chartData).toEqual([
                {
                    name: 'Cash ISA',
                    value: 6000,
                    percentage: '60.0%',
                    color: ASSET_CHART_COLORS[0]
                },
                {
                    name: 'Current Account',
                    value: 4000,
                    percentage: '40.0%',
                    color: ASSET_CHART_COLORS[1]
                }
            ]);
        });
    });

    describe('calculateBurndownPotSummaries and DRAWDOWN_STRATEGIES', () => {
        it('exposes all 4 drawdown strategy configurations', () => {
            expect(DRAWDOWN_STRATEGIES.map(s => s.id)).toEqual([
                'taxable_first',
                'tax_free_first',
                'pensions_first',
                'proportional'
            ]);
        });

        it('computes initial and terminal pot values and trends when projection is ready', () => {
            const mockData = [
                {
                    potBalances: { taxable: 50000, taxFree: 40000, pensions: 100000, premiumBonds: 0 }
                },
                {
                    potBalances: { taxable: 10000, taxFree: 60000, pensions: 120000, premiumBonds: 0 }
                }
            ] as unknown as ProjectionYearResult[];

            const summaries = calculateBurndownPotSummaries(mockData, true);
            expect(summaries.taxable).toEqual({
                currentValue: '£50,000',
                projectedValue: '£10,000',
                trend: 'down'
            });
            expect(summaries.taxFree).toEqual({
                currentValue: '£40,000',
                projectedValue: '£60,000',
                trend: 'up'
            });
            expect(summaries.pensions).toEqual({
                currentValue: '£100,000',
                projectedValue: '£120,000',
                trend: 'up'
            });
        });

        it('returns zeroed summaries when projection is not ready', () => {
            const summaries = calculateBurndownPotSummaries([], false);
            expect(summaries.taxable.currentValue).toBe('£0');
            expect(summaries.taxable.projectedValue).toBe('£0');
            expect(summaries.taxable.trend).toBe('down');
        });
    });
});
