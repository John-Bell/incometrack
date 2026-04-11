import { Icon } from '@/components/ui/Icon';
import { ACCOUNT_CATEGORIES, type AccountCategory } from '@/constants/taxConstants';
import { InterestLedger } from '@/components/accounts/InterestLedger';
import { useAccountForm } from '@/hooks/useAccountForm';
import { DateInput } from '@/components/ui/DateInput';

export function AddAccountPage() {
    const {
        activeAccountId,
        navigate,
        p1Name,
        p2Name,
        formData,
        handleChange,
        showAER,
        showBonus,
        handleSave
    } = useAccountForm();

    return (
        <div className="w-full max-w-7xl mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark shadow-2xl relative">
            {/* TopAppBar */}
            <header className="flex items-center p-4 border-b border-primary/10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-primary/10 rounded-full transition-colors text-slate-900 dark:text-slate-100"
                >
                    <Icon name="arrow_back" className="block" />
                </button>
                <h1 className="ml-4 text-xl font-bold tracking-tight">Add Account</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col xl:flex-row gap-8">
                <main className={`space-y-6 ${formData.interestTrackingMethod === 'manual' ? 'xl:w-[calc(40%-1rem)]' : 'flex-1'}`}>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">GENERAL INFORMATION</h2>
                {/* Account Name Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Account Name</label>
                    <input
                        className="w-full h-14 px-4 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                        type="text"
                        placeholder="e.g. Santander eSaver"
                            value={formData.accountName}
                            onChange={(e) => handleChange('accountName', e.target.value)}
                    />
                </div>


                {/* Nickname Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Nickname (Optional)</label>
                    <input
                        className="w-full h-14 px-4 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                        type="text"
                        placeholder="e.g. Holiday Fund"
                            value={formData.nickname}
                            onChange={(e) => handleChange('nickname', e.target.value)}
                    />
                </div>

                {/* Last 4 Digits Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Last 4 Digits (Optional)</label>
                    <input
                        className="w-full h-14 px-4 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 1234"
                            value={formData.last4Digits}
                            onChange={(e) => handleChange('last4Digits', e.target.value.replace(/\D/g, ''))}
                    />
                </div>

                {/* Category Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Category</label>
                    <div className="relative">
                        <select
                            className="w-full h-14 pl-4 pr-12 appearance-none text-slate-900 dark:text-slate-100 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value as AccountCategory)}
                        >
                            <option value="" disabled>Select Category</option>
                            {ACCOUNT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-slate-400">expand_more</span>
                    </div>
                </div>

                {/* Budget Order Field */}
                    {formData.category === 'Current Account' && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Budget Order (Optional)</label>
                        <input
                            className="w-full h-14 px-4 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                            type="number"
                            placeholder="e.g. 1"
                                value={formData.budgetOrder}
                                onChange={(e) => handleChange('budgetOrder', e.target.value)}
                        />
                    </div>
                )}

                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-8 mb-4">FINANCIAL SETTINGS</h2>

                {/* Calculation Method Field */}
                {showAER && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Calculation Method</label>
                        <div className="flex bg-slate-100 dark:bg-primary/10 rounded-lg p-1">
                            <button
                                onClick={() => handleChange('interestTrackingMethod', 'aer')}
                                className={`flex-1 py-3 text-sm font-semibold rounded-md transition-all ${
                                    formData.interestTrackingMethod === 'aer'
                                        ? 'bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                AER (%)
                            </button>
                            <button
                                onClick={() => handleChange('interestTrackingMethod', 'manual')}
                                className={`flex-1 py-3 text-sm font-semibold rounded-md transition-all ${
                                    formData.interestTrackingMethod === 'manual'
                                        ? 'bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                Manual Ledger
                            </button>
                        </div>
                    </div>
                )}

                {/* Balance and Interest Rate Fields */}
                <div className={showAER && formData.interestTrackingMethod === 'aer' ? "grid grid-cols-2 gap-4 items-start" : "space-y-2"}>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Current Balance</label>
                        <div className="relative flex items-center">
                            <input
                                className="w-full h-14 pl-4 pr-12 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                                type="number"
                                placeholder="0.00"
                                value={formData.balance}
                                onChange={(e) => handleChange('balance', e.target.value)}
                            />
                            <span className="absolute right-4 text-primary material-symbols-outlined">attach_money</span>
                        </div>
                    </div>

                    {showAER && formData.interestTrackingMethod === 'aer' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Interest Rate (%)</label>
                            <div className="relative flex items-center">
                                <input
                                    className="w-full h-14 pl-4 pr-12 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                                    type="number"
                                    step="0.01"
                                    placeholder="5.20"
                                    value={formData.interestRate}
                                    onChange={(e) => handleChange('interestRate', e.target.value)}
                                />
                                <span className="absolute right-4 text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                    )}

                    {/* Compound Interest Toggle */}
                    {showAER && formData.interestTrackingMethod === 'aer' && (
                        <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-white dark:bg-primary/5">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">Compounds Interest?</p>
                                <p className="text-xs text-slate-500">Enable for AER or compounding standard rates</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.isCompound}
                                    onChange={(e) => handleChange('isCompound', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/10 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Interest Payout Section */}
                {showAER && (
                    <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-primary/5">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">Interest Payout</h3>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Frequency</label>
                            <div className="relative">
                                <select
                                    className="w-full h-14 pl-4 pr-12 appearance-none text-slate-900 dark:text-slate-100 rounded-lg bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={formData.interestPayoutFrequency}
                                    onChange={(e) => handleChange('interestPayoutFrequency', e.target.value as 'monthly' | 'annually' | 'at_maturity' | '')}
                                >
                                    <option value="" disabled>Select Frequency</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="annually">Annually</option>
                                    <option value="at_maturity">At Maturity</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-slate-400">expand_more</span>
                            </div>
                        </div>

                        {(formData.interestPayoutFrequency === 'annually' || formData.interestPayoutFrequency === 'at_maturity') && (
                            <div className="space-y-2 fade-in min-w-0 w-full">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    {formData.interestPayoutFrequency === 'at_maturity' ? 'Maturity Date' : 'Next Payout Date'}
                                </label>
                                <div className="relative min-w-0 w-full">
                                    <DateInput
                                        className="w-full h-12 px-4 rounded-lg bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 focus:border-primary outline-none text-slate-900 dark:text-slate-100"
                                        value={formData.interestPayoutDate}
                                        onChange={(e) => handleChange('interestPayoutDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bonus Rate Section */}
                {showBonus && (
                    <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">Bonus Rate</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Additional interest for a limited period</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.bonusRateActive}
                                    onChange={(e) => handleChange('bonusRateActive', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-primary/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {formData.bonusRateActive && (
                            <div className="space-y-2 fade-in min-w-0 w-full">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bonus End Date</label>
                                <div className="relative min-w-0 w-full">
                                    <DateInput
                                        className="w-full h-12 px-4 rounded-lg bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 focus:border-primary outline-none text-slate-900 dark:text-slate-100"
                                        value={formData.bonusEndDate}
                                        onChange={(e) => handleChange('bonusEndDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Ownership Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Ownership</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleChange('ownerId', 'person1')}
                            className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${formData.ownerId === 'person1'
                                ? 'border-primary bg-primary/10 text-primary font-bold'
                                : 'border-slate-200 dark:border-primary/20 hover:border-primary text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            {p1Name}
                        </button>
                        <button
                            onClick={() => handleChange('ownerId', 'person2')}
                            className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${formData.ownerId === 'person2'
                                ? 'border-primary bg-primary/10 text-primary font-bold'
                                : 'border-slate-200 dark:border-primary/20 hover:border-primary text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            {p2Name}
                        </button>
                        <button
                            onClick={() => handleChange('ownerId', 'joint')}
                            className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${formData.ownerId === 'joint'
                                ? 'border-2 border-primary bg-primary/10 text-primary font-bold'
                                : 'border-slate-200 dark:border-primary/20 hover:border-primary text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            Joint
                        </button>
                    </div>
                </div>
                </main>

                {formData.interestTrackingMethod === 'manual' && (
                    <aside className="w-full xl:w-[calc(60%-1rem)]">
                        <InterestLedger accountId={activeAccountId} currentBalance={parseFloat(formData.balance) || 0} />
                    </aside>
                )}
            </div>

            {/* Action Buttons */}
            <footer className="p-4 bg-background-light dark:bg-background-dark border-t border-primary/10 space-y-3">
                <button
                    onClick={handleSave}
                    disabled={!formData.accountName || !formData.balance || (showAER && formData.interestTrackingMethod === 'aer' && !formData.interestRate) || !formData.category}
                    className="w-full py-4 rounded-xl bg-primary text-background-dark font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add Account
                </button>
            </footer>
        </div>
    );
}
