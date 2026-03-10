import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';

export function DataImportsPage() {
    const navigate = useNavigate();

    return (
        <AppLayout
            header={
                <Header
                    title="Data Imports"
                    leftElement={
                        <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center cursor-pointer">
                            <Icon name="arrow_back" className="text-primary text-2xl" />
                        </button>
                    }
                    className="bg-transparent backdrop-blur-md"
                />
            }
        >
            <div className="flex-1 w-full mx-auto pb-8">
                <section className="mt-6 px-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60 mb-3 px-1">Import External Data</h2>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-primary/5 rounded-xl divide-y divide-slate-100 dark:divide-primary/5">
                        <Link to="/settings/import/accounts" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-primary/80">
                                    <Icon name="account_balance" />
                                </div>
                                <p className="font-medium">Import Accounts</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                <Icon name="chevron_right" className="text-sm" />
                            </div>
                        </Link>

                        <Link to="/settings/import/budgets" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-primary/80">
                                    <Icon name="account_balance_wallet" />
                                </div>
                                <p className="font-medium">Import Budgets</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                <Icon name="chevron_right" className="text-sm" />
                            </div>
                        </Link>

                        <Link to="/settings/import/transactions" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-primary/5 text-slate-600 dark:text-primary/80">
                                    <Icon name="receipt_long" />
                                </div>
                                <p className="font-medium">Import Transactions</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                <Icon name="chevron_right" className="text-sm" />
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
