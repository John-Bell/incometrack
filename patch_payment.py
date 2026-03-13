import re

files_to_patch = [
    "src/pages/AddPaymentPage.tsx",
    "src/pages/EditPaymentPage.tsx"
]

for file_path in files_to_patch:
    with open(file_path, "r") as f:
        content = f.read()

    content = re.sub(
        r'<option key=\{account\.id\} value=\{account\.id\}>\{account\.name\}</option>',
        '<option key={account.id} value={account.id}>{account.nickname || account.name}{account.last4Digits ? ` (x${account.last4Digits})` : \'\'}</option>',
        content
    )
    with open(file_path, "w") as f:
        f.write(content)
