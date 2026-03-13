import re

def update_add_account():
    with open('src/pages/AddAccountPage.tsx', 'r') as f:
        content = f.read()

    # Add state variables
    content = re.sub(
        r"const \[accountName, setAccountName\] = useState\(''\);",
        "const [accountName, setAccountName] = useState('');\n    const [nickname, setNickname] = useState('');\n    const [last4Digits, setLast4Digits] = useState('');",
        content
    )

    # Add to newAccount object
    content = re.sub(
        r"name: accountName,\n\s*balance: parseFloat\(balance\),",
        "name: accountName,\n            nickname: nickname || undefined,\n            last4Digits: last4Digits || undefined,\n            balance: parseFloat(balance),",
        content
    )

    # Add inputs to UI
    ui_insert = """
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
                        onChange={(e) => setLast4Digits(e.target.value.replace(/\\D/g, ''))}
                    />
                </div>
"""

    content = content.replace("                {/* Category Field */}", ui_insert + "\n                {/* Category Field */}")

    with open('src/pages/AddAccountPage.tsx', 'w') as f:
        f.write(content)


def update_edit_account():
    with open('src/pages/EditAccountPage.tsx', 'r') as f:
        content = f.read()

    # Add state variables
    content = re.sub(
        r"const \[accountName, setAccountName\] = useState\(''\);",
        "const [accountName, setAccountName] = useState('');\n    const [nickname, setNickname] = useState('');\n    const [last4Digits, setLast4Digits] = useState('');",
        content
    )

    # Add effect population
    content = re.sub(
        r"setAccountName\(account.name\);",
        "setAccountName(account.name);\n            setNickname(account.nickname || '');\n            setLast4Digits(account.last4Digits || '');",
        content
    )

    # Add to update object
    content = re.sub(
        r"name: accountName,\n\s*category,",
        "name: accountName,\n                nickname: nickname || undefined,\n                last4Digits: last4Digits || undefined,\n                category,",
        content
    )

    # Add inputs to UI
    ui_insert = """
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
                        onChange={(e) => setLast4Digits(e.target.value.replace(/\\D/g, ''))}
                    />
                </div>
"""

    content = content.replace("                {/* Category Field */}", ui_insert + "\n                {/* Category Field */}")

    with open('src/pages/EditAccountPage.tsx', 'w') as f:
        f.write(content)

def update_account_card():
    with open('src/components/accounts/AccountCard.tsx', 'r') as f:
        content = f.read()

    content = content.replace("{account.name}", "{account.nickname || account.name}{account.last4Digits ? ` (x${account.last4Digits})` : ''}")

    with open('src/components/accounts/AccountCard.tsx', 'w') as f:
        f.write(content)

update_add_account()
update_edit_account()
update_account_card()
