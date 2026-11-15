import { AppLayout } from '../components/layout/AppLayout';
import { Header } from '../components/layout/Header';
import { Icon } from '../components/ui/Icon';
import { Tabs } from '../components/ui/Tabs';
import { TaxBandVisualizer } from '../components/income/TaxBandVisualizer';
import { IncomeEntryCard } from '../components/income/IncomeEntryCard';
import { IncomeEntryForm } from '../components/income/IncomeEntryForm';
import { MainHeaderActions } from '../components/layout/MainHeaderActions';
import { useIncomeEditPage } from '@/hooks/useIncomePages';

export function IncomeEditPage() {
    const {
        p1Name,
        p2Name,
        activeTabKey,
        activeTaxResult,
        activeTotalIncome,
        pensions,
        employment,
        dividends,
        formData,
        editingId,
        handleFormChange,
        handleEdit,
        handleSaveEntry,
        handleDeleteEntry,
        handleCancelEdit,
        handleAddClick,
        handleTabChange,
        handleSaveAndCalculate,
        handleNavigateBack
    } = useIncomeEditPage();

    return (
        <AppLayout
            header={
                <Header
                    title="Income Configuration"
                    className="text-center justify-center relative"
                    leftElement={
                        <button
                            onClick={handleNavigateBack}
                            className="absolute left-4 flex w-10 h-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Icon name="arrow_back" className="text-2xl text-slate-900 dark:text-slate-100" />
                        </button>
                    }
                    rightElement={<MainHeaderActions onSave={handleSaveAndCalculate} />}
                />
            }
        >
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <Tabs
                    options={[p1Name, p2Name]}
                    selected={activeTabKey === 'partner1' ? p1Name : p2Name}
                    onValueChange={handleTabChange}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 px-4 py-6 md:pb-12 max-w-7xl mx-auto">
                {/* Left Column: Flow & Lists */}
                <div className="space-y-8">
                    <TaxBandVisualizer totalIncome={activeTotalIncome} taxResult={activeTaxResult} />

                    {/* Pensions */}
                    <section>
                        <div className="flex items-center justify-between mb-4 pl-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-slate-900 dark:text-white text-lg font-bold">Pensions</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{pensions.length} ENTRIES</span>
                                <button
                                    onClick={() => handleAddClick()}
                                    className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                >
                                    <Icon name="add" className="text-lg" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {pensions.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 pl-1">No pensions recorded.</p>
                            )}
                            {pensions.map(inc => (
                                <IncomeEntryCard key={inc.id} income={inc} onEdit={handleEdit} onDelete={handleDeleteEntry} />
                            ))}
                        </div>
                    </section>

                    {/* Employment & Other */}
                    <section>
                        <div className="flex items-center justify-between mb-4 pl-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-slate-900 dark:text-white text-lg font-bold">Employment & Other</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{employment.length} ENTRIES</span>
                                <button
                                    onClick={() => handleAddClick()}
                                    className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                >
                                    <Icon name="add" className="text-lg" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {employment.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 pl-1">No employment income recorded.</p>
                            )}
                            {employment.map(inc => (
                                <IncomeEntryCard key={inc.id} income={inc} onEdit={handleEdit} onDelete={handleDeleteEntry} />
                            ))}
                        </div>
                    </section>

                    {/* Dividends */}
                    <section>
                        <div className="flex items-center justify-between mb-4 pl-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-slate-900 dark:text-white text-lg font-bold">Dividends</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{dividends.length} ENTRIES</span>
                                <button
                                    onClick={() => handleAddClick()}
                                    className="w-7 h-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                >
                                    <Icon name="add" className="text-lg" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {dividends.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 pl-1">No dividend income recorded.</p>
                            )}
                            {dividends.map(inc => (
                                <IncomeEntryCard key={inc.id} income={inc} onEdit={handleEdit} onDelete={handleDeleteEntry} />
                            ))}
                            <p className="mt-4 text-xs text-slate-500 dark:text-[#9db9b0] leading-relaxed pl-1 max-w-sm">
                                Dividend allowance of £500 is applied automatically. This income sits on top of non-savings income in your tax stack.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Right Column: Sticky Form */}
                <div className="md:sticky md:top-24 space-y-6 self-start pb-24 md:pb-0">
                    <IncomeEntryForm
                        formData={formData}
                        isEditing={!!editingId}
                        onChange={handleFormChange}
                        onSave={handleSaveEntry}
                        onCancel={handleCancelEdit}
                    />

                    <button
                        onClick={handleSaveAndCalculate}
                        className="w-full h-14 bg-[#13eca4] text-[#10221c] font-bold text-lg rounded-xl shadow-[0_4px_14px_0_rgba(19,236,164,0.39)] flex items-center justify-center gap-2 hover:bg-[#11d896] hover:shadow-[0_6px_20px_rgba(19,236,164,0.23)] transition-all active:scale-[0.98]"
                    >
                        <Icon name="check" className="text-2xl" />
                        Save & Calculate
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
