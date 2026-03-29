import { describe, it, expect } from 'vitest';
import { PropertyTaxService } from './PropertyTaxService';
import { BrbTracker } from '../models/BrbTracker';
import { PersonalAllowanceTracker } from '../models/PersonalAllowanceTracker';
import { getTaxConstants, TAX_YEAR_CONSTANTS } from '../constants/taxConstants';

const CURRENT_TAX_YEAR = '2025-2026';

describe('PropertyTaxService', () => {
    const constants = getTaxConstants(CURRENT_TAX_YEAR);

    it('returns empty results if there is no rental income', () => {
        const service = new PropertyTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
        const paTracker = new PersonalAllowanceTracker(constants.StandardPersonalAllowance);
        const brbTracker = new BrbTracker(constants.BasicRateBand);

        const result = service.calculatePropertyTax(0, 0, paTracker, brbTracker, CURRENT_TAX_YEAR);

        expect(result.taxablePropertyIncome).toBe(0);
        expect(result.propertyAllowanceApplied).toBe(false);
        expect(result.taxBands.length).toBe(0);
    });

    it('auto-applies the £1,000 Property Allowance if expenses are lower', () => {
        const service = new PropertyTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
        const paTracker = new PersonalAllowanceTracker(0); // Simulate PA already used up by salary
        const brbTracker = new BrbTracker(constants.BasicRateBand);

        // £5000 gross income, £400 actual expenses
        const result = service.calculatePropertyTax(5000, 400, paTracker, brbTracker, CURRENT_TAX_YEAR);

        expect(result.propertyAllowanceApplied).toBe(true);
        expect(result.taxablePropertyIncome).toBe(4000); // £5000 - £1000 flat allowance

        // Assert the tax was calculated on the £4000
        expect(result.taxBands.length).toBe(1);
        expect(result.taxBands[0].amount).toBe(4000);
        expect(result.taxBands[0].tax).toBe(4000 * constants.BasicRate);
    });

    it('deducts actual expenses if they exceed the £1,000 Property Allowance', () => {
        const service = new PropertyTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
        const paTracker = new PersonalAllowanceTracker(0); // Simulate PA already used up
        const brbTracker = new BrbTracker(constants.BasicRateBand);

        // £5000 gross income, £1500 actual expenses
        const result = service.calculatePropertyTax(5000, 1500, paTracker, brbTracker, CURRENT_TAX_YEAR);

        expect(result.propertyAllowanceApplied).toBe(false); // Flag should be false!
        expect(result.taxablePropertyIncome).toBe(3500); // £5000 - £1500 actuals

        // Assert the tax was calculated on the £3500
        expect(result.taxBands.length).toBe(1);
        expect(result.taxBands[0].amount).toBe(3500);
        expect(result.taxBands[0].tax).toBe(3500 * constants.BasicRate);
    });

    it('absorbs taxable property income if there is leftover Personal Allowance', () => {
        const service = new PropertyTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
        const paTracker = new PersonalAllowanceTracker(constants.StandardPersonalAllowance); // Full PA available
        const brbTracker = new BrbTracker(constants.BasicRateBand);

        // £5000 gross income, 0 expenses. Taxable = £4000.
        const result = service.calculatePropertyTax(5000, 0, paTracker, brbTracker, CURRENT_TAX_YEAR);

        expect(result.propertyAllowanceApplied).toBe(true);
        expect(result.taxablePropertyIncome).toBe(4000);

        // The £4,000 taxable income is fully absorbed by the £12,570 PA.
        // Therefore, it should generate exactly 0 tax bands.
        expect(result.taxBands.length).toBe(0);
    });

    it('splits property income correctly across Basic and Higher rate bands', () => {
        const service = new PropertyTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
        const paTracker = new PersonalAllowanceTracker(0); // PA exhausted

        // Simulate only £2,000 of Basic Rate Band remaining (e.g. used up by £35k salary)
        const brbTracker = new BrbTracker(2000);

        // £6000 gross income, 0 expenses. Taxable = £5000.
        const result = service.calculatePropertyTax(6000, 0, paTracker, brbTracker, CURRENT_TAX_YEAR);

        expect(result.taxablePropertyIncome).toBe(5000);
        expect(result.taxBands.length).toBe(2);

        // The first £2,000 should consume the rest of the Basic Rate Band
        expect(result.taxBands[0].band).toBe(constants.BasicBand);
        expect(result.taxBands[0].amount).toBe(2000);
        expect(result.taxBands[0].tax).toBe(2000 * constants.BasicRate);

        // The remaining £3,000 should spill over into the Higher Rate Band
        expect(result.taxBands[1].band).toBe(constants.HigherBand);
        expect(result.taxBands[1].amount).toBe(3000);
        expect(result.taxBands[1].tax).toBe(3000 * constants.HigherRate);
    });
});