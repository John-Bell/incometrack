import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { type AccountCategory } from '@/constants/taxConstants';
import { canShowAER, canShowBonus } from '@/utils/accountRules';

export function useEditAccountForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    const account = useLiveQuery(() => db.accounts.get(id || ''), [id]);

    const [accountName, setAccountName] = useState('');
    const [nickname, setNickname] = useState('');
    const [last4Digits, setLast4Digits] = useState('');
    const [category, setCategory] = useState<AccountCategory | ''>('');
    const [balance, setBalance] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [budgetOrder, setBudgetOrder] = useState('');
    const [interestTrackingMethod, setInterestTrackingMethod] = useState<'aer' | 'manual'>('aer');
    const [bonusRateActive, setBonusRateActive] = useState(false);
    const [bonusEndDate, setBonusEndDate] = useState('');
    const [payoutFrequency, setPayoutFrequency] = useState<'monthly' | 'annually' | 'at_maturity' | ''>('');
    const [payoutDate, setPayoutDate] = useState('');
    const [ownerId, setOwnerId] = useState('joint');

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (account) {
            setAccountName(account.name);
            setNickname(account.nickname || '');
            setLast4Digits(account.last4Digits || '');
            setCategory((account.category as AccountCategory) || '');
            setBalance(account.balance.toString());
            setInterestRate(account.interestRate.toString());
            setBudgetOrder(account.budgetOrder !== undefined ? account.budgetOrder.toString() : '');
            setInterestTrackingMethod(account.interestTrackingMethod || 'aer');
            setBonusRateActive(account.bonusRateActive || false);
            if (account.bonusEndDate) {
                // Convert timestamp to YYYY-MM-DD
                const date = new Date(account.bonusEndDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                setBonusEndDate(`${year}-${month}-${day}`);
            }
            setPayoutFrequency(account.interestPayoutFrequency || '');
            if (account.interestPayoutDate) {
                const pDate = new Date(account.interestPayoutDate);
                const pYear = pDate.getFullYear();
                const pMonth = String(pDate.getMonth() + 1).padStart(2, '0');
                const pDay = String(pDate.getDate()).padStart(2, '0');
                setPayoutDate(`${pYear}-${pMonth}-${pDay}`);
            } else {
                setPayoutDate('');
            }
            setOwnerId(account.ownerId);
        }
    }, [account]);

    const isEligibleForAER = canShowAER(category);
    const showBonus = canShowBonus(category);

    useEffect(() => {
        if (!isEligibleForAER && interestTrackingMethod !== 'manual') {
            setInterestTrackingMethod('manual');
        }
    }, [isEligibleForAER, interestTrackingMethod]);

    const handleSave = async () => {
        if (!id || !accountName || !balance || !category) return;
        if (isEligibleForAER && interestTrackingMethod === 'aer' && !interestRate) return;

        const finalInterestRate = isEligibleForAER && interestTrackingMethod === 'aer' ? parseFloat(interestRate) : 0;

        try {
            await db.accounts.update(id, {
                name: accountName,
                nickname: nickname || undefined,
                last4Digits: last4Digits || undefined,
                category,
                balance: parseFloat(balance),
                interestRate: finalInterestRate,
                interestTrackingMethod: isEligibleForAER ? interestTrackingMethod : 'manual',
                budgetOrder: budgetOrder !== '' ? parseInt(budgetOrder, 10) : undefined,
                bonusRateActive: showBonus ? bonusRateActive : false,
                bonusEndDate: showBonus && bonusRateActive && bonusEndDate ? new Date(bonusEndDate).getTime() : undefined,
                interestPayoutFrequency: payoutFrequency || undefined,
                interestPayoutDate: (payoutFrequency === 'annually' || payoutFrequency === 'at_maturity') && payoutDate
                    ? new Date(payoutDate).getTime()
                    : undefined,
                ownerId,
                updatedAt: Date.now(),
            });
            navigate('/accounts');
        } catch (error) {
            console.error('Failed to update account', error);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            await db.accounts.delete(id);
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
        accountName,
        setAccountName,
        nickname,
        setNickname,
        last4Digits,
        setLast4Digits,
        category,
        setCategory,
        balance,
        setBalance,
        interestRate,
        setInterestRate,
        budgetOrder,
        setBudgetOrder,
        interestTrackingMethod,
        setInterestTrackingMethod,
        bonusRateActive,
        setBonusRateActive,
        bonusEndDate,
        setBonusEndDate,
        payoutFrequency,
        setPayoutFrequency,
        payoutDate,
        setPayoutDate,
        ownerId,
        setOwnerId,
        showDeleteConfirm,
        setShowDeleteConfirm,
        isEligibleForAER,
        showBonus,
        handleSave,
        handleDelete
    };
}
