import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemoteSyncingPage } from './RemoteSyncingPage';
import { BrowserRouter } from 'react-router-dom';
import { useRemoteSyncing } from '@/hooks/useRemoteSyncing';

vi.mock('@/hooks/useRemoteSyncing', () => ({
    useRemoteSyncing: vi.fn(),
}));

describe('RemoteSyncingPage', () => {
    const mockNavigate = vi.fn();
    const mockSetSyncServerUrl = vi.fn();
    const mockSetSyncPassphrase = vi.fn();
    const mockSetSyncHeaderKey = vi.fn();
    const mockHandleUpdate = vi.fn();
    const mockHandleLoadFromRemote = vi.fn();
    const mockHandleSaveToRemote = vi.fn();

    const defaultMockReturn = {
        navigate: mockNavigate,
        syncServerUrl: 'https://sync.example.com/sync',
        setSyncServerUrl: mockSetSyncServerUrl,
        syncPassphrase: 'test-passphrase',
        setSyncPassphrase: mockSetSyncPassphrase,
        syncHeaderKey: 'test-header-key',
        setSyncHeaderKey: mockSetSyncHeaderKey,
        isUpdating: false,
        isProcessing: false,
        statusMessage: null,
        hasChanges: false,
        handleUpdate: mockHandleUpdate,
        handleLoadFromRemote: mockHandleLoadFromRemote,
        handleSaveToRemote: mockHandleSaveToRemote,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders header, inputs, and buttons with hook values', () => {
        (useRemoteSyncing as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <RemoteSyncingPage />
            </BrowserRouter>
        );

        expect(screen.getByRole('heading', { level: 2, name: 'Remote Syncing' })).toBeInTheDocument();
        expect(screen.getByLabelText('Sync Server URL')).toHaveValue('https://sync.example.com/sync');
        expect(screen.getByLabelText('Encryption Passphrase')).toHaveValue('test-passphrase');
        expect(screen.getByLabelText('Header Key')).toHaveValue('test-header-key');

        expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Load From Remote/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Save To Remote/i })).toBeEnabled();
    });

    it('handles input field changes', () => {
        (useRemoteSyncing as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <RemoteSyncingPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText('Sync Server URL'), { target: { value: 'https://new.url' } });
        expect(mockSetSyncServerUrl).toHaveBeenCalledWith('https://new.url');

        fireEvent.change(screen.getByLabelText('Encryption Passphrase'), { target: { value: 'new-pass' } });
        expect(mockSetSyncPassphrase).toHaveBeenCalledWith('new-pass');

        fireEvent.change(screen.getByLabelText('Header Key'), { target: { value: 'new-key' } });
        expect(mockSetSyncHeaderKey).toHaveBeenCalledWith('new-key');
    });

    it('renders status message when present', () => {
        (useRemoteSyncing as any).mockReturnValue({
            ...defaultMockReturn,
            statusMessage: { type: 'success', text: 'Settings updated successfully.' },
        });

        render(
            <BrowserRouter>
                <RemoteSyncingPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Settings updated successfully.')).toBeInTheDocument();
    });

    it('enables Update button when hasChanges is true and triggers handleUpdate', () => {
        (useRemoteSyncing as any).mockReturnValue({
            ...defaultMockReturn,
            hasChanges: true,
        });

        render(
            <BrowserRouter>
                <RemoteSyncingPage />
            </BrowserRouter>
        );

        const updateButton = screen.getByRole('button', { name: 'Update' });
        expect(updateButton).toBeEnabled();
        fireEvent.click(updateButton);
        expect(mockHandleUpdate).toHaveBeenCalledTimes(1);
    });

    it('triggers handleLoadFromRemote and handleSaveToRemote when buttons are clicked', () => {
        (useRemoteSyncing as any).mockReturnValue(defaultMockReturn);

        render(
            <BrowserRouter>
                <RemoteSyncingPage />
            </BrowserRouter>
        );

        const loadButton = screen.getByRole('button', { name: /Load From Remote/i });
        const saveButton = screen.getByRole('button', { name: /Save To Remote/i });

        fireEvent.click(loadButton);
        expect(mockHandleLoadFromRemote).toHaveBeenCalledTimes(1);

        fireEvent.click(saveButton);
        expect(mockHandleSaveToRemote).toHaveBeenCalledTimes(1);
    });
});
