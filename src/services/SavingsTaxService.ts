import { getDefaultTaxYear, type TaxRulesByYear } from '../constants/taxConstants';
import { BrbTracker } from '../models/BrbTracker';
import type { TaxBandResult } from '../models/TaxBandResult';

export class SavingsTaxService {
  private taxRules: TaxRulesByYear;
  private readonly taxYear?: string;

  constructor(taxRules: TaxRulesByYear, taxYear?: string) {
    this.taxRules = taxRules;
    this.taxYear = taxYear;
  }

  calculateSavingsTax(
    savingsIncome: number,
    grossNonSavingsIncome: number,
    personalAllowance: number,
    brbTracker: BrbTracker,
    generalTaxBands: TaxBandResult[] = [],
    taxYear?: string
  ): TaxBandResult[] {
    const resolvedTaxYear = getDefaultTaxYear(taxYear ?? this.taxYear);
    const taxConstants = this.taxRules[resolvedTaxYear];
    const taxBands: TaxBandResult[] = [];
    if (savingsIncome <= 0) return taxBands;

    let remainingSavings = savingsIncome;
    let maxRateApplied = generalTaxBands && generalTaxBands.length > 0 ? Math.max(...generalTaxBands.map(b => b.rate)) : 0;

    // 1. APPLY UNUSED PERSONAL ALLOWANCE FIRST
    const unusedPA = Math.max(0, personalAllowance - grossNonSavingsIncome);
    if (unusedPA > 0) {
      const paApplied = Math.min(remainingSavings, unusedPA);
      if (paApplied > 0) {
        taxBands.push({
          band: 'Personal Allowance', // Or however you define this in your constants
          type: taxConstants.SavingsBandType,
          amount: paApplied,
          rate: 0,
          tax: 0,
        });
        remainingSavings -= paApplied;
      }
    }

    // STARTING RATE
    // 2. CALCULATE STARTING RATE FOR SAVINGS
    // The £5,000 band is reduced by £1 for every £1 of non-savings income *above* the PA.
    const taxableNonSavingsIncome = Math.max(0, grossNonSavingsIncome - personalAllowance);
    const startingRateLimit = Math.max(0, taxConstants.StartingRateForSavingsThreshold - taxableNonSavingsIncome);

    if (startingRateLimit > 0 && remainingSavings > 0) {
      const startingApplied = Math.min(remainingSavings, startingRateLimit);
      taxBands.push({
        band: taxConstants.StartingBand,
        type: taxConstants.SavingsBandType,
        amount: startingApplied,
        rate: taxConstants.StartingRateForSavings,
        tax: 0,
      });
      remainingSavings -= startingApplied;
    }

    // Collect all bands before applying savings allowance
    const pendingBands: TaxBandResult[] = [];
    function addBand(bandName: string, income: number, rate: number) {
      if (income <= 0) return;
      maxRateApplied = Math.max(maxRateApplied, rate);
      pendingBands.push({
        band: bandName,
        type: taxConstants.SavingsBandType,
        amount: income,
        rate: rate,
        tax: income * rate,
      });
    }

    // BASIC RATE BAND
    const basicRateUsed = brbTracker.use(remainingSavings);
    addBand(taxConstants.BasicBand, basicRateUsed, taxConstants.BasicRate);
    remainingSavings -= basicRateUsed;

    // HIGHER RATE BAND
    const higherRateLimit = taxConstants.HigherRateBand - taxConstants.BasicRateBand;
    const higherRateUsed = Math.min(remainingSavings, higherRateLimit);
    addBand(taxConstants.HigherBand, higherRateUsed, taxConstants.HigherRate);
    remainingSavings -= higherRateUsed;

    // ADDITIONAL RATE BAND
    addBand(taxConstants.AdditionalBand, remainingSavings, taxConstants.AdditionalRate);

    // Now apply savings allowance based on max rate seen
    let savingsAllowance =
      maxRateApplied >= taxConstants.AdditionalRate
        ? taxConstants.SavingsAllowanceAdditional
        : maxRateApplied >= taxConstants.HigherRate
          ? taxConstants.SavingsAllowanceHigher
          : taxConstants.SavingsAllowanceBasic;

    for (const band of pendingBands) {
      const originalAmount = band.amount;
      const allowanceApplied = Math.min(originalAmount, savingsAllowance);
      if (allowanceApplied > 0) {
        taxBands.push({
          band: band.band,
          type: band.type,
          amount: allowanceApplied,
          rate: 0,
          tax: 0,
        });
      }
      const taxableAmount = originalAmount - allowanceApplied;
      if (taxableAmount > 0) {
        taxBands.push({
          band: band.band,
          type: band.type,
          amount: taxableAmount,
          rate: band.rate,
          tax: taxableAmount * band.rate,
        });
      }
      savingsAllowance -= allowanceApplied;
    }

    return taxBands;
  }
}
