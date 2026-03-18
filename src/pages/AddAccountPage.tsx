import { Icon } from '@/components/ui/Icon';
import { ACCOUNT_CATEGORIES, type AccountCategory } from '@/constants/taxConstants';
import { useAddAccountForm } from '@/hooks/useAddAccountForm';

export function AddAccountPage() {
    const {
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
    } = useAddAccountForm();

    return (
        <div className="w-full max-w-3xl mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark shadow-2xl">
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

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Account Name Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Account Name</label>
                    <input
                        className="w-full h-14 px-4 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                        type="text"
                        placeholder="e.g. Santander eSaver"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                    />
                </div>


                {/* Nickname Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Nickname (Optional)</label>
                    <input
                        className="w-full h-14 px-4 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                        type="text"
                        placeholder="e.g. Holiday Fund"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
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
                        value={last4Digits}
                        onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ''))}
                    />
                </div>

                {/* Category Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Category</label>
                    <div className="relative">
                        <select
                            className="w-full h-14 pl-4 pr-12 appearance-none text-slate-900 dark:text-slate-100 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as AccountCategory)}
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
                {category === 'Current Account' && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Budget Order (Optional)</label>
                        <input
                            className="w-full h-14 px-4 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                            type="number"
                            placeholder="e.g. 1"
                            value={budgetOrder}
                            onChange={(e) => setBudgetOrder(e.target.value)}
                        />
                    </div>
                )}

                {/* Balance Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Balance</label>
                    <div className="relative flex items-center">
                        <input
                            className="w-full h-14 pl-4 pr-12 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                            type="number"
                            placeholder="0.00"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                        />
                        <span className="absolute right-4 text-primary material-symbols-outlined">attach_money</span>
                    </div>
                </div>

                {/* Interest Rate Field */}
                {showAER && (
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400">Interest Rate (%)</label>
                        <div className="relative flex items-center">
                            <input
                                className="w-full h-14 pl-4 pr-12 rounded-lg bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100"
                                type="number"
                                step="0.01"
                                placeholder="5.20"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                            />
                            <span className="absolute right-4 text-slate-400 font-bold">%</span>
                        </div>
                    </div>
                )}

                {/* Interest Payout Section */}
                {showAER && parseFloat(interestRate) > 0 && (
                    <div className="space-y-4 p-5 rounded-xl border border-primary/20 bg-primary/5">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">Interest Payout</h3>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Frequency</label>
                            <div className="relative">
                                <select
                                    className="w-full h-14 pl-4 pr-12 appearance-none text-slate-900 dark:text-slate-100 rounded-lg bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={payoutFrequency}
                                    onChange={(e) => setPayoutFrequency(e.target.value as 'monthly' | 'annually' | 'at_maturity' | '')}
                                >
                                    <option value="" disabled>Select Frequency</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="annually">Annually</option>
                                    <option value="at_maturity">At Maturity</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-slate-400">expand_more</span>
                            </div>
                        </div>

                        {(payoutFrequency === 'annually' || payoutFrequency === 'at_maturity') && (
                            <div className="space-y-2 fade-in">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Next Payout Date</label>
                                <div className="relative">
                                    <input
                                        className="w-full h-12 px-4 rounded-lg bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 focus:border-primary outline-none text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                                        type="date"
                                        value={payoutDate}
                                        onChange={(e) => setPayoutDate(e.target.value)}
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
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                                    {category === 'Fixed Term Savings' || category === 'Notice Savings' ? 'Maturity Tracking' : 'Bonus Rate'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Additional interest for a limited period</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={bonusRateActive}
                                    onChange={(e) => setBonusRateActive(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-primary/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {bonusRateActive && (
                            <div className="space-y-2 fade-in">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bonus End Date</label>
                                <div className="relative">
                                    <input
                                        className="w-full h-12 px-4 rounded-lg bg-white dark:bg-primary/10 border border-slate-200 dark:border-primary/20 focus:border-primary outline-none text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                                        type="date"
                                        value={bonusEndDate}
                                        onChange={(e) => setBonusEndDate(e.target.value)}
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
                            onClick={() => setOwnerId('person1')}
                            className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${ownerId === 'person1'
                                ? 'border-primary bg-primary/10 text-primary font-bold'
                                : 'border-slate-200 dark:border-primary/20 hover:border-primary text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            {p1Name}
                        </button>
                        <button
                            onClick={() => setOwnerId('person2')}
                            className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${ownerId === 'person2'
                                ? 'border-primary bg-primary/10 text-primary font-bold'
                                : 'border-slate-200 dark:border-primary/20 hover:border-primary text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            {p2Name}
                        </button>
                        <button
                            onClick={() => setOwnerId('joint')}
                            className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${ownerId === 'joint'
                                ? 'border-2 border-primary bg-primary/10 text-primary font-bold'
                                : 'border-slate-200 dark:border-primary/20 hover:border-primary text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            Joint
                        </button>
                    </div>
                </div>
            </main>

            {/* Action Buttons */}
            <footer className="p-4 bg-background-light dark:bg-background-dark border-t border-primary/10 space-y-3">
                <button
                    onClick={handleSave}
                    disabled={!accountName || !balance || (showAER && !interestRate) || !category}
                    className="w-full py-4 rounded-xl bg-primary text-background-dark font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add Account
                </button>
            </footer>
        </div>
    );
}
