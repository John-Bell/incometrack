import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { BrowserRouter } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';

vi.mock('@/hooks/useSettings', () => ({
    useSettings: vi.fn(),
}));

describe('SettingsPage', () => {
    const mockNavigate = vi.fn();
    const mockSetRemoteSync = vi.fn();
    const mockSetDefaultGrowthRate = vi.fn();
    const mockSetPartner1Name = vi.fn();
    const mockSetPartner1Dob = vi.fn();
    const mockSetPartner2Name = vi.fn();
    const mockSetPartner2Dob = vi.fn();
    const mockHandleTaxYearChange = vi.fn();
    const mockHandleSave = vi.fn();
    const mockHandleResetAppData = vi.fn();

    const defaultMockReturn = {
        navigate: mockNavigate,
        currentSettings: { id: 's1', taxYear: '2024/2025', icloudSync: true, defaultGrowthRate: 2.5, lastSynced: 1700000000000 },
        taxRules: [{ id: '2024/2025' }, { id: '2025/2026' }],
        isSaving: false,
        remoteSync: true,
        setRemoteSync: mockSetRemoteSync,
        defaultGrowthRate: 2.5,
        setDefaultGrowthRate: mockSetDefaultGrowthRate,
        partner1Name: 'Alice',
        setPartner1Name: mockSetPartner1Name,
        partner1Dob: '1990-01-01',
        setPartner1Dob: mockSetPartner1Dob,
        partner2Name: 'Bob',
        setPartner2Name: mockSetPartner2Name,
        partner2Dob: '1992-02-02',
        setPartner2Dob: mockSetPartner2Dob,
        handleTaxYearChange: mockHandleTaxYearChange,
        handleSave: mockHandleSave,
        handleResetAppData: mockHandleResetAppData,
    };

    it('renders profile names, growth rate, and tax year options', () => {
        (useSettings as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SettingsPage />
            </BrowserRouter>
        );

        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1992-02-02')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '2024/2025' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '2025/2026' })).toBeInTheDocument();
    });

    it('handles input changes for profile fields and growth rate', () => {
        (useSettings as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SettingsPage />
            </BrowserRouter>
        );

        const p1Input = screen.getByDisplayValue('Alice');
        fireEvent.change(p1Input, { target: { value: 'Charlie' } });
        expect(mockSetPartner1Name).toHaveBeenCalledWith('Charlie');

        const growthInput = screen.getByDisplayValue('2.5');
        fireEvent.change(growthInput, { target: { value: '3.0' } });
        expect(mockSetDefaultGrowthRate).toHaveBeenCalledWith(3.0);
    });

    it('calls handleTaxYearChange when changing tax year', () => {
        (useSettings as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SettingsPage />
            </BrowserRouter>
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '2025/2026' } });
        expect(mockHandleTaxYearChange).toHaveBeenCalled();
    });

    it('triggers handleResetAppData when clicking reset button', () => {
        (useSettings as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SettingsPage />
            </BrowserRouter>
        );

        const resetButton = screen.getByRole('button', { name: 'Reset App Data' });
        fireEvent.click(resetButton);
        expect(mockHandleResetAppData).toHaveBeenCalled();
    });

    it('triggers handleSave when clicking save button in header', () => {
        (useSettings as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SettingsPage />
            </BrowserRouter>
        );

        const saveButton = screen.getByRole('button', { name: /Save/i });
        fireEvent.click(saveButton);
        expect(mockHandleSave).toHaveBeenCalled();
    });
});
