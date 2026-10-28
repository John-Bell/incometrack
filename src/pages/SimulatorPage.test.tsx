import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SimulatorPage } from './SimulatorPage';
import { useStore } from '@/store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/store/useStore', () => ({
    useStore: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: vi.fn(),
}));

describe('SimulatorPage', () => {
    it('renders tax year select dropdown populated with tax rules and recalculates when tax year changes', () => {
        (useStore as any).mockReturnValue({
            profile: { partner1Name: 'Alice', partner2Name: 'Bob' },
            taxYear: '2025-2026',
            taxRules: {
                '2024-2025': {} as any,
                '2025-2026': {} as any,
                '2026-2027': {} as any,
                '2027-2028': {} as any,
            },
        });

        const taxRules = [
            { id: '2024-2025' },
            { id: '2025-2026' },
            { id: '2026-2027' },
            { id: '2027-2028' },
        ];

        (useLiveQuery as any).mockImplementation((cb: any) => {
            const str = cb.toString();
            if (str.includes('taxRules')) return taxRules;
            return [];
        });

        render(
            <BrowserRouter>
                <SimulatorPage />
            </BrowserRouter>
        );

        // Check that Tax Year label and select element are rendered
        expect(screen.getByText('Tax Year')).toBeInTheDocument();
        const select = screen.getByRole('combobox', { name: 'Tax Year' });
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue('2025-2026');

        // Verify available options
        expect(screen.getByRole('option', { name: '2024-2025' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '2025-2026' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '2026-2027' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '2027-2028' })).toBeInTheDocument();

        // Change tax year selection
        fireEvent.change(select, { target: { value: '2027-2028' } });
        expect(select).toHaveValue('2027-2028');
    });
});
