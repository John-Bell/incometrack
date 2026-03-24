import { describe, it, expect } from 'vitest';
import { TaxCalculationService } from './TaxCalculationService';
import { getTaxConstants, TAX_YEAR_CONSTANTS } from '../constants/taxConstants';
import type { TaxCalculationInput } from '../models/TaxCalculationInput';

const CURRENT_TAX_YEAR = '2025-2026';
const PRIOR_TAX_YEAR = '2024-2025';

describe('TaxCalculationService', () => {
  it('calculates tax for a basic rate taxpayer (salary, savings, dividends)', () => {
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const service = new TaxCalculationService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const input: TaxCalculationInput = {
      salary: 30000,
      pensionIncome: 0,
      untaxedInterest: 1000,
      dividends: 500,
      directPensionContrib: 0,
      otherIncome: 5000,
    };
    const result = service.calculateTax(input, CURRENT_TAX_YEAR);
    expect(result.personalAllowance).toBe(constants.StandardPersonalAllowance);
    expect(result.brbExtended).toBe(constants.BasicRateBand);
    expect(result.incomeBreakdown.generalIncome).toBe(35000);
    expect(result.incomeBreakdown.savingsIncome).toBe(1000);
    expect(result.incomeBreakdown.dividendIncome).toBe(500);
    const generalTax = result.taxByBand.filter(b => b.type === constants.GeneralBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(generalTax).toBeCloseTo(4486, 0);
    const savingsTax = result.taxByBand.filter(b => b.type === constants.SavingsBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(savingsTax).toBe(0);
    const dividendTax = result.taxByBand.filter(b => b.type === constants.DividendsBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(dividendTax).toBe(0);
  });

  it('calculates tax for a high earner with personal allowance reduction', () => {
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const service = new TaxCalculationService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const input: TaxCalculationInput = {
      salary: 110000,
      pensionIncome: 0,
      untaxedInterest: 0,
      dividends: 0,
      directPensionContrib: 0,
    };
    const result = service.calculateTax(input, CURRENT_TAX_YEAR);
    expect(result.personalAllowance).toBeLessThan(constants.StandardPersonalAllowance);
    expect(result.personalAllowance).toBeGreaterThan(0);
  });

  it('calculates tax for an additional rate taxpayer (no personal allowance)', () => {
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const service = new TaxCalculationService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const input: TaxCalculationInput = {
      salary: 150000,
      pensionIncome: 0,
      untaxedInterest: 5000,
      dividends: 10000,
      directPensionContrib: 0,
    };
    const result = service.calculateTax(input, CURRENT_TAX_YEAR);
    expect(result.personalAllowance).toBe(0);
    expect(result.brbExtended).toBe(constants.BasicRateBand);
    expect(result.incomeBreakdown.generalIncome).toBe(150000);
    expect(result.incomeBreakdown.savingsIncome).toBe(5000);
    expect(result.incomeBreakdown.dividendIncome).toBe(10000);
    const generalTax = result.taxByBand.filter(b => b.type === constants.GeneralBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(generalTax).toBeGreaterThan(0);
    const savingsTax = result.taxByBand.filter(b => b.type === constants.SavingsBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(savingsTax).toBeGreaterThan(0);
    const dividendTax = result.taxByBand.filter(b => b.type === constants.DividendsBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(dividendTax).toBeGreaterThan(0);
  });

  it('calculates tax with extended basic rate band due to pension contributions', () => {
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const service = new TaxCalculationService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const input: TaxCalculationInput = {
      salary: 110270,
      pensionIncome: 0,
      untaxedInterest: 0,
      dividends: 0,
      directPensionContrib: 60000,
    };
    const result = service.calculateTax(input, CURRENT_TAX_YEAR);
    expect(result.personalAllowance).toBe(constants.StandardPersonalAllowance);
    expect(result.brbExtended).toBe(constants.BasicRateBand + 60000);
    const generalBands = result.taxByBand.filter(b => b.type === constants.GeneralBandType);
    const basicRateTax = generalBands.filter(b => b.rate === constants.BasicRate).reduce((sum, b) => sum + b.tax, 0);
    expect(result.totalTax).toBeCloseTo(basicRateTax, 2);
    expect(generalBands.some(b => b.rate === constants.HigherRate)).toBe(false);
  });

  it('calculates tax for a complex scenario (savings, dividends, pension contrib, other income)', () => {
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const service = new TaxCalculationService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const input: TaxCalculationInput = {
      salary: 0,
      pensionIncome: 0,
      untaxedInterest: 2000,
      dividends: 20000,
      directPensionContrib: 5000,
      otherIncome: 25000,
    };
    const result = service.calculateTax(input, CURRENT_TAX_YEAR);
    expect(result.incomeBreakdown.generalIncome).toBe(25000);
    expect(result.incomeBreakdown.savingsIncome).toBe(2000);
    expect(result.incomeBreakdown.dividendIncome).toBe(20000);
    expect(result.brbExtended).toBe(constants.BasicRateBand + 5000);
    const generalTax = result.taxByBand.filter(b => b.type === constants.GeneralBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(generalTax).toBeGreaterThan(0);
    const savingsTax = result.taxByBand.filter(b => b.type === constants.SavingsBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(savingsTax).toBeGreaterThan(0);
    const dividendTax = result.taxByBand.filter(b => b.type === constants.DividendsBandType).reduce((sum, b) => sum + b.tax, 0);
    expect(dividendTax).toBeGreaterThan(0);
  });

  it('uses the supplied tax year when calculating tax', () => {
    const priorConstants = getTaxConstants(PRIOR_TAX_YEAR);
    const currentConstants = getTaxConstants(CURRENT_TAX_YEAR);
    const service = new TaxCalculationService(TAX_YEAR_CONSTANTS);

    const commonInput: TaxCalculationInput = {
      salary: 0,
      pensionIncome: 0,
      untaxedInterest: 0,
      dividends: 2000,
      directPensionContrib: 0,
    };

    const priorYearResult = service.calculateTax(commonInput, PRIOR_TAX_YEAR);
    const currentYearResult = service.calculateTax(commonInput, CURRENT_TAX_YEAR);

    const priorDividendAllowance = priorYearResult.taxByBand.find(b => b.type === priorConstants.DividendsBandType && b.rate === 0)?.amount;
    const currentDividendAllowance = currentYearResult.taxByBand.find(b => b.type === currentConstants.DividendsBandType && b.rate === 0)?.amount;

    expect(priorConstants.DividendAllowance).not.toBe(currentConstants.DividendAllowance);
    expect(priorDividendAllowance).toBe(priorConstants.DividendAllowance);
    expect(currentDividendAllowance).toBe(currentConstants.DividendAllowance);
  });
});
