import { getDefaultTaxYear, getTaxConstants, type TaxRulesByYear } from '../constants/taxConstants';
import { BrbTracker } from '../models/BrbTracker';
import { PersonalAllowanceTracker } from '../models/PersonalAllowanceTracker';
import type { TaxCalculationInput } from '../models/TaxCalculationInput';
import type { TaxCalculationResult, IncomeBreakdown } from '../models/TaxCalculationResult';
import type { TaxBandResult } from '../models/TaxBandResult';
import { GeneralTaxService } from './GeneralTaxService';
import { SavingsTaxService } from './SavingsTaxService';
import { DividendTaxService } from './DividendTaxService';
import { PropertyTaxService } from './PropertyTaxService';

export class TaxCalculationService {
  private taxRules: TaxRulesByYear;
  private generalTaxService: GeneralTaxService;
  private savingsTaxService: SavingsTaxService;
  private dividendTaxService: DividendTaxService;
  private propertyTaxService: PropertyTaxService;
  private taxYear?: string;

  constructor(taxRules: TaxRulesByYear, taxYear?: string) {
    this.taxRules = taxRules;
    this.taxYear = taxYear;
    this.generalTaxService = new GeneralTaxService(taxRules, taxYear);
    this.savingsTaxService = new SavingsTaxService(taxRules, taxYear);
    this.dividendTaxService = new DividendTaxService(taxRules, taxYear);
    this.propertyTaxService = new PropertyTaxService(taxRules, taxYear);
  }

  calculateTax(input: TaxCalculationInput, taxYear?: string): TaxCalculationResult {
    const resolvedTaxYear = getDefaultTaxYear(taxYear ?? this.taxYear);
    const taxConstants = this.taxRules[resolvedTaxYear];
    const incomeBreakdown: IncomeBreakdown = this.calculateIncomeBreakdown(input);
    const taxByBand: TaxBandResult[] = [];

    // Calculate personal allowance
    const personalAllowance = this.calculatePersonalAllowance(
      this.getAdjustedNetIncome(incomeBreakdown, input), taxConstants
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

    // --- NEW PROPERTY WIRING ---
    const propertyResult = this.propertyTaxService.calculatePropertyTax(
      input.rentalIncome,
      input.propertyExpenses ?? 0,
      paTracker,  // Pass the PA tracker so it can use leftover allowance
      brbTracker, // Pass the BRB tracker so it knows what band we are in
      resolvedTaxYear
    );
    taxByBand.push(...propertyResult.taxBands);

    // --- CRITICAL SAVINGS FIX ---
    // Combine bands so Savings knows if Property pushed the user into a higher rate
    const combinedNonSavingsBands = [...generalBands, ...propertyResult.taxBands];
    // Combine income so the Savings Starting Rate threshold calculates correctly
    const totalGrossNonSavingsIncome = generalIncome + propertyResult.taxablePropertyIncome;

    // Calculate savings tax (pass generalBands)
    taxByBand.push(
      ...this.savingsTaxService.calculateSavingsTax(
        savingsIncome,
        totalGrossNonSavingsIncome, // Use combined total here!
        personalAllowance,
        brbTracker,
        combinedNonSavingsBands,    // Use combined bands here!
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
    const totalIncome = this.getTotalIncome(incomeBreakdown, input);
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
        incomeBreakdown.rentalIncome +
        incomeBreakdown.savingsIncome +
        incomeBreakdown.dividendIncome -
        personalAllowance
      ),
      propertyAllowanceApplied: propertyResult.propertyAllowanceApplied
    };
  }

  private calculateIncomeBreakdown(input: TaxCalculationInput, taxYear?: string): IncomeBreakdown {
    const { taxablePropertyIncome } = this.propertyTaxService.calculateNetPropertyIncome(
      input.rentalIncome,
      input.propertyExpenses,
      taxYear
    );

    return {
      generalIncome: input.salary + input.pensionIncome,
      rentalIncome: taxablePropertyIncome, // <-- Safe to use: This is now the true Net Profit
      savingsIncome: input.untaxedInterest,
      dividendIncome: input.dividends,
    };
  }

  private calculatePersonalAllowance(adjustedNetIncome: number, taxConstants: ReturnType<typeof getTaxConstants>): number {
    if (adjustedNetIncome >= taxConstants.PersonalAllowanceRemovalThreshold) return 0;
    if (adjustedNetIncome <= taxConstants.PersonalAllowanceThreshold) return taxConstants.StandardPersonalAllowance;
    // Reduce allowance by 1 for every 2 over threshold
    const reduction = Math.floor(
      (adjustedNetIncome - taxConstants.PersonalAllowanceThreshold) * taxConstants.PersonalAllowanceReductionRate
    );
    return Math.max(0, taxConstants.StandardPersonalAllowance - reduction);
  }

  private getTotalIncome(breakdown: IncomeBreakdown, input: TaxCalculationInput): number {
    return (
      breakdown.generalIncome +
      breakdown.rentalIncome + // <-- FIX: Now using the netted breakdown figure
      breakdown.savingsIncome +
      breakdown.dividendIncome +
      (input.otherIncome ?? 0)
    );
  }

  private getAdjustedNetIncome(breakdown: IncomeBreakdown, input: TaxCalculationInput): number {
    return this.getTotalIncome(breakdown, input) - input.directPensionContrib;
  }
}
