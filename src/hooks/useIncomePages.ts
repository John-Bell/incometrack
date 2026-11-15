import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Profile } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { useTaxCalculations } from '@/hooks/useTaxCalculations';
import { useIncomeForm } from '@/hooks/useIncomeForm';
import { useSimulatorCalculations } from '@/hooks/useSimulatorCalculations';
import { getTaxYearOrLatest, TAX_YEAR_CONSTANTS } from '@/constants/taxConstants';
import {
    calculatePartnerIncomeSplitPercentages,
    calculateSliderPercent,
    getAvailableSimulatorTaxYears,
    groupIncomesByType
} from '@/utils/incomeCalculations';

function useProfileState(): Profile | null {
    const raw = useStore(state => state.profile) as Profile | { profile?: Profile | null } | null | undefined;
    if (raw && typeof raw === 'object' && 'profile' in raw) {
        return raw.profile ?? null;
    }
    return (raw as Profile | null | undefined) ?? null;
}

function useStoreTaxYearState(): string | null {
    const raw = useStore(state => state.taxYear) as string | { taxYear?: string | null } | null | undefined;
    if (raw && typeof raw === 'object' && 'taxYear' in raw) {
        return raw.taxYear ?? null;
    }
    return (raw as string | null | undefined) ?? null;
}

export function useIncomePage() {
    const profile = useProfileState();
    const p1Name = profile?.partner1Name || 'Person 1';
    const p2Name = profile?.partner2Name || 'Person 2';

    const {
        p1Incomes,
        p2Incomes,
        p1TaxResult,
        p2TaxResult,
        p1TotalIncome: p1Total,
        p2TotalIncome: p2Total,
        combinedNet
    } = useTaxCalculations();

    const { p1Pct: p1RentalPct, p2Pct: p2RentalPct } = calculatePartnerIncomeSplitPercentages(
        p1Incomes.propertyIncome,
        p2Incomes.propertyIncome
    );
    const { p1Pct: p1InterestPct, p2Pct: p2InterestPct } = calculatePartnerIncomeSplitPercentages(
        p1Incomes.interest,
        p2Incomes.interest
    );
    const { p1Pct: p1DividendsPct, p2Pct: p2DividendsPct } = calculatePartnerIncomeSplitPercentages(
        p1Incomes.dividends,
        p2Incomes.dividends
    );

    return {
        p1Name,
        p2Name,
        p1Incomes,
        p2Incomes,
        p1TaxResult,
        p2TaxResult,
        p1Total,
        p2Total,
        combinedNet,
        p1RentalPct,
        p2RentalPct,
        p1InterestPct,
        p2InterestPct,
        p1DividendsPct,
        p2DividendsPct
    };
}

export function useIncomeEditPage() {
    const navigate = useNavigate();
    const profile = useProfileState();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    const [activeTabKey, setActiveTabKey] = useState<'partner1' | 'partner2'>('partner1');
    const ownerId = activeTabKey === 'partner1' ? 'person1' : 'person2';

    const {
        p1TaxResult,
        p2TaxResult,
        p1TotalIncome,
        p2TotalIncome
    } = useTaxCalculations();

    const activeTaxResult = activeTabKey === 'partner1' ? p1TaxResult : p2TaxResult;
    const activeTotalIncome = activeTabKey === 'partner1' ? p1TotalIncome : p2TotalIncome;

    const {
        incomes,
        formData,
        editingId,
        handleFormChange,
        handleEdit,
        handleSaveEntry,
        handleDeleteEntry,
        handleCancelEdit,
        handleAddClick
    } = useIncomeForm(ownerId);

    const { pensions, employment, dividends } = groupIncomesByType(incomes);

    const handleTabChange = (val: string) => {
        setActiveTabKey(val === p1Name ? 'partner1' : 'partner2');
        handleCancelEdit();
    };

    const handleSaveAndCalculate = () => {
        navigate('/income');
    };

    const handleNavigateBack = () => {
        navigate('/income');
    };

    return {
        p1Name,
        p2Name,
        activeTabKey,
        activeTaxResult,
        activeTotalIncome,
        pensions,
        employment,
        dividends,
        formData,
        editingId,
        handleFormChange,
        handleEdit,
        handleSaveEntry,
        handleDeleteEntry,
        handleCancelEdit,
        handleAddClick,
        handleTabChange,
        handleSaveAndCalculate,
        handleNavigateBack
    };
}

