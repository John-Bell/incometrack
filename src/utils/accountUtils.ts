import { type Account, type InterestAccrual } from '@/lib/db';
import { formatRelativeTime } from '@/lib/utils';
import { TAX_FREE_CATEGORIES } from '@/constants/taxConstants';
import {
  calculateTotalSavings,
  calculateNonPensionSavings,
  calculateTaxableSavings,
  calculateProjectedInterestForAccount,
  calculateProjectedTaxableInterest,
} from '@/services/accountCalculations';

export interface AccountTabSummary {
  id: 'person1' | 'person2' | 'joint';
  label: string;
  formattedTaxableInterest: string;
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function sortAccounts(accounts: Account[], sortBy: 'rate' | 'name'): Account[] {
  return [...accounts].sort((a, b) => {
    if (sortBy === 'rate') {
      return (a.interestRate || 0) - (b.interestRate || 0);
    } else {
      return (a.name || '').localeCompare(b.name || '');
    }
  });
}

export function formatAccountForDisplay(
  acc: Account,
  allAccruals: InterestAccrual[],
  startTs: number,
  endTs: number,
  p1Name: string,
  p2Name: string
) {
  let ownerTagColor: 'blue' | 'pink' | 'purple' = 'purple';

  if (acc.ownerId === 'person1') {
    ownerTagColor = 'blue';
  } else if (acc.ownerId === 'person2') {
    ownerTagColor = 'pink';
  }

  const accountIcon = acc.name ? acc.name.charAt(0).toUpperCase() : '?';
  let iconColor: 'red' | 'blue' | 'gray' | 'green' = 'gray';
  if (accountIcon === 'S') iconColor = 'red';
  else if (accountIcon === 'B') iconColor = 'blue';
  else if (accountIcon === 'L') iconColor = 'green';

  const projectedInterestValue = calculateProjectedInterestForAccount(acc, allAccruals, startTs, endTs);
  const projectedInterest = formatGBP(projectedInterestValue);

  const isTaxFree = acc.category && TAX_FREE_CATEGORIES.includes(acc.category as any);

  return {
    id: acc.id,
    ownerId: acc.ownerId,
    accountIcon,
    iconColor,
    accountName: acc.name,
    nickname: acc.nickname,
    last4Digits: acc.last4Digits,
    category: acc.category,
    ownerTag: acc.ownerId === 'joint' ? 'Joint' : acc.ownerId === 'person1' ? p1Name : p2Name,
    ownerTagColor,
    balance: formatGBP(acc.balance),
    projectedInterest: projectedInterestValue > 0 ? projectedInterest : undefined,
    isTaxable: !isTaxFree,
    rate: acc.interestRate === 0 ? undefined : acc.interestRate.toFixed(2) + '%',
    interestPayoutFrequency: acc.interestPayoutFrequency,
    interestPayoutDate: acc.interestPayoutDate,
    updatedAt: formatRelativeTime(acc.updatedAt),
    alertText: acc.alertText,
    alertType: acc.alertType as any,
  };
}

export function calculatePortfolioSummary(rawAccounts: Account[]) {
  const totalSavingsValue = calculateTotalSavings(rawAccounts);
  const nonPensionSavingsValue = calculateNonPensionSavings(rawAccounts);
  const taxableSavingsValue = calculateTaxableSavings(rawAccounts);

  return {
    formattedTotalSavings: formatGBP(totalSavingsValue),
    formattedNonPensionSavings: formatGBP(nonPensionSavingsValue),
    formattedTaxableSavings: formatGBP(taxableSavingsValue),
  };
}

export function calculateTabSummaries(
  rawAccounts: Account[],
  allAccruals: InterestAccrual[],
  startTs: number,
  endTs: number,
  p1Name: string,
  p2Name: string
): AccountTabSummary[] {
  const tabs: Array<'person1' | 'person2' | 'joint'> = ['person1', 'person2', 'joint'];
  return tabs.map((tab) => {
    const tabAccounts = rawAccounts.filter((acc) => acc.ownerId === tab);
    const tabTaxableInterest = calculateProjectedTaxableInterest(tabAccounts, allAccruals, startTs, endTs);
    const label = tab === 'joint' ? 'Joint' : tab === 'person1' ? p1Name : p2Name;
    return {
      id: tab,
      label,
      formattedTaxableInterest: formatGBP(tabTaxableInterest),
    };
  });
}
