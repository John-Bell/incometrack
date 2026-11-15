import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useLifetimeProjection } from '@/hooks/useLifetimeProjection';
import type { DrawdownStrategy } from '@/utils/projectionEngine';
import {
    calculateAssetComposition,
    calculateBurndownPotSummaries,
    DRAWDOWN_STRATEGIES
} from '@/utils/assetUtils';

export function useAssetCompositionPage() {
    const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
    const { chartData, totalAssets } = calculateAssetComposition(accounts);

    return {
        accounts,
        chartData,
        totalAssets
    };
}

export function useAssetBurndownPage() {
    const [strategy, setStrategy] = useState<DrawdownStrategy>('taxable_first');
    const { data, isReady, protectionFloor, settingsId } = useLifetimeProjection(strategy);

    const potSummaries = calculateBurndownPotSummaries(data, isReady);
    const activeStrategyDescription =
        DRAWDOWN_STRATEGIES.find(s => s.id === strategy)?.description || '';

    const handleProtectionFloorChange = (value: string) => {
        if (settingsId) {
            db.settings.update(settingsId, { protectionFloor: Number(value) || 0 });
        }
    };

    return {
        strategy,
        setStrategy,
        strategies: DRAWDOWN_STRATEGIES,
        activeStrategyDescription,
        protectionFloor,
        handleProtectionFloorChange,
        potSummaries
    };
}
