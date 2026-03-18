import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { type AccountCategory } from '@/constants/taxConstants';
import { canShowAER, canShowBonus } from '@/utils/accountRules';

export function useAddAccountForm() {
    const navigate = useNavigate();
    const { profile } = useStore();
    const p1Name = profile?.partner1Name || 'Partner 1';
    const p2Name = profile?.partner2Name || 'Partner 2';

    const [accountName, setAccountName] = useState('');
    const [nickname, setNickname] = useState('');
    const [last4Digits, setLast4Digits] = useState('');
    const [category, setCategory] = useState<AccountCategory | ''>('');
    const [balance, setBalance] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [budgetOrder, setBudgetOrder] = useState('');
    const [bonusRateActive, setBonusRateActive] = useState(false);
    const [bonusEndDate, setBonusEndDate] = useState('');
    const [payoutFrequency, setPayoutFrequency] = useState<'monthly' | 'annually' | 'at_maturity' | ''>('');
    const [payoutDate, setPayoutDate] = useState('');
    const [ownerId, setOwnerId] = useState('joint'); // 'person1', 'person2', 'joint'

    // Effect to clear budget order when category is not 'Current Account'
    useEffect(() => {
        if (category !== 'Current Account') {
            setBudgetOrder('');
        }
    }, [category]);

    const showAER = canShowAER(category);
    const showBonus = canShowBonus(category);

    const handleSave = async () => {
        if (!accountName || !balance || !category) return;
        if (showAER && !interestRate) return;

        const finalInterestRate = showAER ? parseFloat(interestRate) : 0;

        const newAccount = {
            id: crypto.randomUUID(),
            ownerId,
            name: accountName,
            nickname: nickname || undefined,
            last4Digits: last4Digits || undefined,
            balance: parseFloat(balance),
            interestRate: finalInterestRate,
            category,
            budgetOrder: budgetOrder !== '' ? parseInt(budgetOrder, 10) : undefined,
            bonusRateActive: showBonus ? bonusRateActive : false,
            // Convert 'YYYY-MM-DD' back to timestamp if active, else undefined
            bonusEndDate: showBonus && bonusRateActive && bonusEndDate ? new Date(bonusEndDate).getTime() : undefined,
            interestPayoutFrequency: payoutFrequency || undefined,
            interestPayoutDate: (payoutFrequency === 'annually' || payoutFrequency === 'at_maturity') && payoutDate
                ? new Date(payoutDate).getTime()
                : undefined,
            updatedAt: Date.now(),
        };

        try {
            await db.accounts.add(newAccount);
            navigate('/accounts');
        } catch (error) {
            console.error('Failed to add account', error);
        }
    };

    return {
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
        showAER,
        showBonus,
        handleSave
    };
}
