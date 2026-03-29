import { getDefaultTaxYear, type TaxRulesByYear } from '@/constants/taxConstants';
import { BrbTracker } from '@/models/BrbTracker';
import { PersonalAllowanceTracker } from '@/models/PersonalAllowanceTracker';
import type { TaxBandResult } from '@/models/TaxBandResult';

export class PropertyTaxService {
    private taxRules: TaxRulesByYear;
    private readonly taxYear?: string;

    constructor(taxRules: TaxRulesByYear, taxYear?: string) {
        this.taxRules = taxRules;
        this.taxYear = taxYear;
    }

    calculatePropertyTax(
        rentalIncome: number,
        propertyExpenses: number = 0,
        paTracker: PersonalAllowanceTracker,
        brbTracker: BrbTracker,
        taxYear?: string
    ): { taxBands: TaxBandResult[]; propertyAllowanceApplied: boolean; taxablePropertyIncome: number } {
        const resolvedTaxYear = getDefaultTaxYear(taxYear ?? this.taxYear);
        const taxConstants = this.taxRules[resolvedTaxYear];
        const taxBands: TaxBandResult[] = [];

        let taxablePropertyIncome = 0;
        let propertyAllowanceApplied = false;

        // 1. Determine Deductions (Allowance vs Actual Expenses)
        if (rentalIncome > 0 && propertyExpenses < taxConstants.PropertyAllowance) {
            const allowanceApplied = Math.min(rentalIncome, taxConstants.PropertyAllowance);
            taxablePropertyIncome = rentalIncome - allowanceApplied;
            propertyAllowanceApplied = true;
        } else {
            taxablePropertyIncome = Math.max(0, rentalIncome - propertyExpenses);
        }

        if (taxablePropertyIncome <= 0) {
            return { taxBands, propertyAllowanceApplied, taxablePropertyIncome };
        }

        // 2. Apply any leftover Personal Allowance
        let remainingIncome = paTracker.applyTo(taxablePropertyIncome);

        if (remainingIncome <= 0) {
            return { taxBands, propertyAllowanceApplied, taxablePropertyIncome };
        }

        // 3. Calculate Tax Bands
        const basicRate = taxConstants.RentalBasicRate;
        const higherRate = taxConstants.RentalHigherRate;
        const additionalRate = taxConstants.RentalAdditionalRate;

        // Basic rate
        if (remainingIncome > 0 && brbTracker.remaining > 0) {
            const basicRateAmount = brbTracker.use(remainingIncome);
            taxBands.push({
                band: taxConstants.BasicBand,
                type: taxConstants.PropertyBandType,
                amount: basicRateAmount,
                rate: basicRate,
                tax: basicRateAmount * basicRate,
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
                type: taxConstants.PropertyBandType,
                amount: higherRateAmount,
                rate: higherRate,
                tax: higherRateAmount * higherRate,
            });
            remainingIncome -= higherRateAmount;
        }

        // Additional rate
        if (remainingIncome > 0) {
            taxBands.push({
                band: taxConstants.AdditionalBand,
                type: taxConstants.PropertyBandType,
                amount: remainingIncome,
                rate: additionalRate,
                tax: remainingIncome * additionalRate,
            });
        }

        return { taxBands, propertyAllowanceApplied, taxablePropertyIncome };
    }
}