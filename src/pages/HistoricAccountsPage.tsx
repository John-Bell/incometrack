import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { MonthlyCloseOut } from '../components/settings/MonthlyCloseOut';
import { HistoryLogItem } from '../components/settings/HistoryLogItem';
import { archiveCurrentMonth } from '@/services/archiveService';

export function HistoricAccountsPage() {
    const navigate = useNavigate();

    return (
        <AppLayout
            header={
                <Header
                    title="Historic Accounts"
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
                <section className="mt-8 px-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60 mb-3 px-1">Monthly Close-Out</h2>
                    <MonthlyCloseOut
                        description="Archives current balances and interest rates to history and prepares the ledger for the new month. This action is final."
                        monthString="October 2025"
                        onArchive={() => archiveCurrentMonth()}
                    />
                </section>

                <section className="mt-8 px-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-primary/60">History Log</h2>
                        <button className="text-xs font-bold text-primary hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        <HistoryLogItem month="September 2025" closedDate="Sep 30, 2025" totalInterest="£1,280.42" />
                        <HistoryLogItem month="August 2025" closedDate="Aug 31, 2025" totalInterest="£1,142.10" />
                        <HistoryLogItem month="July 2025" closedDate="Jul 31, 2025" totalInterest="£988.50" />
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
