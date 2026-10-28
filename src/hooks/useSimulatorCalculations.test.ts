import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSimulatorCalculations } from './useSimulatorCalculations';
import { useStore } from '@/store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { TAX_YEAR_CONSTANTS } from '@/constants/taxConstants';

vi.mock('@/store/useStore', () => ({
    useStore: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: vi.fn(),
}));

describe('useSimulatorCalculations', () => {
    it('uses taxYearOverride when provided and calculates tax correctly for specified tax year', () => {
        (useStore as any).mockReturnValue({
            taxYear: '2024-2025',
            taxRules: TAX_YEAR_CONSTANTS,
        });

        const start2027 = new Date(2027, 3, 6).getTime();
        const end2027 = new Date(2028, 3, 5, 23, 59, 59, 999).getTime();

        const incomes = [
            {
                id: 'inc1',
                ownerId: 'person1',
                type: 'employment',
                amount: 50000,
                frequency: 'annual',
                startDate: new Date(2020, 0, 1).getTime(),
            },
            {
                id: 'inc2',
                ownerId: 'person1',
                type: 'dividends',
                amount: 10000,
                frequency: 'annual',
                startDate: new Date(2020, 0, 1).getTime(),
            },
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('incomes')) return incomes;
            return [];
        });

        // Test with taxYearOverride = '2027-2028'
        const { result: result2027 } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2027-2028')
        );

        // Test with taxYearOverride = '2024-2025'
        const { result: result2024 } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2024-2025')
        );

        expect(result2027.current.p1Incomes.employment).toBe(50000);
        expect(result2027.current.p1Incomes.dividends).toBe(10000);

        // Dividend basic rate in 2024-2025 was 8.75%, whereas in 2027-2028 it is 10.75%.
        // Dividend allowance in 2024-2025 was £1,000 vs £500 in 2027-2028.
        // Therefore, total tax for 2027-2028 should be higher than 2024-2025.
        const tax2024 = result2024.current.p1TaxResult?.totalTax ?? 0;
        const tax2027 = result2027.current.p1TaxResult?.totalTax ?? 0;

        expect(tax2027).toBeGreaterThan(tax2024);
    });

    it('reduces taxable cash balance by £20,000 per partner when isaSweep is true', () => {
        (useStore as any).mockReturnValue({
            taxYear: '2025-2026',
            taxRules: TAX_YEAR_CONSTANTS,
        });

        const accounts = [
            {
                id: 'acc1',
                ownerId: 'person1',
                name: 'P1 Savings',
                balance: 50000,
                interestRate: 5.0,
                category: 'Easy Access Savings',
                interestPayoutFrequency: 'monthly'
            },
            {
                id: 'acc2',
                ownerId: 'person2',
                name: 'P2 Savings',
                balance: 50000,
                interestRate: 5.0,
                category: 'Easy Access Savings',
                interestPayoutFrequency: 'monthly'
            }
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            return [];
        });

        // Without ISA sweep
        const { result: resultWithoutSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', false)
        );

        // With ISA sweep
        const { result: resultWithSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', true)
        );

        // Without sweep: £50,000 * 5% = £2,500 interest for each
        expect(resultWithoutSweep.current.p1Incomes.interest).toBeCloseTo(2500, 0);
        expect(resultWithoutSweep.current.p2Incomes.interest).toBeCloseTo(2500, 0);

        // With sweep: (£50,000 - £20,000) = £30,000 * 5% = £1,500 interest for each
        expect(resultWithSweep.current.p1Incomes.interest).toBeCloseTo(1500, 0);
        expect(resultWithSweep.current.p2Incomes.interest).toBeCloseTo(1500, 0);
    });
});
