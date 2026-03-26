import { describe, it, expect } from 'vitest';
import { SavingsTaxService } from './SavingsTaxService';
import { BrbTracker } from '../models/BrbTracker';
import { getTaxConstants, TAX_YEAR_CONSTANTS } from '../constants/taxConstants';

const CURRENT_TAX_YEAR = '2025-2026';

describe('SavingsTaxService', () => {
  it('applies unused Personal Allowance before Starting Rate for Savings (Johns scenario)', () => {
    const service = new SavingsTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);

    const grossNonSavingsIncome = 9240; // Pension
    const savingsIncome = 5827; // Interest
    const personalAllowance = constants.StandardPersonalAllowance; // 12570
    const brbTracker = new BrbTracker(constants.BasicRateBand); // 37700

    const result = service.calculateSavingsTax(
      savingsIncome,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      [],
      CURRENT_TAX_YEAR
    );

    // Total tax should be exactly £0
    const totalSavingsTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalSavingsTax).toBe(0);

    // There should be no bands applying the 20% basic rate
    const basicRateBands = result.filter(b => b.rate === constants.BasicRate && b.tax > 0);
    expect(basicRateBands.length).toBe(0);
  });

  it('calculates full starting rate for savings when PA is exactly used up', () => {
    const service = new SavingsTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);

    const grossNonSavingsIncome = 12570; // Salary exactly uses up PA
    const savingsIncome = 10000; // Savings
    const personalAllowance = constants.StandardPersonalAllowance; // 12570
    const brbTracker = new BrbTracker(constants.BasicRateBand); // 37700

    const result = service.calculateSavingsTax(
      savingsIncome,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      [],
      CURRENT_TAX_YEAR
    );

    // 1. Starting rate band should catch the first £5000 at 0%
    const startingRateBand = result.find(b => b.band === constants.StartingBand);
    expect(startingRateBand).toBeDefined();
    expect(startingRateBand?.amount).toBe(constants.StartingRateForSavingsThreshold); // 5000
    expect(startingRateBand?.tax).toBe(0);

    // 2. Personal Savings Allowance should catch the next £1000 at 0%
    const allowanceBand = result.find(b => b.band === constants.BasicBand && b.rate === 0);
    expect(allowanceBand).toBeDefined();
    expect(allowanceBand?.amount).toBe(constants.SavingsAllowanceBasic); // 1000
    expect(allowanceBand?.tax).toBe(0);

    // 3. The remaining £4000 should be taxed at basic rate (20%)
    const basicRateBand = result.find(b => b.band === constants.BasicBand && b.rate === constants.BasicRate);
    expect(basicRateBand).toBeDefined();
    expect(basicRateBand?.amount).toBe(4000);
    expect(basicRateBand?.tax).toBeCloseTo(4000 * constants.BasicRate); // £800

    // Total tax should be £800
    const totalSavingsTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalSavingsTax).toBeCloseTo(800);
  });

  it('calculates zero tax when total income is below Personal Allowance', () => {
    const service = new SavingsTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const savingsIncome = 10000;
    const grossNonSavingsIncome = 2000; // rental income
    const personalAllowance = constants.StandardPersonalAllowance; // 12570
    const brbTracker = new BrbTracker(constants.BasicRateBand); // 37700

    const result = service.calculateSavingsTax(
      savingsIncome,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      [],
      CURRENT_TAX_YEAR
    );

    // The unused Personal Allowance (£12,570 - £2,000 = £10,570) 
    // entirely covers the £10,000 savings income.
    const totalSavingsTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalSavingsTax).toBe(0);

    // Verify no basic rate tax bands were applied
    const basicRateBands = result.filter(b => b.rate === constants.BasicRate && b.tax > 0);
    expect(basicRateBands.length).toBe(0);
  });
  it('should apply savings allowance when savings push into higher rate', () => {
    const service = new SavingsTaxService(TAX_YEAR_CONSTANTS, CURRENT_TAX_YEAR);
    const constants = getTaxConstants(CURRENT_TAX_YEAR);
    const salary = 100800;
    const rentalIncome = 0;
    const pensionIncome = 0;
    const untaxedInterest = 10000; // savings
    const directPensionContrib = 60000;
    const personalAllowance = constants.StandardPersonalAllowance; // 12570
    const brbExtended = constants.BasicRateBand + directPensionContrib; // 37700 + 60000 = 97700
    const grossNonSavingsIncome = salary + rentalIncome + pensionIncome; // 100800
    const brbTracker = new BrbTracker(brbExtended);

    brbTracker.use(salary - personalAllowance); // 100800 - 12570 = 88230

    const brbRemainingForSavings = Math.max(brbExtended - (salary - personalAllowance), 0);

    const result = service.calculateSavingsTax(
      untaxedInterest,
      grossNonSavingsIncome,
      personalAllowance,
      brbTracker,
      [
        {
          band: constants.HigherBand,
          type: constants.GeneralBandType,
          amount: 0,
          rate: constants.HigherRate,
          tax: 0,
        }
      ],
      CURRENT_TAX_YEAR
    );

    const savingsZero = result.find(b => b.rate === 0);
    expect(savingsZero).toBeDefined();
    expect(savingsZero?.amount).toBe(constants.SavingsAllowanceHigher);

    const savingsBasic = result.find(b => b.band === constants.BasicBand && b.rate === constants.BasicRate);
    expect(savingsBasic).toBeDefined();
    expect(savingsBasic?.amount).toBe(brbRemainingForSavings - constants.SavingsAllowanceHigher);
    expect(savingsBasic?.tax).toBeCloseTo((brbRemainingForSavings - constants.SavingsAllowanceHigher) * constants.BasicRate);

    const savingsHigher = result.find(b => b.band === constants.HigherBand && b.rate === constants.HigherRate);
    expect(savingsHigher).toBeDefined();
    const expectedHigher = untaxedInterest - brbRemainingForSavings;
    expect(savingsHigher?.amount).toBe(expectedHigher);
    expect(savingsHigher?.tax).toBeCloseTo(expectedHigher * constants.HigherRate);

    const totalSavingsTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalSavingsTax).toBeCloseTo(
      (brbRemainingForSavings - constants.SavingsAllowanceHigher) * constants.BasicRate + expectedHigher * constants.HigherRate
    );
  });
});
