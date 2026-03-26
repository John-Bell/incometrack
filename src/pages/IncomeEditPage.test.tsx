import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IncomeEditPage } from './IncomeEditPage';
import { useStore } from '@/store/useStore';
import { BrowserRouter } from 'react-router-dom';

// Mock the store
vi.mock('@/store/useStore', () => ({
    useStore: vi.fn(),
}));

vi.mock('@/hooks/useTaxCalculations', () => ({
    useTaxCalculations: vi.fn(() => ({
        p1TaxResult: { personalAllowance: 12570, brbExtended: 50270, incomeBreakdown: { savingsIncome: 0 } },
        p2TaxResult: { personalAllowance: 12570, brbExtended: 50270, incomeBreakdown: { savingsIncome: 0 } },
        p1TotalIncome: 50000,
        p2TotalIncome: 50000,
    })),
}));

describe('IncomeEditPage', () => {
    it('renders tabs and allows switching between partners', () => {
        // Mock store return value
        (useStore as any).mockReturnValue({
            profile: {
                partner1Name: 'Alice',
                partner2Name: 'Bob',
            },
        });

        render(
            <BrowserRouter>
                <IncomeEditPage />
            </BrowserRouter>
        );

        // Check if tabs are rendered with correct names
        const tabAlice = screen.getByText('Alice');
        const tabBob = screen.getByText('Bob');

        expect(tabAlice).toBeInTheDocument();
        expect(tabBob).toBeInTheDocument();

        // Check initial state - Alice should be selected
        expect(tabAlice).toHaveClass('bg-white');

        // Try to click Bob
        fireEvent.click(tabBob);

        // Expect Bob to be selected
        expect(tabBob).toHaveClass('bg-white');
        // Alice should not be selected anymore
        expect(tabAlice).not.toHaveClass('bg-white');
    });

    it('updates input fields when switching tabs', () => {
        // Mock store return value
        (useStore as any).mockReturnValue({
            profile: {
                partner1Name: 'Alice',
                partner2Name: 'Bob',
            },
        });

        render(
            <BrowserRouter>
                <IncomeEditPage />
            </BrowserRouter>
        );

        // Initial check for Alice's value (Partner 1 default)
        const initialZeroInputs = screen.getAllByPlaceholderText('0.00');
        expect(initialZeroInputs.length).toBeGreaterThan(0);

        const tabBob = screen.getByText('Bob');
        fireEvent.click(tabBob);

        // After switching to Bob, the input should show empty placeholder
        const zeroInputs = screen.getAllByPlaceholderText('0.00');
        expect(zeroInputs.length).toBeGreaterThan(0);
    });
});
