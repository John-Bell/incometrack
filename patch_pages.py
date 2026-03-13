import re
import os

files_to_patch = [
    "src/pages/AddBudgetPage.tsx",
    "src/pages/EditBudgetPage.tsx",
    "src/pages/AddPaymentPage.tsx",
    "src/pages/EditPaymentPage.tsx"
]

for file_path in files_to_patch:
    with open(file_path, "r") as f:
        content = f.read()

    # We need to render: acc.nickname || acc.name + (acc.last4Digits ? ` (x${acc.last4Digits})` : '')
    # Currently it's just {acc.name}
    content = re.sub(
        r'<option key=\{acc.id\} value=\{acc.id\}>\s*\{acc.name\}\s*</option>',
        '<option key={acc.id} value={acc.id}>{acc.nickname || acc.name}{acc.last4Digits ? ` (x${acc.last4Digits})` : \'\'}</option>',
        content
    )
    with open(file_path, "w") as f:
        f.write(content)
