import { describe, it, expect } from 'vitest';
import { DividendTaxService } from './DividendTaxService';
import { BrbTracker } from '../models/BrbTracker';
import { getTaxConstants, TAX_YEAR_CONSTANTS } from '../constants/taxConstants';

const CURRENT_TAX_YEAR = '2025-2026';
const PRIOR_TAX_YEAR = '2024-2025';

describe('DividendTaxService', () => {
  it('calculates dividend tax for dividends only (allowance and basic rate)', () => {
    const taxYear = CURRENT_TAX_YEAR;
    const constants = getTaxConstants(taxYear);
    const service = new DividendTaxService(TAX_YEAR_CONSTANTS, taxYear);
    const dividendIncome = 10000;
    const brbTracker = new BrbTracker(constants.BasicRateBand); // All basic rate available

    const result = service.calculateDividendTax(dividendIncome, brbTracker, taxYear);

    const allowanceBand = result.find(b => b.band === constants.AllowanceBand);
    expect(allowanceBand).toBeDefined();
    expect(allowanceBand?.amount).toBe(constants.DividendAllowance);
    expect(allowanceBand?.tax).toBe(0);

    const basicBand = result.find(b => b.band === constants.BasicBand);
    expect(basicBand).toBeDefined();
    expect(basicBand?.amount).toBe(dividendIncome - constants.DividendAllowance);
    expect(basicBand?.rate).toBe(constants.DividendBasicRate);
    expect(basicBand?.tax).toBeCloseTo((dividendIncome - constants.DividendAllowance) * constants.DividendBasicRate, 2);

    expect(result.find(b => b.band === constants.HigherBand)).toBeUndefined();
    expect(result.find(b => b.band === constants.AdditionalBand)).toBeUndefined();

    const totalTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalTax).toBeCloseTo((dividendIncome - constants.DividendAllowance) * constants.DividendBasicRate, 2);
  });

  it('calculates dividend tax for higher rate taxpayer (allowance, basic, higher)', () => {
    const taxYear = CURRENT_TAX_YEAR;
    const constants = getTaxConstants(taxYear);
    const service = new DividendTaxService(TAX_YEAR_CONSTANTS, taxYear);
    const dividendIncome = 50000; // Large enough for all bands
    const brbTracker = new BrbTracker(0); // No basic rate left

    const result = service.calculateDividendTax(dividendIncome, brbTracker, taxYear);

    const allowanceBand = result.find(b => b.band === constants.AllowanceBand);
    expect(allowanceBand).toBeDefined();
    expect(allowanceBand?.amount).toBe(constants.DividendAllowance);
    expect(allowanceBand?.tax).toBe(0);

    expect(result.find(b => b.band === constants.BasicBand)).toBeUndefined();

    const higherBand = result.find(b => b.band === constants.HigherBand);
    expect(higherBand).toBeDefined();
    expect(higherBand?.amount).toBe(dividendIncome - constants.DividendAllowance);
    expect(higherBand?.rate).toBe(constants.DividendHigherRate);
    expect(higherBand?.tax).toBeCloseTo((dividendIncome - constants.DividendAllowance) * constants.DividendHigherRate, 2);

    expect(result.find(b => b.band === constants.AdditionalBand)).toBeUndefined();
  });

  it('calculates dividend tax for additional rate taxpayer (all bands)', () => {
    const taxYear = CURRENT_TAX_YEAR;
    const constants = getTaxConstants(taxYear);
    const service = new DividendTaxService(TAX_YEAR_CONSTANTS, taxYear);
    const dividendIncome = 200000; // Large enough for all bands
    const brbTracker = new BrbTracker(0); // No basic rate left

    const result = service.calculateDividendTax(dividendIncome, brbTracker, taxYear);

    const allowanceBand = result.find(b => b.band === constants.AllowanceBand);
    expect(allowanceBand).toBeDefined();
    expect(allowanceBand?.amount).toBe(constants.DividendAllowance);
    expect(allowanceBand?.tax).toBe(0);

    expect(result.find(b => b.band === constants.BasicBand)).toBeUndefined();

    const higherBand = result.find(b => b.band === constants.HigherBand);
    expect(higherBand).toBeDefined();
    expect(higherBand?.amount).toBe(constants.HigherRateBand - constants.BasicRateBand);
    expect(higherBand?.rate).toBe(constants.DividendHigherRate);
    expect(higherBand?.tax).toBeCloseTo((constants.HigherRateBand - constants.BasicRateBand) * constants.DividendHigherRate, 2);

    const additionalBand = result.find(b => b.band === constants.AdditionalBand);
    expect(additionalBand).toBeDefined();
    const expectedAdditional =
      dividendIncome -
      constants.DividendAllowance -
      (constants.HigherRateBand - constants.BasicRateBand);
    expect(additionalBand?.amount).toBe(expectedAdditional);
    expect(additionalBand?.rate).toBe(constants.DividendAdditionalRate);
    expect(additionalBand?.tax).toBeCloseTo(expectedAdditional * constants.DividendAdditionalRate, 2);
  });

  it('uses the tax year specific dividend allowance', () => {
    const priorYearService = new DividendTaxService(TAX_YEAR_CONSTANTS, PRIOR_TAX_YEAR);
    const priorConstants = getTaxConstants(PRIOR_TAX_YEAR);
    const priorResult = priorYearService.calculateDividendTax(2000, new BrbTracker(0), PRIOR_TAX_YEAR);
    const priorAllowance = priorResult.find(b => b.band === priorConstants.AllowanceBand);

    const currentService = new DividendTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const currentConstants = getTaxConstants(CURRENT_TAX_YEAR);
    const currentResult = currentService.calculateDividendTax(2000, new BrbTracker(0), CURRENT_TAX_YEAR);
    const currentAllowance = currentResult.find(b => b.band === currentConstants.AllowanceBand);

    expect(priorConstants.DividendAllowance).not.toBe(currentConstants.DividendAllowance);
    expect(priorAllowance?.amount).toBe(priorConstants.DividendAllowance);
    expect(currentAllowance?.amount).toBe(currentConstants.DividendAllowance);
  });
});
