import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { type AccountCategory } from '@/constants/taxConstants';
import { canShowAER, canShowBonus } from '@/utils/accountRules';

// We use string for numeric inputs in the form data to handle intermediate states like empty strings
export interface AccountFormData {
    ownerId: string;
    accountName: string;
    nickname: string;
    last4Digits: string;
    category: AccountCategory | '';
    balance: string;
    interestRate: string;
    budgetOrder: string;
    interestTrackingMethod: 'aer' | 'manual';
    bonusRateActive: boolean;
    bonusEndDate: string; // YYYY-MM-DD
    interestPayoutFrequency: 'monthly' | 'annually' | 'at_maturity' | '';
    interestPayoutDate: string; // YYYY-MM-DD
}

const defaultFormData: AccountFormData = {
    ownerId: 'joint',
    accountName: '',
    nickname: '',
    last4Digits: '',
    category: '',
    balance: '',
    interestRate: '',
    budgetOrder: '',
    interestTrackingMethod: 'aer',
    bonusRateActive: false,
    bonusEndDate: '',
    interestPayoutFrequency: '',
    interestPayoutDate: '',
};

export function useAccountForm(accountId?: string) {
    const navigate = useNavigate();
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    const account = useLiveQuery(() => accountId ? db.accounts.get(accountId) : undefined, [accountId]);

    const [formData, setFormData] = useState<AccountFormData>(defaultFormData);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (account) {
            setFormData({
                ownerId: account.ownerId || 'joint',
                accountName: account.name || '',
                nickname: account.nickname || '',
                last4Digits: account.last4Digits || '',
                category: (account.category as AccountCategory) || '',
                balance: account.balance.toString(),
                interestRate: account.interestRate.toString(),
                budgetOrder: account.budgetOrder !== undefined ? account.budgetOrder.toString() : '',
                interestTrackingMethod: account.interestTrackingMethod || 'aer',
                bonusRateActive: account.bonusRateActive || false,
                bonusEndDate: account.bonusEndDate
                    ? new Date(account.bonusEndDate).toISOString().split('T')[0]
                    : '',
                interestPayoutFrequency: account.interestPayoutFrequency || '',
                interestPayoutDate: account.interestPayoutDate
                    ? new Date(account.interestPayoutDate).toISOString().split('T')[0]
                    : '',
            });
        } else if (!accountId) {
            setFormData(defaultFormData);
        }
    }, [account, accountId]);

    const showAER = canShowAER(formData.category as AccountCategory);
    const showBonus = canShowBonus(formData.category as AccountCategory);

    useEffect(() => {
        if (!showAER && formData.interestTrackingMethod !== 'manual') {
            handleChange('interestTrackingMethod', 'manual');
        }
    }, [showAER, formData.interestTrackingMethod]);

    useEffect(() => {
        if (formData.category !== 'Current Account' && formData.budgetOrder !== '') {
            handleChange('budgetOrder', '');
        }
    }, [formData.category]);

    const handleChange = (field: keyof AccountFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.accountName || !formData.balance || !formData.category) return;
        if (showAER && formData.interestTrackingMethod === 'aer' && !formData.interestRate) return;

        const finalInterestRate = showAER && formData.interestTrackingMethod === 'aer'
            ? parseFloat(formData.interestRate)
            : 0;

        const accountData = {
            ownerId: formData.ownerId,
            name: formData.accountName,
            nickname: formData.nickname || undefined,
            last4Digits: formData.last4Digits || undefined,
            category: formData.category,
            balance: parseFloat(formData.balance),
            interestRate: finalInterestRate,
            interestTrackingMethod: showAER ? formData.interestTrackingMethod : 'manual',
            budgetOrder: formData.budgetOrder !== '' ? parseInt(formData.budgetOrder, 10) : undefined,
            bonusRateActive: showBonus ? formData.bonusRateActive : false,
            bonusEndDate: showBonus && formData.bonusRateActive && formData.bonusEndDate
                ? new Date(formData.bonusEndDate).getTime()
                : undefined,
            interestPayoutFrequency: formData.interestPayoutFrequency || undefined,
            interestPayoutDate: formData.interestPayoutFrequency && formData.interestPayoutDate
                ? new Date(formData.interestPayoutDate).getTime()
                : undefined,
            updatedAt: Date.now(),
        };

        try {
            if (accountId) {
                await db.accounts.update(accountId, accountData);
            } else {
                await db.accounts.add({
                    ...accountData,
                    id: crypto.randomUUID(),
                } as Account);
            }
            navigate('/accounts');
        } catch (error) {
            console.error('Failed to save account', error);
        }
    };

    const handleDelete = async () => {
        if (!accountId) return;
        try {
            await db.accounts.delete(accountId);
            navigate('/accounts');
        } catch (error) {
            console.error('Failed to delete account', error);
        }
    };

    return {
        account,
        navigate,
        p1Name,
        p2Name,
        formData,
        handleChange,
        isEditing: !!accountId,
        showAER,
        showBonus,
        handleSave,
        handleDelete,
        showDeleteConfirm,
        setShowDeleteConfirm
    };
}
