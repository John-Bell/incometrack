import { getTaxYearOrLatest, type TaxRulesByYear } from '../constants/taxConstants';
import { BrbTracker } from '../models/BrbTracker';
import type { TaxBandResult } from '../models/TaxBandResult';

export class DividendTaxService {
  private taxRules: TaxRulesByYear;
  private readonly taxYear?: string;

  constructor(taxRules: TaxRulesByYear, taxYear?: string) {
    this.taxRules = taxRules;
    this.taxYear = taxYear;
  }

  calculateDividendTax(dividendIncome: number, brbTracker: BrbTracker, taxYear?: string): TaxBandResult[] {
    const resolvedTaxYear = getTaxYearOrLatest(taxYear ?? this.taxYear);
    const taxConstants = this.taxRules[resolvedTaxYear];
    const taxBands: TaxBandResult[] = [];
    if (dividendIncome <= 0) return taxBands;

    // Apply dividend allowance
    let remainingDividends = dividendIncome;
    if (remainingDividends > 0 && taxConstants.DividendAllowance > 0) {
      const allowanceAmount = Math.min(remainingDividends, taxConstants.DividendAllowance);
      taxBands.push({
        band: taxConstants.AllowanceBand,
        type: taxConstants.DividendsBandType,
        amount: allowanceAmount,
        rate: 0,
        tax: 0,
      });
      remainingDividends -= allowanceAmount;
    }

    // Apply dividend rates to remaining amount
    if (remainingDividends > 0) {
      // Basic rate
      if (remainingDividends > 0 && brbTracker.remaining > 0) {
        const basicRateAmount = brbTracker.use(remainingDividends);
        taxBands.push({
          band: taxConstants.BasicBand,
          type: taxConstants.DividendsBandType,
          amount: basicRateAmount,
          rate: taxConstants.DividendBasicRate,
          tax: basicRateAmount * taxConstants.DividendBasicRate,
        });
        remainingDividends -= basicRateAmount;
      }

      // Higher rate
      if (remainingDividends > 0) {
        const higherRateAmount = Math.min(
          remainingDividends,
          taxConstants.HigherRateBand - taxConstants.BasicRateBand
        );
        taxBands.push({
          band: taxConstants.HigherBand,
          type: taxConstants.DividendsBandType,
          amount: higherRateAmount,
          rate: taxConstants.DividendHigherRate,
          tax: higherRateAmount * taxConstants.DividendHigherRate,
        });
        remainingDividends -= higherRateAmount;
      }

      // Additional rate
      if (remainingDividends > 0) {
        taxBands.push({
          band: taxConstants.AdditionalBand,
          type: taxConstants.DividendsBandType,
          amount: remainingDividends,
          rate: taxConstants.DividendAdditionalRate,
          tax: remainingDividends * taxConstants.DividendAdditionalRate,
        });
      }
    }
    return taxBands;
  }
}
