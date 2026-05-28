import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import LifetimeProjectionChart from '../components/scenarios/LifetimeProjectionChart';

export function CashflowProjectionPage() {
    return (
        <AppLayout
            header={
                <Header
                    title="Cashflow Projection"
                    subtitle="Lifetime Projection Overview"
                    leftElement={
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Icon name="trending_up" className="text-2xl" />
                        </div>
                    }
                />
            }
        >
            <div className="mx-auto p-4 space-y-6">
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-primary/40">Projection Chart</h2>
                    </div>
                    <LifetimeProjectionChart />
                </section>
            </div>
        </AppLayout>
    );
}
