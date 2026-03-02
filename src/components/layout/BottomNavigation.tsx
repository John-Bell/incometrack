import { cn } from '@/lib/utils';
// 1. Import useLocation and Link from React Router
import { useLocation, Link } from 'react-router-dom';

export function BottomNavigation() {
    // 2. Grab the current URL path from React Router's native location state
    const location = useLocation();
    const currentPath = location.pathname;

    const tabs = [
        { name: 'Accounts', path: '/accounts', icon: 'account_balance_wallet' },
        { name: 'Payments', path: '/transactions', icon: 'receipt_long' },
        { name: 'Budgets', path: '/budgets', icon: 'pie_chart' },
        { name: 'Incomes', path: '/income', icon: 'payments' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1c2723] border-t border-[#283933] pb-safe-area-inset-bottom">
            <div className="flex justify-around items-center max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-2 py-3">
                {tabs.map((tab) => {
                    const isActive = currentPath === tab.path;
                    return (
                        <Link
                            key={tab.name}
                            to={tab.path}
                            className={cn(
                                'flex flex-col items-center gap-1 min-w-[64px] group flex-1',
                                isActive ? 'text-primary' : 'text-[#9db9b0]'
                            )}
                        >
                            <div
                                className={cn(
                                    'p-1 rounded-full transition-colors',
                                    isActive ? 'text-primary' : 'group-hover:text-primary'
                                )}
                            >
                                <span
                                    className={cn(
                                        'material-symbols-outlined text-[24px]',
                                        isActive && 'fill'
                                    )}
                                >
                                    {tab.icon}
                                </span>
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] font-medium transition-colors',
                                    isActive ? 'text-white font-bold' : 'group-hover:text-primary'
                                )}
                            >
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav >
    );
}