import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SimplifiedAppSetupPage } from './SimplifiedAppSetupPage';
import { BrowserRouter } from 'react-router-dom';
import { useSimplifiedAppSetup } from '@/hooks/useSimplifiedAppSetup';

vi.mock('@/hooks/useSimplifiedAppSetup', () => ({
    useSimplifiedAppSetup: vi.fn(),
}));

describe('SimplifiedAppSetupPage', () => {
    const mockSetPartner1Name = vi.fn();
    const mockSetPartner1Dob = vi.fn();
    const mockSetPartner2Name = vi.fn();
    const mockSetPartner2Dob = vi.fn();
    const mockSetSyncServerUrl = vi.fn();
    const mockSetSyncPassphrase = vi.fn();
    const mockSetSyncHeaderKey = vi.fn();
    const mockSetRestoreSyncServerUrl = vi.fn();
    const mockSetRestoreSyncPassphrase = vi.fn();
    const mockSetRestoreSyncHeaderKey = vi.fn();
    const mockHandleGetStarted = vi.fn();
    const mockHandleRestore = vi.fn();

    const defaultMockReturn = {
        partner1Name: '',
        setPartner1Name: mockSetPartner1Name,
        partner1Dob: '',
        setPartner1Dob: mockSetPartner1Dob,
        partner2Name: '',
        setPartner2Name: mockSetPartner2Name,
        partner2Dob: '',
        setPartner2Dob: mockSetPartner2Dob,
        syncServerUrl: '',
        setSyncServerUrl: mockSetSyncServerUrl,
        syncPassphrase: '',
        setSyncPassphrase: mockSetSyncPassphrase,
        syncHeaderKey: '',
        setSyncHeaderKey: mockSetSyncHeaderKey,
        restoreSyncServerUrl: '',
        setRestoreSyncServerUrl: mockSetRestoreSyncServerUrl,
        restoreSyncPassphrase: '',
        setRestoreSyncPassphrase: mockSetRestoreSyncPassphrase,
        restoreSyncHeaderKey: '',
        setRestoreSyncHeaderKey: mockSetRestoreSyncHeaderKey,
        isRestoring: false,
        restoreError: null,
        handleGetStarted: mockHandleGetStarted,
        handleRestore: mockHandleRestore,
    };

    it('renders welcome header and main setup sections', () => {
        (useSimplifiedAppSetup as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SimplifiedAppSetupPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Welcome to The Chaser')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Start New Setup' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Restore from Remote Server' })).toBeInTheDocument();
    });

    it('disables Get Started button when Partner 1 name is empty', () => {
        (useSimplifiedAppSetup as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SimplifiedAppSetupPage />
            </BrowserRouter>
        );

        const getStartedBtn = screen.getByRole('button', { name: /Get Started/i });
        expect(getStartedBtn).toBeDisabled();
    });

    it('enables Get Started button and calls handleGetStarted on click when Partner 1 name is provided', () => {
        (useSimplifiedAppSetup as any).mockReturnValue({
            ...defaultMockReturn,
            partner1Name: 'Alex',
        });

        render(
            <BrowserRouter>
                <SimplifiedAppSetupPage />
            </BrowserRouter>
        );

        const getStartedBtn = screen.getByRole('button', { name: /Get Started/i });
        expect(getStartedBtn).not.toBeDisabled();

        fireEvent.click(getStartedBtn);
        expect(mockHandleGetStarted).toHaveBeenCalledTimes(1);
    });

    it('handles partner name and DOB input changes', () => {
        (useSimplifiedAppSetup as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SimplifiedAppSetupPage />
            </BrowserRouter>
        );

        const p1NameInput = screen.getByLabelText(/Partner 1 Name/i);
        fireEvent.change(p1NameInput, { target: { value: 'Alex' } });
        expect(mockSetPartner1Name).toHaveBeenCalledWith('Alex');

        const p2NameInput = screen.getByLabelText(/Partner 2 Name/i);
        fireEvent.change(p2NameInput, { target: { value: 'Sam' } });
        expect(mockSetPartner2Name).toHaveBeenCalledWith('Sam');
    });

    it('disables Remote Load button when URL or passphrase is missing', () => {
        (useSimplifiedAppSetup as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <SimplifiedAppSetupPage />
            </BrowserRouter>
        );

        const restoreBtn = screen.getByRole('button', { name: /Remote Load/i });
        expect(restoreBtn).toBeDisabled();
    });

    it('enables Remote Load button and calls handleRestore when required fields are populated', () => {
        (useSimplifiedAppSetup as any).mockReturnValue({
            ...defaultMockReturn,
            restoreSyncServerUrl: 'https://sync.example.com',
            restoreSyncPassphrase: 'my-passphrase',
        });

        render(
            <BrowserRouter>
                <SimplifiedAppSetupPage />
            </BrowserRouter>
        );

        const restoreBtn = screen.getByRole('button', { name: /Remote Load/i });
        expect(restoreBtn).not.toBeDisabled();

        fireEvent.click(restoreBtn);
        expect(mockHandleRestore).toHaveBeenCalledTimes(1);
    });

    it('displays error message and restoring state during remote load', () => {
        (useSimplifiedAppSetup as any).mockReturnValue({
            ...defaultMockReturn,
            restoreSyncServerUrl: 'https://sync.example.com',
            restoreSyncPassphrase: 'my-passphrase',
            isRestoring: true,
            restoreError: 'Failed to fetch data',
        });

        render(
            <BrowserRouter>
                <SimplifiedAppSetupPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Restoring.../i })).toBeDisabled();
    });
});
