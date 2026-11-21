import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { getTaxYearDates } from '@/constants/taxConstants';
import {
  sortAccounts,
  formatAccountForDisplay,
  calculatePortfolioSummary,
  calculateTabSummaries,
  type AccountSortBy,
} from '@/utils/accountUtils';

export function useAccountsPage() {
  const profile = useStore((state) => state.profile);
  const activeAccountsTab = useStore((state) => state.activeAccountsTab);
  const setActiveAccountsTab = useStore((state) => state.setActiveAccountsTab);
  const taxYear = useStore((state) => state.taxYear);
  const p1Name = profile?.partner1Name || 'Partner 1';
  const p2Name = profile?.partner2Name || 'Partner 2';

  const [sortBy, setSortBy] = useState<AccountSortBy>('name');

  const { startTs, endTs } = getTaxYearDates(taxYear || undefined);

  const rawAccounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const allAccruals = useLiveQuery(
    () => db.interestAccruals.where('date').between(startTs, endTs, true, true).toArray(),
    [startTs, endTs]
  ) || [];

  const sortedRawAccounts = sortAccounts(rawAccounts, sortBy);

  const mappedAccounts = sortedRawAccounts.map((acc) =>
    formatAccountForDisplay(acc, allAccruals, startTs, endTs, p1Name, p2Name)
  );

  const filteredAccounts = mappedAccounts.filter((acc) => acc.ownerId === activeAccountsTab);

  const { formattedTotalSavings, formattedNonPensionSavings, formattedTaxableSavings } =
    calculatePortfolioSummary(rawAccounts);

  const tabSummaries = calculateTabSummaries(rawAccounts, allAccruals, startTs, endTs, p1Name, p2Name);

  return {
    p1Name,
    p2Name,
    sortBy,
    setSortBy,
    activeAccountsTab,
    setActiveAccountsTab,
    startTs,
    endTs,
    formattedTotalSavings,
    formattedNonPensionSavings,
    formattedTaxableSavings,
    tabSummaries,
    filteredAccounts,
    rawAccounts,
  };
}
