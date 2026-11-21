import { type Account, type InterestAccrual } from '@/lib/db';
import { TAX_FREE_CATEGORIES } from '@/constants/taxConstants';
import {
  calculateTotalSavings,
  calculateNonPensionSavings,
  calculateTaxableSavings,
  calculateProjectedInterestForAccount,
  calculateProjectedTaxableInterest,
} from '@/services/accountCalculations';

export type AccountSortBy = 'name' | 'rate' | 'updatedAt';

export type AccountFreshness = 'fresh' | 'aging' | 'stale' | 'unknown';

export type LedgerFreshness = 'recent' | 'overdue' | 'neutral';

export interface AccountUpdateInfo {
  formattedDate: string;
  ageLabel: string | null;
  displayText: string;
  daysSinceUpdate: number | null;
  freshness: AccountFreshness;
  isStale: boolean;
}

export interface AccountLedgerInfo {
  latestEntryDate: number;
  entryCount: number;
  formattedDate: string;
  ageLabel: string;
  displayText: string;
  daysSinceEntry: number;
  freshness: LedgerFreshness;
}

export const ACCOUNT_AGING_DAYS = 30;
export const ACCOUNT_STALE_DAYS = 60;
export const MONTHLY_LEDGER_OVERDUE_DAYS = 40;

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

export function getNextAccountSort(current: AccountSortBy): AccountSortBy {
  if (current === 'name') return 'rate';
  if (current === 'rate') return 'updatedAt';
  return 'name';
}

export function getAccountSortLabel(sortBy: AccountSortBy): string {
  if (sortBy === 'rate') return 'Rate';
  if (sortBy === 'updatedAt') return 'Last Updated';
  return 'Name';
}

