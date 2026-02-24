import { describe, it, expect } from 'vitest';
import { SavingsTaxService } from './SavingsTaxService';
import { BrbTracker } from '../models/BrbTracker';
import { getTaxConstants } from '../constants/taxConstants';

const CURRENT_TAX_YEAR = '2025-2026';

describe('SavingsTaxService', () => {
  it('calculates starting rate for savings correctly', () => {
    const service = new SavingsTaxService(CURRENT_TAX_YEAR);
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

    const startingRateBand = result.find(b => b.band === constants.StartingBand);
    expect(startingRateBand).toBeDefined();
    expect(startingRateBand?.amount).toBe(constants.StartingRateForSavingsThreshold);
    expect(startingRateBand?.rate).toBe(constants.StartingRateForSavings);
    expect(startingRateBand?.tax).toBe(0);

    const allowanceBand = result.find(b => b.band === constants.BasicBand && b.rate === 0);
    expect(allowanceBand).toBeDefined();
    expect(allowanceBand?.amount).toBe(constants.SavingsAllowanceBasic);
    expect(allowanceBand?.tax).toBe(0);

    const basicRateBand = result.find(b => b.band === constants.BasicBand && b.rate === constants.BasicRate);
    expect(basicRateBand).toBeDefined();
    expect(basicRateBand?.amount).toBe(5000 - constants.SavingsAllowanceBasic);
    expect(basicRateBand?.tax).toBeCloseTo((5000 - constants.SavingsAllowanceBasic) * constants.BasicRate);

    const totalSavingsTax = result.reduce((sum, b) => sum + b.tax, 0);
    expect(totalSavingsTax).toBeCloseTo((5000 - constants.SavingsAllowanceBasic) * constants.BasicRate);
  });

  it('should apply savings allowance when savings push into higher rate', () => {
    const service = new SavingsTaxService(CURRENT_TAX_YEAR);
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
