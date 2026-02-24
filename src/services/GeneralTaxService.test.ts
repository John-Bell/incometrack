import { describe, it, expect } from 'vitest';
import { SavingsTaxService } from './SavingsTaxService';
import { GeneralTaxService } from './GeneralTaxService';
import { BrbTracker } from '../models/BrbTracker';
import { getTaxConstants } from '../constants/taxConstants';

const CURRENT_TAX_YEAR = '2025-2026';
const PRIOR_TAX_YEAR = '2024-2025';

describe('GeneralTaxService (Savings Tax Scenarios)', () => {
  it('calculates savings tax for basic rate taxpayer (all covered by allowance)', () => {
    // Arrange
    const service = new SavingsTaxService(CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const savingsIncome = 1000; // All covered by allowance
    const grossNonSavingsIncome = 35000; // Salary + rental
    const personalAllowance = constants.StandardPersonalAllowance; // 12570
    const brbTracker = new BrbTracker(constants.BasicRateBand); // 37700

    // Act
    const result = service.calculateSavingsTax(
      savingsIncome,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      [],
      CURRENT_TAX_YEAR
    );

    // Assert
    const allowanceBand = result.find(b => b.band === constants.BasicBand && b.rate === 0);
    expect(allowanceBand).toBeDefined();
    expect(allowanceBand?.amount).toBe(constants.SavingsAllowanceBasic);
    expect(allowanceBand?.tax).toBe(0);

    expect(result.length).toBe(1);
    const totalSavingsTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalSavingsTax).toBe(0);
  });

  it('calculates savings tax for higher rate taxpayer (partial allowance, rest taxed at 40%)', () => {
    const service = new SavingsTaxService(CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const savingsIncome = 2000; // 500 allowance, 1500 taxed at 40%
    const grossNonSavingsIncome = 60000; // Higher rate
    const personalAllowance = constants.StandardPersonalAllowance; // 12570
    const brbTracker = new BrbTracker(0); // No basic rate band left
    const generalBands = [
      {
        band: constants.HigherBand,
        type: constants.GeneralBandType,
        amount: 0,
        rate: constants.HigherRate,
        tax: 0
      }
    ];

    const result = service.calculateSavingsTax(
      savingsIncome,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      generalBands,
      CURRENT_TAX_YEAR
    );

    const allowanceBand = result.find(b => b.band === constants.HigherBand && b.rate === 0);
    expect(allowanceBand).toBeDefined();
    expect(allowanceBand?.amount).toBe(constants.SavingsAllowanceHigher);
    expect(allowanceBand?.tax).toBe(0);

    const higherRateBand = result.find(b => b.band === constants.HigherBand && b.rate === constants.HigherRate);
    expect(higherRateBand).toBeDefined();
    expect(higherRateBand?.amount).toBe(2000 - constants.SavingsAllowanceHigher);
    expect(higherRateBand?.tax).toBeCloseTo((2000 - constants.SavingsAllowanceHigher) * constants.HigherRate);

    const totalSavingsTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalSavingsTax).toBeCloseTo((2000 - constants.SavingsAllowanceHigher) * constants.HigherRate);
  });

  it('returns no bands and zero tax when there is no savings income', () => {
    const service = new SavingsTaxService(CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const savingsIncome = 0;
    const grossNonSavingsIncome = 20000;
    const personalAllowance = constants.StandardPersonalAllowance;
    const brbTracker = new BrbTracker(constants.BasicRateBand);
    const result = service.calculateSavingsTax(
      savingsIncome,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      [],
      CURRENT_TAX_YEAR
    );
    expect(result.length).toBe(0);
    const totalSavingsTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalSavingsTax).toBe(0);
  });

  it('calculates savings tax using all bands (basic, higher, additional)', () => {
    const service = new SavingsTaxService(CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const savingsIncome = 200000; // Large savings income
    const grossNonSavingsIncome = 0; // All bands available
    const personalAllowance = constants.StandardPersonalAllowance;
    const brbTracker = new BrbTracker(constants.BasicRateBand); // 37700
    const result = service.calculateSavingsTax(
      savingsIncome,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      [],
      CURRENT_TAX_YEAR
    );
    expect(result.some(b => b.band === constants.BasicBand)).toBe(true);
    expect(result.some(b => b.band === constants.HigherBand)).toBe(true);
    expect(result.some(b => b.band === constants.AdditionalBand)).toBe(true);
    const additionalBand = result.find(b => b.band === constants.AdditionalBand);
    expect(additionalBand).toBeDefined();
    expect(additionalBand!.amount).toBeGreaterThan(0);
  });

  it('does not apply starting rate for savings if no personal allowance', () => {
    const service = new SavingsTaxService(CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const savingsIncome = 6000;
    const grossNonSavingsIncome = 130000; // High income
    const personalAllowance = 0; // No personal allowance
    const brbTracker = new BrbTracker(constants.BasicRateBand);
    const result = service.calculateSavingsTax(
      savingsIncome,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      [],
      CURRENT_TAX_YEAR
    );
    expect(result.some(b => b.band === constants.StartingBand)).toBe(false);
  });

  it('applies the tax year specific savings allowance', () => {
    const higherRateBands = [
      {
        band: getTaxConstants(PRIOR_TAX_YEAR).HigherBand,
        type: getTaxConstants(PRIOR_TAX_YEAR).GeneralBandType,
        amount: 0,
        rate: getTaxConstants(PRIOR_TAX_YEAR).HigherRate,
        tax: 0,
      }
    ];

    const priorYearService = new SavingsTaxService(PRIOR_TAX_YEAR);
    const priorYearConstants = getTaxConstants(PRIOR_TAX_YEAR);
    const priorYearResult = priorYearService.calculateSavingsTax(
      1500,
      60000,
      priorYearConstants.StandardPersonalAllowance,
      new BrbTracker(0),
      higherRateBands,
      PRIOR_TAX_YEAR
    );
    const priorYearAllowance = priorYearResult.find(b => b.band === priorYearConstants.HigherBand && b.rate === 0);

    const currentYearService = new SavingsTaxService(CURRENT_TAX_YEAR);
    const currentYearConstants = getTaxConstants(CURRENT_TAX_YEAR);
    const currentYearResult = currentYearService.calculateSavingsTax(
      1500,
      60000,
      currentYearConstants.StandardPersonalAllowance,
      new BrbTracker(0),
      [
        {
          band: currentYearConstants.HigherBand,
          type: currentYearConstants.GeneralBandType,
          amount: 0,
          rate: currentYearConstants.HigherRate,
          tax: 0,
        }
      ],
      CURRENT_TAX_YEAR
    );
    const currentYearAllowance = currentYearResult.find(b => b.band === currentYearConstants.HigherBand && b.rate === 0);

    expect(priorYearConstants.SavingsAllowanceHigher).not.toBe(currentYearConstants.SavingsAllowanceHigher);
    expect(priorYearAllowance?.amount).toBe(priorYearConstants.SavingsAllowanceHigher);
    expect(currentYearAllowance?.amount).toBe(currentYearConstants.SavingsAllowanceHigher);
  });
});

describe('GeneralTaxService', () => {
  it('calculates basic rate tax correctly', () => {
    const taxYear = CURRENT_TAX_YEAR;
    const constants = getTaxConstants(taxYear);
    const service = new GeneralTaxService(taxYear);
    const income = 50000;
    const brbTracker = new BrbTracker(constants.BasicRateBand);
    const taxBands = service.calculateGeneralIncomeTax(income, brbTracker, taxYear);
    const basicRateBand = taxBands.find(b => b.band === constants.BasicBand && b.type === constants.GeneralBandType);
    expect(basicRateBand).toBeDefined();
    expect(basicRateBand?.amount).toBe(constants.BasicRateBand);
    expect(basicRateBand?.tax).toBeCloseTo(constants.BasicRateBand * constants.BasicRate);
  });

  it('calculates higher rate tax correctly', () => {
    const taxYear = CURRENT_TAX_YEAR;
    const constants = getTaxConstants(taxYear);
    const service = new GeneralTaxService(taxYear);
    const income = 100000;
    const brbTracker = new BrbTracker(constants.BasicRateBand);
    const taxBands = service.calculateGeneralIncomeTax(income, brbTracker, taxYear);
    const higherRateBand = taxBands.find(b => b.band === constants.HigherBand && b.type === constants.GeneralBandType);
    expect(higherRateBand).toBeDefined();
    expect(higherRateBand?.amount).toBe(100000 - constants.BasicRateBand);
    expect(higherRateBand?.tax).toBeCloseTo((100000 - constants.BasicRateBand) * constants.HigherRate);
  });

  it('calculates additional rate tax correctly', () => {
    const taxYear = CURRENT_TAX_YEAR;
    const constants = getTaxConstants(taxYear);
    const service = new GeneralTaxService(taxYear);
    const income = 200000;
    const brbTracker = new BrbTracker(constants.BasicRateBand);
    const taxBands = service.calculateGeneralIncomeTax(income, brbTracker, taxYear);
    const additionalRateBand = taxBands.find(b => b.band === constants.AdditionalBand && b.type === constants.GeneralBandType);
    expect(additionalRateBand).toBeDefined();
    expect(additionalRateBand?.amount).toBe(200000 - constants.HigherRateBand);
    expect(additionalRateBand?.tax).toBeCloseTo((200000 - constants.HigherRateBand) * constants.AdditionalRate);
  });
});
