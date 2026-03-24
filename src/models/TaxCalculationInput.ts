export interface TaxCalculationInput {
  salary: number;
  pensionIncome: number;
  untaxedInterest: number;
  dividends: number;
  directPensionContrib: number;
  otherIncome?: number;
}

export function getTotalIncome(input: TaxCalculationInput): number {
  return (
    input.salary +
    input.pensionIncome +
    input.untaxedInterest +
    input.dividends +
    (input.otherIncome ?? 0)
  );
}

export function getAdjustedNetIncome(input: TaxCalculationInput): number {
  return getTotalIncome(input) - input.directPensionContrib;
}
