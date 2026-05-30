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

  PropertyAllowance: number;

  SavingsAllowanceBasic: number;
  SavingsAllowanceHigher: number;
  SavingsAllowanceAdditional: number;

  StartingRateForSavingsThreshold: number;
  StartingRateForSavings: number;

  GeneralBandType: string;
  SavingsBandType: string;
  DividendsBandType: string;
  PropertyBandType: string;

  AllowanceBand: string;
  BasicBand: string;
  HigherBand: string;
  AdditionalBand: string;
  StartingBand: string;
};

export type AccountCategory =
  | 'Current Account'
  | 'Easy Access Savings'
  | 'Fixed Term Savings'
  | 'Notice Savings'
  | 'Stocks & Shares'
  | 'Cash ISA'
  | 'Shares ISA'
  | 'Premium Bonds'
  | 'DC Pension';

export const ACCOUNT_CATEGORIES: AccountCategory[] = [
  'Current Account',
  'Easy Access Savings',
  'Fixed Term Savings',
  'Notice Savings',
  'Stocks & Shares',
  'Cash ISA',
  'Shares ISA',
  'Premium Bonds',
  'DC Pension'
];

export const TAX_FREE_CATEGORIES: AccountCategory[] = [
  'Cash ISA',
  'Shares ISA',
  'Premium Bonds',
  'DC Pension'
];

const DEFAULT_TAX_YEAR = '2025-2026';

export type TaxRulesByYear = Record<string, TaxYearConstants>;

export const TAX_YEAR_CONSTANTS: TaxRulesByYear = {
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

    PropertyAllowance: 1000,

    SavingsAllowanceBasic: 1000,
    SavingsAllowanceHigher: 1000,
    SavingsAllowanceAdditional: 0,

    StartingRateForSavingsThreshold: 5000,
    StartingRateForSavings: 0,

    GeneralBandType: 'General',
    SavingsBandType: 'Savings',
    DividendsBandType: 'Dividends',
    PropertyBandType: 'Property',

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

    PropertyAllowance: 1000,

    SavingsAllowanceBasic: 1000,
    SavingsAllowanceHigher: 500,
    SavingsAllowanceAdditional: 0,

    StartingRateForSavingsThreshold: 5000,
    StartingRateForSavings: 0,

    GeneralBandType: 'General',
    SavingsBandType: 'Savings',
    DividendsBandType: 'Dividends',
    PropertyBandType: 'Property',

    AllowanceBand: 'Allowance',
    BasicBand: 'Basic',
    HigherBand: 'Higher',
    AdditionalBand: 'Additional',
    StartingBand: 'Starting',
  },
  '2026-2027': {
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
    DividendBasicRate: 0.1075,
    DividendHigherRate: 0.3575,
    DividendAdditionalRate: 0.3935,

    SavingsBasicRate: 0.2,
    SavingsHigherRate: 0.4,
    SavingsAdditionalRate: 0.45,

    RentalBasicRate: 0.2,
    RentalHigherRate: 0.4,
    RentalAdditionalRate: 0.45,

    PropertyAllowance: 1000,

    SavingsAllowanceBasic: 1000,
    SavingsAllowanceHigher: 500,
    SavingsAllowanceAdditional: 0,

    StartingRateForSavingsThreshold: 5000,
    StartingRateForSavings: 0,

    GeneralBandType: 'General',
    SavingsBandType: 'Savings',
    DividendsBandType: 'Dividends',
    PropertyBandType: 'Property',

    AllowanceBand: 'Allowance',
    BasicBand: 'Basic',
    HigherBand: 'Higher',
    AdditionalBand: 'Additional',
    StartingBand: 'Starting',
  },
  '2027-2028': {
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
    DividendBasicRate: 0.1075,
    DividendHigherRate: 0.3575,
    DividendAdditionalRate: 0.3935,

    SavingsBasicRate: 0.22,
    SavingsHigherRate: 0.42,
    SavingsAdditionalRate: 0.47,

    RentalBasicRate: 0.22,
    RentalHigherRate: 0.42,
    RentalAdditionalRate: 0.47,

    PropertyAllowance: 1000,

    SavingsAllowanceBasic: 1000,
    SavingsAllowanceHigher: 500,
    SavingsAllowanceAdditional: 0,

    StartingRateForSavingsThreshold: 5000,
    StartingRateForSavings: 0,

    GeneralBandType: 'General',
    SavingsBandType: 'Savings',
    DividendsBandType: 'Dividends',
    PropertyBandType: 'Property',

    AllowanceBand: 'Allowance',
    BasicBand: 'Basic',
    HigherBand: 'Higher',
    AdditionalBand: 'Additional',
    StartingBand: 'Starting',
  }
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

export const getTaxYearOrLatest = (taxYear?: string): string => {
  if (taxYear && TAX_YEAR_CONSTANTS[taxYear]) {
    return taxYear;
  }
  if (taxYear) {
    // If a tax year was requested but doesn't exist, find the latest available
    const availableYears = Object.keys(TAX_YEAR_CONSTANTS).sort();
    if (availableYears.length > 0) {
      return availableYears[availableYears.length - 1];
    }
  }
  const currentYear = getCurrentTaxYearKey();
  return TAX_YEAR_CONSTANTS[currentYear] ? currentYear : DEFAULT_TAX_YEAR;
};

export const getTaxYearDates = (taxYear?: string): { startTs: number; endTs: number } => {
  const resolvedYear = getTaxYearOrLatest(taxYear);
  const startYearStr = resolvedYear.split('-')[0];
  const startYear = parseInt(startYearStr, 10);

  // UK tax year: 6th April to 5th April
  const startTs = new Date(startYear, 3, 6).getTime(); // Month 3 is April
  const endTs = new Date(startYear + 1, 3, 5, 23, 59, 59, 999).getTime();

  return { startTs, endTs };
};
