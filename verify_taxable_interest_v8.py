import asyncio
from playwright.async_api import async_playwright
import time
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Go to root
        print("Navigating to app...")
        await page.goto('http://localhost:5173/incometrack/')
        await page.wait_for_timeout(2000)

        # Handle setup if redirected
        if '/setup' in page.url:
            print("Redirected to setup. Filling form...")
            await page.get_by_placeholder('e.g. Alex').fill('Alex')
            await page.get_by_placeholder('e.g. Sam').fill('Sam')
            await page.get_by_text('arrow_forward').click()
            await page.wait_for_timeout(2000)

        # Seed Database
        print("Seeding database via JS...")
        await page.evaluate("""
            async () => {
                const db = window.__DEXIE_DB__;

                // Clear existing
                await db.accounts.clear();
                await db.interestAccruals.clear();
                await db.settings.clear();
                await db.taxRules.clear();

                // Setup Tax Year 2026-2027 (matches current date Mon May 25 2026)
                const startTs = new Date(2026, 3, 6).getTime(); // April 6 2026
                const endTs = new Date(2027, 3, 5, 23, 59, 59, 999).getTime();

                await db.settings.put({ id: 'current', taxYear: '2026-2027' });

                // Seed Taxable Account
                await db.accounts.put({
                    id: 'acc1',
                    ownerId: 'person1',
                    name: 'Taxable Savings',
                    balance: 10000,
                    interestRate: 5.0,
                    category: 'Cash',
                    updatedAt: Date.now(),
                    interestTrackingMethod: 'aer'
                });

                // Seed ISA Account (Tax Free)
                await db.accounts.put({
                    id: 'acc2',
                    ownerId: 'person1',
                    name: 'ISA Savings',
                    balance: 10000,
                    interestRate: 5.0,
                    category: 'Cash ISA',
                    updatedAt: Date.now(),
                    interestTrackingMethod: 'aer'
                });

                // Seed an accrual to ensure it shows up too
                await db.interestAccruals.put({
                    id: 'accrual1',
                    accountId: 'acc1',
                    date: Date.now() - 86400000,
                    interestAccrued: 10,
                    balance: 10000
                });
            }
        """)

        # Go to Accounts
        print("Navigating to Accounts page...")
        await page.get_by_role("link", name="Accounts").click()
        await page.wait_for_timeout(2000)

        # Ensure we are on Alex tab (person1)
        # The tab shows the name 'Alex' and the taxable interest value
        print("Selecting Alex tab...")
        await page.get_by_role("button", name="Alex").click()
        await page.wait_for_timeout(1000)

        # Screenshot
        screenshot_path = 'accounts_page_v8.png'
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # Verification
        content = await page.content()

        # We expect "Taxable Savings" card to have "(£... taxable)"
        # And "ISA Savings" card NOT to have it.

        # Check for Taxable Interest label
        if "taxable)" in content:
            print("SUCCESS: 'taxable)' text found on page.")
        else:
            print("FAILURE: 'taxable)' text NOT found on page.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