export function sortAccounts(accounts: Account[], sortBy: AccountSortBy): Account[] {
  return [...accounts].sort((a, b) => {
    if (sortBy === 'rate') {
      return (a.interestRate || 0) - (b.interestRate || 0);
    }
    if (sortBy === 'updatedAt') {
      const diff = (a.updatedAt || 0) - (b.updatedAt || 0);
      if (diff !== 0) return diff;
      return (a.name || '').localeCompare(b.name || '');
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

function formatAgeLabel(daysSinceUpdate: number): string {
  if (daysSinceUpdate < ACCOUNT_AGING_DAYS) {
    return `${daysSinceUpdate} day${daysSinceUpdate === 1 ? '' : 's'} ago`;
  }
  if (daysSinceUpdate < 365) {
    const months = Math.floor(daysSinceUpdate / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  const years = Math.floor(daysSinceUpdate / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function getAccountUpdateInfo(
  updatedAt: number | undefined,
  now: number = Date.now()
): AccountUpdateInfo {
  if (!updatedAt || updatedAt <= 0) {
    return {
      formattedDate: 'Unknown',
      ageLabel: null,
      displayText: 'Never updated',
      daysSinceUpdate: null,
      freshness: 'unknown',
      isStale: true,
    };
  }

  const nowDate = new Date(now);
  const date = new Date(updatedAt);
  const diffMs = Math.max(0, now - updatedAt);
  const diffMins = Math.floor(diffMs / MS_PER_MINUTE);

  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const calendarDays = Math.max(0, Math.round((todayStart.getTime() - dateStart.getTime()) / MS_PER_DAY));

  if (calendarDays === 0) {
    let label = 'Today';
    if (diffMins < 1) {
      label = 'Just now';
    } else if (diffMins < 60) {
      label = `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    }
    return {
      formattedDate: 'Today',
      ageLabel: label,
      displayText: label,
      daysSinceUpdate: 0,
      freshness: 'fresh',
      isStale: false,
    };
  }

  if (calendarDays === 1) {
    return {
      formattedDate: 'Yesterday',
      ageLabel: 'Yesterday',
      displayText: 'Yesterday',
      daysSinceUpdate: 1,
      freshness: 'fresh',
      isStale: false,
    };
  }

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: nowDate.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
  }).format(date);

  const ageLabel = formatAgeLabel(calendarDays);
  const freshness: AccountFreshness =
    calendarDays >= ACCOUNT_STALE_DAYS
      ? 'stale'
      : calendarDays >= ACCOUNT_AGING_DAYS
      ? 'aging'
      : 'fresh';

  return {
    formattedDate,
    ageLabel,
    displayText: `${formattedDate} (${ageLabel})`,
    daysSinceUpdate: calendarDays,
    freshness,
    isStale: freshness !== 'fresh',
  };
}

export function getAccountLedgerInfo(
  accountId: string,
  accruals: InterestAccrual[],
  interestPayoutFrequency?: Account['interestPayoutFrequency'],
  now: number = Date.now()
): AccountLedgerInfo | null {
  let latestEntryDate: number | null = null;
  let entryCount = 0;

  for (const accrual of accruals) {
    if (accrual.accountId === accountId) {
      entryCount += 1;
      if (latestEntryDate === null || accrual.date > latestEntryDate) {
        latestEntryDate = accrual.date;
      }
    }
  }

  if (latestEntryDate === null || entryCount === 0) {
    return null;
  }

  const nowDate = new Date(now);
  const entryDate = new Date(latestEntryDate);
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const entryStart = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
  const rawCalendarDays = Math.round((todayStart.getTime() - entryStart.getTime()) / MS_PER_DAY);
  const daysSinceEntry = Math.max(0, rawCalendarDays);

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: nowDate.getFullYear() !== entryDate.getFullYear() ? 'numeric' : undefined,
  }).format(entryDate);

  let ageLabel: string;
  let displayText: string;

  if (rawCalendarDays < 0) {
    ageLabel = 'Scheduled';
    displayText = formattedDate;
  } else if (daysSinceEntry === 0) {
    ageLabel = 'Today';
    displayText = 'Today';
  } else if (daysSinceEntry === 1) {
    ageLabel = 'Yesterday';
    displayText = 'Yesterday';
  } else {
    ageLabel = formatAgeLabel(daysSinceEntry);
    displayText = `${formattedDate} (${ageLabel})`;
  }

  let freshness: LedgerFreshness = 'neutral';
  if (interestPayoutFrequency === 'monthly') {
    freshness = daysSinceEntry >= MONTHLY_LEDGER_OVERDUE_DAYS ? 'overdue' : 'recent';
  }

  return {
    latestEntryDate,
    entryCount,
    formattedDate,
    ageLabel,
    displayText,
    daysSinceEntry,
    freshness,
  };
}

export function formatAccountForDisplay(
  acc: Account,
  allAccruals: InterestAccrual[],
  startTs: number,
  endTs: number,
  p1Name: string,
  p2Name: string,
  now: number = Date.now(),
  allTimeAccruals: InterestAccrual[] = allAccruals
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

  const isTaxFree =
    acc.category &&
    (TAX_FREE_CATEGORIES as readonly string[]).includes(acc.category);

  const updateInfo = getAccountUpdateInfo(acc.updatedAt, now);
  const ledgerInfo = getAccountLedgerInfo(
    acc.id,
    allTimeAccruals,
    acc.interestPayoutFrequency,
    now
  );

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
    updatedAt: updateInfo.displayText,
    updatedAtFreshness: updateInfo.freshness,
    isStale: updateInfo.isStale,
    ledgerLastEntry: ledgerInfo?.displayText,
    ledgerFreshness: ledgerInfo?.freshness,
    alertText: acc.alertText,
    alertType: acc.alertType,
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

export function parseLedgerDateInput(entryDate: string): number {
  const [year, month, day] = entryDate.split('-');
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)).getTime();
}

export function formatLedgerDateInput(timestamp: number): string {
  const dateObj = new Date(timestamp);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLedgerDisplayDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLedgerInterestAmount(amount: number): string {
  return `+ £${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

