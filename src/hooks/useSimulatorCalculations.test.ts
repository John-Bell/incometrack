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

    it('sweeps manual tracking accounts with positive interest rate and ignores 0% interest or excluded accounts', () => {
        (useStore as any).mockReturnValue({
            taxYear: '2025-2026',
            taxRules: TAX_YEAR_CONSTANTS,
        });

        const accounts = [
            {
                id: 'accCurrent',
                ownerId: 'person1',
                name: 'Current Account (0%)',
                balance: 20000,
                interestRate: 0,
                category: 'Current Account',
                interestPayoutFrequency: 'monthly'
            },
            {
                id: 'accStocks',
                ownerId: 'person1',
                name: 'Stocks & Shares',
                balance: 20000,
                interestRate: 5.0,
                category: 'Stocks & Shares',
                interestPayoutFrequency: 'monthly'
            },
            {
                id: 'accManual',
                ownerId: 'person1',
                name: 'Manual Easy Access 5%',
                balance: 20000,
                interestRate: 5.0,
                interestTrackingMethod: 'manual',
                category: 'Easy Access Savings',
                interestPayoutFrequency: 'monthly'
            }
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            return [];
        });

        // Without sweep: Stocks & Shares (£1,000) + Manual Easy Access (£1,000) = £2,000 total interest
        const { result: resultWithoutSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', false)
        );
        expect(resultWithoutSweep.current.p1Incomes.interest).toBeCloseTo(2000, 0);

        // With sweep: Current Account and Stocks & Shares are excluded candidates.
        // Manual Easy Access is eligible despite interestTrackingMethod: 'manual'.
        // The £20k ISA sweep targets Manual Easy Access (£20,000 -> £0), leaving 0 interest from it.
        // Remaining P1 interest comes only from Stocks & Shares (£1,000).
        const { result: resultWithSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', true)
        );
        expect(resultWithSweep.current.p1Incomes.interest).toBeCloseTo(1000, 0);
    });

    it('scales workingAccruals proportionally when deducting balance during ISA sweep', () => {
        (useStore as any).mockReturnValue({
            taxYear: '2025-2026',
            taxRules: TAX_YEAR_CONSTANTS,
        });

        const startTs = new Date(2025, 3, 6).getTime();

        const accounts = [
            {
                id: 'acc1',
                ownerId: 'person1',
                name: 'P1 Savings',
                balance: 50000,
                interestRate: 5.0,
                category: 'Easy Access Savings',
                interestPayoutFrequency: 'monthly'
            }
        ];

        const interestAccruals = [
            {
                id: 'accrual1',
                accountId: 'acc1',
                date: startTs + 1000 * 3600 * 24 * 30, // 30 days after tax year start
                interestAccrued: 500
            }
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            if (str.includes('interestAccruals')) return interestAccruals;
            return [];
        });

        // Without ISA sweep
        const { result: resultWithoutSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', false)
        );

        // With ISA sweep (£20,000 deducted from £50,000 = 60% balance remaining)
        const { result: resultWithSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', true)
        );

        // Interest with sweep should be exactly 60% of interest without sweep
        expect(resultWithSweep.current.p1Incomes.interest).toBeCloseTo(
            resultWithoutSweep.current.p1Incomes.interest * 0.6,
            1
        );
    });

    it('sweeps movable savings first before non-movable savings, and ignores non-paying fixed accounts for selected tax year', () => {
        (useStore as any).mockReturnValue({
            taxYear: '2025-2026',
            taxRules: TAX_YEAR_CONSTANTS,
        });

        // Tax year 2025-2026: 06-Apr-2025 to 05-Apr-2026
        const payoutIn2027 = new Date(2027, 8, 1).getTime(); // Sep 2027 (outside 2025-2026)
        const payoutIn2025 = new Date(2025, 10, 1).getTime(); // Nov 2025 (inside 2025-2026)

        const accounts = [
            {
                id: 'nonPayingFixed',
                ownerId: 'person1',
                name: 'Fixed Bond 2027',
                balance: 20000,
                interestRate: 8.0, // High rate, but doesn't pay out in 2025-2026
                category: 'Fixed Term Savings',
                interestPayoutFrequency: 'at_maturity',
                interestPayoutDate: payoutIn2027,
                bondTermYears: 2
            },
            {
                id: 'payingFixed',
                ownerId: 'person1',
                name: 'Fixed Bond 2025',
                balance: 20000,
                interestRate: 6.0,
                category: 'Fixed Term Savings',
                interestPayoutFrequency: 'at_maturity',
                interestPayoutDate: payoutIn2025,
                bondTermYears: 1
            },
            {
                id: 'movableSavings',
                ownerId: 'person1',
                name: 'Easy Access 4%',
                balance: 20000,
                interestRate: 4.0,
                category: 'Easy Access Savings',
                interestPayoutFrequency: 'monthly'
            }
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('accounts')) return accounts;
            return [];
        });

        // Without sweep:
        // nonPayingFixed: £0
        // payingFixed: £20,000 * 6% = £1,200
        // movableSavings: £20,000 * 4% = £800
        // Total P1 interest = £2,000
        const { result: resultWithoutSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', false)
        );
        expect(resultWithoutSweep.current.p1Incomes.interest).toBeCloseTo(2000, 0);

        // With sweep:
        // nonPayingFixed is ignored because projected interest in 2025-2026 is 0.
        // Movable savings (Easy Access 4%) is prioritized over non-movable payingFixed (6%) because movable comes first!
        // £20,000 sweep targets Easy Access 4% completely (reducing interest by £800).
        // Remaining P1 interest = £1,200 (from payingFixed).
        const { result: resultWithSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', true)
        );
        expect(resultWithSweep.current.p1Incomes.interest).toBeCloseTo(1200, 0);
    });

    it('isolates joint accounts so sweeping for Person 2 only reduces Person 2 interest share', () => {
        (useStore as any).mockReturnValue({
            taxYear: '2025-2026',
            taxRules: TAX_YEAR_CONSTANTS,
        });

        // Joint account with £40,000 (£20k P1 share, £20k P2 share) at 5% rate => £1,000 interest per person
        // Person 1 has no sole accounts
        // Person 2 has no sole accounts
        const accounts = [
            {
                id: 'jointAcc',
                ownerId: 'joint',
                name: 'Joint Savings',
                balance: 40000,
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

        // Without sweep: each gets £1,000 interest (5% on £20,000 share)
        const { result: resultWithoutSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', false)
        );
        expect(resultWithoutSweep.current.p1Incomes.interest).toBeCloseTo(1000, 0);
        expect(resultWithoutSweep.current.p2Incomes.interest).toBeCloseTo(1000, 0);

        // With sweep:
        // P1 sweeps £20,000 from P1's virtual share (£20,000 balance -> £0). P1 interest = £0.
        // P2 sweeps £20,000 from P2's virtual share (£20,000 balance -> £0). P2 interest = £0.
        const { result: resultWithSweep } = renderHook(() =>
            useSimulatorCalculations(undefined, undefined, '2025-2026', true)
        );
        expect(resultWithSweep.current.p1Incomes.interest).toBeCloseTo(0, 0);
        expect(resultWithSweep.current.p2Incomes.interest).toBeCloseTo(0, 0);
    });
});
