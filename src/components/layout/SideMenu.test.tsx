import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SideMenu } from './SideMenu';
import { BrowserRouter } from 'react-router-dom';

describe('SideMenu', () => {
    it('renders navigation links but does not render Milestones', () => {
        render(
            <BrowserRouter>
                <SideMenu isOpen={true} onClose={() => {}} />
            </BrowserRouter>
        );

        expect(screen.getByText('Simulator')).toBeInTheDocument();
        expect(screen.getByText('Cashflow Projection')).toBeInTheDocument();
        expect(screen.getByText('Asset Burndown')).toBeInTheDocument();
        expect(screen.getByText('Asset Composition')).toBeInTheDocument();
        expect(screen.getByText('Budget Review')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Properties')).toBeInTheDocument();

        expect(screen.queryByText('Milestones')).not.toBeInTheDocument();
    });
});
