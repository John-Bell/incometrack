export type TaxYearConstants = {
  StandardPersonalAllowance: number;
  PersonalAllowanceThreshold: number;
  PersonalAllowanceRemovalThreshold: number;
  PersonalAllowanceReductionRate: number;

  BasicRateBand: number;
  BasicRate: number;

  HigherRateBand: number;
  HigherRate: number;

  AdditionalRate: number;

  DividendAllowance: number;
  DividendBasicRate: number;
  DividendHigherRate: number;
  DividendAdditionalRate: number;

  SavingsBasicRate: number;
  SavingsHigherRate: number;
  SavingsAdditionalRate: number;

  RentalBasicRate: number;
  RentalHigherRate: number;
  RentalAdditionalRate: number;

  SavingsAllowanceBasic: number;
  SavingsAllowanceHigher: number;
  SavingsAllowanceAdditional: number;

  StartingRateForSavingsThreshold: number;
  StartingRateForSavings: number;

  GeneralBandType: string;
  SavingsBandType: string;
  DividendsBandType: string;

  AllowanceBand: string;
  BasicBand: string;
  HigherBand: string;
  AdditionalBand: string;
  StartingBand: string;
};

const DEFAULT_TAX_YEAR = '2025-2026';

export const TAX_YEAR_CONSTANTS: Record<string, TaxYearConstants> = {
  '2024-2025': {
    StandardPersonalAllowance: 12570,
    PersonalAllowanceThreshold: 100000,
    PersonalAllowanceRemovalThreshold: 125140,
    PersonalAllowanceReductionRate: 0.5,

    BasicRateBand: 37700,
    BasicRate: 0.2,

    HigherRateBand: 125140,
    HigherRate: 0.4,

    AdditionalRate: 0.45,

    DividendAllowance: 1000,
    DividendBasicRate: 0.0875,
    DividendHigherRate: 0.3375,
    DividendAdditionalRate: 0.3935,

    SavingsBasicRate: 0.2,
    SavingsHigherRate: 0.4,
    SavingsAdditionalRate: 0.45,

    RentalBasicRate: 0.2,
    RentalHigherRate: 0.4,
    RentalAdditionalRate: 0.45,

    SavingsAllowanceBasic: 1000,
    SavingsAllowanceHigher: 1000,
    SavingsAllowanceAdditional: 0,

    StartingRateForSavingsThreshold: 5000,
    StartingRateForSavings: 0,

    GeneralBandType: 'General',
    SavingsBandType: 'Savings',
    DividendsBandType: 'Dividends',

    AllowanceBand: 'Allowance',
    BasicBand: 'Basic',
    HigherBand: 'Higher',
    AdditionalBand: 'Additional',
    StartingBand: 'Starting',
  },
  '2025-2026': {
    StandardPersonalAllowance: 12570,
    PersonalAllowanceThreshold: 100000,
    PersonalAllowanceRemovalThreshold: 125140,
    PersonalAllowanceReductionRate: 0.5,

    BasicRateBand: 37700,
    BasicRate: 0.2,

    HigherRateBand: 125140,
    HigherRate: 0.4,

    AdditionalRate: 0.45,

    DividendAllowance: 500,
    DividendBasicRate: 0.0875,
    DividendHigherRate: 0.3375,
    DividendAdditionalRate: 0.3935,

    SavingsBasicRate: 0.2,
    SavingsHigherRate: 0.4,
    SavingsAdditionalRate: 0.45,

    RentalBasicRate: 0.2,
    RentalHigherRate: 0.4,
    RentalAdditionalRate: 0.45,

    SavingsAllowanceBasic: 1000,
    SavingsAllowanceHigher: 500,
    SavingsAllowanceAdditional: 0,

    StartingRateForSavingsThreshold: 5000,
    StartingRateForSavings: 0,

    GeneralBandType: 'General',
    SavingsBandType: 'Savings',
    DividendsBandType: 'Dividends',

    AllowanceBand: 'Allowance',
    BasicBand: 'Basic',
    HigherBand: 'Higher',
    AdditionalBand: 'Additional',
    StartingBand: 'Starting',
  },
};

const getCurrentTaxYearKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  // UK tax year starts in April; if before April, use previous year as start.
  const startYear = now.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

export const getTaxConstants = (taxYear?: string): TaxYearConstants => {
  const requestedYear = taxYear && TAX_YEAR_CONSTANTS[taxYear] ? taxYear : undefined;
  const currentYear = getCurrentTaxYearKey();
  const resolvedYear =
    requestedYear ?? (TAX_YEAR_CONSTANTS[currentYear] ? currentYear : DEFAULT_TAX_YEAR);
  return TAX_YEAR_CONSTANTS[resolvedYear];
};

export const getDefaultTaxYear = (taxYear?: string): string => {
  const requestedYear = taxYear && TAX_YEAR_CONSTANTS[taxYear] ? taxYear : undefined;
  const currentYear = getCurrentTaxYearKey();
  return requestedYear ?? (TAX_YEAR_CONSTANTS[currentYear] ? currentYear : DEFAULT_TAX_YEAR);
};
