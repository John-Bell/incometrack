import type { Budget, PaymentMapping } from '@/lib/db';

export interface GroupedBudgetOption {
    categoryId: string;
    categoryName: string;
    budgets: Budget[];
}

export interface PaymentMappingValidationResult {
    isValid: boolean;
    errorMessage?: string;
    trimmedName: string;
}

/**
 * Groups and sorts budgets for selection dropdowns.
 */
export function getGroupedBudgets(budgets: Budget[]): GroupedBudgetOption[] {
    return [
        {
            categoryId: 'all',
            categoryName: 'All Budgets',
            budgets: [...budgets].sort((a, b) => a.name.localeCompare(b.name)),
        },
    ];
}

/**
 * Toggles a budget ID in an array, returning a new array.
 */
export function toggleBudgetId(currentBudgetIds: string[], targetId: string): string[] {
    if (currentBudgetIds.includes(targetId)) {
        return currentBudgetIds.filter((bId) => bId !== targetId);
    }
    return [...currentBudgetIds, targetId];
}

/**
 * Validates payment mapping name and budget selections.
 */
export function validatePaymentMapping(
    paymentName: string,
    budgetIds: string[],
    existingMappings: PaymentMapping[],
    currentId?: string
): PaymentMappingValidationResult {
    const trimmedName = paymentName.trim();

    if (!trimmedName) {
        return {
            isValid: false,
            errorMessage: 'Payment name is required.',
            trimmedName,
        };
    }

    if (budgetIds.length === 0) {
        return {
            isValid: false,
            errorMessage: 'At least one budget must be selected.',
            trimmedName,
        };
    }

    const duplicateExists = existingMappings.some(
        (m) =>
            (!currentId || m.id !== currentId) &&
            m.paymentName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateExists) {
        return {
            isValid: false,
            errorMessage: 'A mapping with this payment name already exists.',
            trimmedName,
        };
    }

    return {
        isValid: true,
        trimmedName,
    };
}
