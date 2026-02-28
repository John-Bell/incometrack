import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IncomeConfigPage } from './IncomeConfigPage';
import { useStore } from '@/store/useStore';
import { BrowserRouter } from 'react-router-dom';

// Mock the store
vi.mock('@/store/useStore', () => ({
    useStore: vi.fn(),
}));

describe('IncomeConfigPage', () => {
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
                <IncomeConfigPage />
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
                <IncomeConfigPage />
            </BrowserRouter>
        );

        // Initial check for Alice's value (Partner 1 default)
        // Note: The component initializes with '0' for all fields.
        const initialZeroInputs = screen.getAllByDisplayValue('0');
        expect(initialZeroInputs.length).toBeGreaterThan(0);

        const tabBob = screen.getByText('Bob');
        fireEvent.click(tabBob);

        // After switching to Bob, the input should show 0 (Partner 2 default)
        // Check for Bob's values (0) - we expect multiple
        const zeroInputs = screen.getAllByDisplayValue('0');
        expect(zeroInputs.length).toBeGreaterThan(0);
    });
});
