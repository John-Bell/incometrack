import re

file_path = "src/components/accounts/AccountCard.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Add to props
content = content.replace("accountName: string;", "accountName: string;\n    nickname?: string;\n    last4Digits?: string;")

# Add to destructuring
content = content.replace("accountName,", "accountName,\n    nickname,\n    last4Digits,")

# Update h3 to show nickname or name, and last 4 digits
display_logic = """
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {nickname || accountName}
                            {last4Digits && <span className="text-sm text-slate-500 font-normal ml-1"> (x{last4Digits})</span>}
                        </h3>
"""
content = re.sub(r'<h3 className="font-bold text-slate-900 dark:text-white text-base">\{accountName\}</h3>', display_logic.strip(), content)

with open(file_path, "w") as f:
    f.write(content)
