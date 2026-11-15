import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { getTaxYearOrLatest, getTaxYearDates } from '@/constants/taxConstants';
import {
  calculatePropertyTotalsForRange,
  filterPropertyRecordsByTaxYearAndProperty,
  filterPropertyOwnerships,
} from '@/utils/propertyCalculations';

export function usePropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTaxYear = getTaxYearOrLatest();
  const taxYearFilter = searchParams.get('taxYear') || defaultTaxYear;

  const properties = useLiveQuery(() => db.properties.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.propertyExpenses.toArray(), []) || [];
  const incomes = useLiveQuery(() => db.propertyIncomes.toArray(), []) || [];
  const taxRules = useLiveQuery(() => db.taxRules.toArray(), []) || [];

  const { startTs, endTs } = getTaxYearDates(taxYearFilter);

  const getPropertyTotals = (propertyId: string) =>
    calculatePropertyTotalsForRange(
      propertyId,
      incomes,
      expenses,
      startTs,
      endTs
    );

  const handleTaxYearChange = (newTaxYear: string) => {
    if (newTaxYear === defaultTaxYear) {
      searchParams.delete('taxYear');
    } else {
      searchParams.set('taxYear', newTaxYear);
    }
    setSearchParams(searchParams);
  };

  return {
    taxYearFilter,
    properties,
    taxRules,
    getPropertyTotals,
    handleTaxYearChange,
  };
}

export function usePropertyIncomesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const propertyIdFilter = searchParams.get('propertyId') || 'all';
  const defaultTaxYear = getTaxYearOrLatest();
  const taxYearFilter = searchParams.get('taxYear') || defaultTaxYear;

  const properties = useLiveQuery(() => db.properties.toArray(), []) || [];
  const taxRules = useLiveQuery(() => db.taxRules.toArray(), []) || [];
  const rawIncomes = useLiveQuery(() => db.propertyIncomes.toArray(), []) || [];

  const { startTs, endTs } = getTaxYearDates(taxYearFilter);
  const incomes = filterPropertyRecordsByTaxYearAndProperty(
    rawIncomes,
    propertyIdFilter,
    startTs,
    endTs
  );

  const handlePropertyFilterChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('propertyId');
    } else {
      searchParams.set('propertyId', value);
    }
    setSearchParams(searchParams);
  };

  const handleTaxYearChange = (value: string) => {
    if (value === defaultTaxYear) {
      searchParams.delete('taxYear');
    } else {
      searchParams.set('taxYear', value);
    }
    setSearchParams(searchParams);
  };

  const getPropertyName = (id: string) =>
    properties.find((p) => p.id === id)?.name || 'Unknown Property';

  return {
    propertyIdFilter,
    taxYearFilter,
    properties,
    taxRules,
    incomes,
    handlePropertyFilterChange,
    handleTaxYearChange,
    getPropertyName,
  };
}

export function usePropertyExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const propertyIdFilter = searchParams.get('propertyId') || 'all';
  const defaultTaxYear = getTaxYearOrLatest();
  const taxYearFilter = searchParams.get('taxYear') || defaultTaxYear;

  const properties = useLiveQuery(() => db.properties.toArray(), []) || [];
  const taxRules = useLiveQuery(() => db.taxRules.toArray(), []) || [];
  const rawExpenses =
    useLiveQuery(() => db.propertyExpenses.toArray(), []) || [];

  const { startTs, endTs } = getTaxYearDates(taxYearFilter);
  const expenses = filterPropertyRecordsByTaxYearAndProperty(
    rawExpenses,
    propertyIdFilter,
    startTs,
    endTs
  );

  const handlePropertyFilterChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('propertyId');
    } else {
      searchParams.set('propertyId', value);
    }
    setSearchParams(searchParams);
  };

  const handleTaxYearChange = (value: string) => {
    if (value === defaultTaxYear) {
      searchParams.delete('taxYear');
    } else {
      searchParams.set('taxYear', value);
    }
    setSearchParams(searchParams);
  };

  const getPropertyName = (id: string) =>
    properties.find((p) => p.id === id)?.name || 'Unknown Property';

  return {
    propertyIdFilter,
    taxYearFilter,
    properties,
    taxRules,
    expenses,
    handlePropertyFilterChange,
    handleTaxYearChange,
    getPropertyName,
  };
}

export function usePropertyOwnershipsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const propertyIdFilter = searchParams.get('propertyId') || 'all';
  const profile = useStore((state) => state.profile);

  const properties = useLiveQuery(() => db.properties.toArray(), []) || [];
  const rawOwnerships =
    useLiveQuery(() => db.propertyOwnership.toArray(), []) || [];

  const ownerships = filterPropertyOwnerships(rawOwnerships, propertyIdFilter);

  const handlePropertyFilterChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('propertyId');
    } else {
      searchParams.set('propertyId', value);
    }
    setSearchParams(searchParams);
  };

  const getPropertyName = (id: string) =>
    properties.find((p) => p.id === id)?.name || 'Unknown Property';

  const person1Name = profile?.partner1Name || 'Person 1';
  const person2Name = profile?.partner2Name || 'Person 2';

  return {
    navigate,
    propertyIdFilter,
    properties,
    ownerships,
    person1Name,
    person2Name,
    handlePropertyFilterChange,
    getPropertyName,
  };
}
