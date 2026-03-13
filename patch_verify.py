import re

file_path = "/home/jules/verification/verify_feature.py"
with open(file_path, "r") as f:
    content = f.read()

content = content.replace('page.locator("select").nth(1).select_option(label="My Checking Account")', 'page.locator("select").nth(1).select_option(label="Main Checking (x9876)")')
content = content.replace('page.locator("select").nth(2).select_option(label="My Checking Account")', 'page.locator("select").nth(2).select_option(label="Main Checking (x9876)")')

with open(file_path, "w") as f:
    f.write(content)
