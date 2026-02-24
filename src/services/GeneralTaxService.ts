import { getTaxConstants } from '../constants/taxConstants';
import { BrbTracker } from '../models/BrbTracker';
import type { TaxBandResult } from '../models/TaxBandResult';

export class GeneralTaxService {
  private readonly taxYear?: string;

  constructor(taxYear?: string) {
    this.taxYear = taxYear;
  }

  calculateGeneralIncomeTax(
    income: number,
    brbTracker: BrbTracker,
    taxYear?: string
  ): TaxBandResult[] {
    const taxConstants = getTaxConstants(taxYear ?? this.taxYear);
    const taxBands: TaxBandResult[] = [];
    let remainingIncome = income;

    // Basic rate
    if (remainingIncome > 0 && brbTracker.remaining > 0) {
      const basicRateAmount = brbTracker.use(remainingIncome);
      taxBands.push({
        band: taxConstants.BasicBand,
        type: taxConstants.GeneralBandType,
        amount: basicRateAmount,
        rate: taxConstants.BasicRate,
        tax: basicRateAmount * taxConstants.BasicRate,
      });
      remainingIncome -= basicRateAmount;
    }

    // Higher rate
    if (remainingIncome > 0) {
      const higherRateAmount = Math.min(
        remainingIncome,
        taxConstants.HigherRateBand - taxConstants.BasicRateBand
      );
      taxBands.push({
        band: taxConstants.HigherBand,
        type: taxConstants.GeneralBandType,
        amount: higherRateAmount,
        rate: taxConstants.HigherRate,
        tax: higherRateAmount * taxConstants.HigherRate,
      });
      remainingIncome -= higherRateAmount;
    }

    // Additional rate
    if (remainingIncome > 0) {
      taxBands.push({
        band: taxConstants.AdditionalBand,
        type: taxConstants.GeneralBandType,
        amount: remainingIncome,
        rate: taxConstants.AdditionalRate,
        tax: remainingIncome * taxConstants.AdditionalRate,
      });
    }

    return taxBands;
  }
}