interface SimulatorFormState {
    selectedTaxYear: string | undefined;
    movableInterestP1Percent: number | undefined;
    propertySplits: Record<string, number>;
    isaSweep: boolean;
}

const INITIAL_SIMULATOR_STATE: SimulatorFormState = {
    selectedTaxYear: undefined,
    movableInterestP1Percent: undefined,
    propertySplits: {},
    isaSweep: false
};

export function useSimulatorPage() {
    const profile = useProfileState();
    const storeTaxYear = useStoreTaxYearState();
    const taxRules = useLiveQuery(() => db.taxRules.toArray(), []);

    const [simulatorState, setSimulatorState] = useState<SimulatorFormState>(INITIAL_SIMULATOR_STATE);
    const { selectedTaxYear, movableInterestP1Percent, propertySplits, isaSweep } = simulatorState;

    const effectiveTaxYear = selectedTaxYear || storeTaxYear || getTaxYearOrLatest();
    const isModified =
        movableInterestP1Percent !== undefined ||
        Object.keys(propertySplits).length > 0 ||
        isaSweep;

    const handleReset = () => {
        setSimulatorState(prev => ({
            ...prev,
            movableInterestP1Percent: undefined,
            propertySplits: {},
            isaSweep: false
        }));
    };

    const setSelectedTaxYear = (year: string) => {
        setSimulatorState(prev => ({ ...prev, selectedTaxYear: year }));
    };

    const setMovableInterestP1Percent = (percent: number) => {
        setSimulatorState(prev => ({ ...prev, movableInterestP1Percent: percent }));
    };

    const setIsaSweep = (checked: boolean) => {
        setSimulatorState(prev => ({ ...prev, isaSweep: checked }));
    };

    const handlePropertySplitChange = (propertyId: string, value: number) => {
        setSimulatorState(prev => ({
            ...prev,
            propertySplits: { ...prev.propertySplits, [propertyId]: value }
        }));
    };

    const p1Name = profile?.partner1Name || 'Person 1';
    const p2Name = profile?.partner2Name || 'Person 2';

    const {
        p1Incomes,
        p2Incomes,
        p1TotalIncome: p1Total,
        p2TotalIncome: p2Total,
        p1TaxResult,
        p2TaxResult,
        combinedNet,
        propertyBreakdowns,
        p1MovableInterest,
        p2MovableInterest,
        totalMovableInterest
    } = useSimulatorCalculations(movableInterestP1Percent, propertySplits, effectiveTaxYear, isaSweep);

    const availableTaxYears = getAvailableSimulatorTaxYears(
        taxRules,
        Object.keys(TAX_YEAR_CONSTANTS)
    );

    const movableInterestSliderValue = calculateSliderPercent(
        movableInterestP1Percent,
        p1MovableInterest,
        totalMovableInterest
    );

    return {
        p1Name,
        p2Name,
        effectiveTaxYear,
        availableTaxYears,
        isaSweep,
        isModified,
        p1Incomes,
        p2Incomes,
        p1Total,
        p2Total,
        p1TaxResult,
        p2TaxResult,
        combinedNet,
        propertyBreakdowns,
        p1MovableInterest,
        p2MovableInterest,
        totalMovableInterest,
        movableInterestSliderValue,
        propertySplits,
        setSelectedTaxYear,
        setMovableInterestP1Percent,
        setIsaSweep,
        handlePropertySplitChange,
        handleReset
    };
}

export function useScenariosPage() {
    const profile = useProfileState();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    return {
        p1Name,
        p2Name
    };
}
