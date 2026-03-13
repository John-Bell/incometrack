import re

file_path = "src/pages/AccountsPage.tsx"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace("accountName: acc.name,", "accountName: acc.name,\n            nickname: acc.nickname,\n            last4Digits: acc.last4Digits,")

with open(file_path, "w") as f:
    f.write(content)
