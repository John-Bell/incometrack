import { getDefaultTaxYear, getTaxConstants } from '../constants/taxConstants';
import { BrbTracker } from '../models/BrbTracker';
import { PersonalAllowanceTracker } from '../models/PersonalAllowanceTracker';
import type { TaxCalculationInput } from '../models/TaxCalculationInput';
import type { TaxCalculationResult, IncomeBreakdown } from '../models/TaxCalculationResult';
import type { TaxBandResult } from '../models/TaxBandResult';
import { GeneralTaxService } from './GeneralTaxService';
import { SavingsTaxService } from './SavingsTaxService';
import { DividendTaxService } from './DividendTaxService';

export class TaxCalculationService {
  private generalTaxService: GeneralTaxService;
  private savingsTaxService: SavingsTaxService;
  private dividendTaxService: DividendTaxService;
  private taxYear?: string;

  constructor(taxYear?: string) {
    this.taxYear = taxYear;
    this.generalTaxService = new GeneralTaxService(taxYear);
    this.savingsTaxService = new SavingsTaxService(taxYear);
    this.dividendTaxService = new DividendTaxService(taxYear);
  }

  calculateTax(input: TaxCalculationInput, taxYear?: string): TaxCalculationResult {
    const resolvedTaxYear = getDefaultTaxYear(taxYear ?? this.taxYear);
    const taxConstants = getTaxConstants(resolvedTaxYear);
    const incomeBreakdown: IncomeBreakdown = this.calculateIncomeBreakdown(input);
    const taxByBand: TaxBandResult[] = [];

    // Calculate personal allowance
    const personalAllowance = this.calculatePersonalAllowance(
      this.getAdjustedNetIncome(input),
      taxConstants
    );

    // Calculate extended basic rate band
    const brbExtended = taxConstants.BasicRateBand + input.directPensionContrib;

    // Initialize trackers
    const brbTracker = new BrbTracker(brbExtended);
    const paTracker = new PersonalAllowanceTracker(personalAllowance);

    // Calculate tax for each income type
    const generalIncome = incomeBreakdown.generalIncome;
    const savingsIncome = incomeBreakdown.savingsIncome;
    const dividendIncome = incomeBreakdown.dividendIncome;

    // Apply personal allowance to general income first
    const generalIncomeAfterPA = paTracker.applyTo(generalIncome);

    // Calculate general income tax
    const generalBands = this.generalTaxService.calculateGeneralIncomeTax(
      generalIncomeAfterPA,
      brbTracker,
      resolvedTaxYear
    );
    taxByBand.push(...generalBands);

    // Calculate savings tax (pass generalBands)
    taxByBand.push(
      ...this.savingsTaxService.calculateSavingsTax(
        savingsIncome,
        generalIncome,
        personalAllowance,
        brbTracker,
        generalBands,
        resolvedTaxYear
      )
    );

    // Calculate dividend tax
    taxByBand.push(
      ...this.dividendTaxService.calculateDividendTax(
        dividendIncome,
        brbTracker,
        resolvedTaxYear
      )
    );

    // Calculate totals
    const totalTax = taxByBand.reduce((sum, band) => sum + band.tax, 0);
    const totalIncome = this.getTotalIncome(input);
    const effectiveTaxRate = totalIncome > 0 ? totalTax / totalIncome : 0;

    return {
      personalAllowance,
      brbExtended,
      incomeBreakdown,
      taxByBand,
      totalTax,
      effectiveTaxRate,
      taxableIncome: Math.max(
        0,
        incomeBreakdown.generalIncome +
          incomeBreakdown.savingsIncome +
          incomeBreakdown.dividendIncome -
          personalAllowance
      ),
    };
  }

  private calculateIncomeBreakdown(input: TaxCalculationInput): IncomeBreakdown {
    return {
      generalIncome: input.salary + input.rentalIncome + input.pensionIncome,
      savingsIncome: input.untaxedInterest,
      dividendIncome: input.dividends,
    };
  }

  private calculatePersonalAllowance(adjustedNetIncome: number, taxConstants = getTaxConstants()): number {
    if (adjustedNetIncome >= taxConstants.PersonalAllowanceRemovalThreshold) return 0;
    if (adjustedNetIncome <= taxConstants.PersonalAllowanceThreshold) return taxConstants.StandardPersonalAllowance;
    // Reduce allowance by 1 for every 2 over threshold
    const reduction = Math.floor(
      (adjustedNetIncome - taxConstants.PersonalAllowanceThreshold) * taxConstants.PersonalAllowanceReductionRate
    );
    return Math.max(0, taxConstants.StandardPersonalAllowance - reduction);
  }

  private getTotalIncome(input: TaxCalculationInput): number {
    return (
      input.salary +
      input.rentalIncome +
      input.pensionIncome +
      input.untaxedInterest +
      input.dividends +
      (input.otherIncome ?? 0)
    );
  }

  private getAdjustedNetIncome(input: TaxCalculationInput): number {
    return this.getTotalIncome(input) - input.directPensionContrib;
  }
}
