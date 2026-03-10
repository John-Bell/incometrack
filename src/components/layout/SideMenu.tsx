import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { cn } from '@/lib/utils';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
    const navigate = useNavigate();

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleNavigate = (path: string) => {
        onClose();
        navigate(path);
    };

    const content = (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    'fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Menu Drawer */}
            <div
                className={cn(
                    'fixed top-0 left-0 bottom-0 z-[101] w-[280px] bg-background-light dark:bg-background-dark shadow-xl transition-transform duration-300 ease-in-out flex flex-col',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200 dark:border-[#283933]">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Menu</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-surface-dark transition-colors cursor-pointer"
                        aria-label="Close menu"
                    >
                        <Icon name="close" className="text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <nav className="flex-1 py-4 flex flex-col gap-2 px-4 overflow-y-auto">
                    <button
                        type="button"
                        onClick={() => handleNavigate('/settings')}
                        className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors text-left cursor-pointer group"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-black/30 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                            <Icon name="settings" className="text-xl" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            Settings
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleNavigate('/data-imports')}
                        className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors text-left cursor-pointer group"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-black/30 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                            <Icon name="file_download" className="text-xl" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            Data Imports
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleNavigate('/historic-accounts')}
                        className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-dark transition-colors text-left cursor-pointer group"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-black/30 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                            <Icon name="history" className="text-xl" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            Historic Accounts
                        </span>
                    </button>
                    {/* Add more menu items here in the future */}
                </nav>

                <div className="p-6 border-t border-gray-200 dark:border-[#283933]">
                    <p className="text-xs text-center text-slate-500 dark:text-slate-500">
                        The Chaser App
                    </p>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}
