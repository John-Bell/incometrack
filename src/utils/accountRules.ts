import { type AccountCategory } from '@/constants/taxConstants';

export const canShowAER = (category: string | AccountCategory): boolean => {
    return category === '' || !['Stocks & Shares', 'Shares ISA', 'DC Pension', 'DC Pension (Post-Drawdown)', 'Premium Bonds'].includes(category as string);
};

export const canShowBonus = (category: string | AccountCategory): boolean => {
    return category === '' || ['Easy Access Savings', 'Cash ISA', 'Current Account', 'Fixed Term Savings', 'Notice Savings'].includes(category as string);
};
