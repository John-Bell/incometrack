import asyncio
from playwright.async_api import async_playwright
import time
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        await context.tracing.start(screenshots=True, snapshots=True, sources=True)

        try:
            print("Navigating to app...")
            await page.goto("http://localhost:5173/incometrack/")

            # Wait for the app to be ready enough to have window.__DEXIE_DB__
            print("Waiting for database to be available in window...")
            await page.wait_for_function("window.__DEXIE_DB__ !== undefined", timeout=10000)

            print("Seeding database...")
            await page.evaluate("""
                async () => {
                    const db = window.__DEXIE_DB__;

                    // Clear existing data
                    await db.accounts.clear();
                    await db.interestAccruals.clear();
                    await db.profile.clear();
                    await db.taxRules.clear();
                    await db.settings.clear();

                    // Seed Profile
                    await db.profile.put({
                        id: 'default',
                        name: 'Alex & Sam',
                        partner1Name: 'Alex',
                        partner2Name: 'Sam',
                        createdAt: Date.now()
                    });

                    // Seed Settings
                    await db.settings.put({
                        id: 'default',
                        currency: 'GBP',
                        taxYear: '2024-2025',
                        icloudSync: false,
                        updatedAt: Date.now()
                    });

                    // Seed Tax Rule for 2024-2025
                    await db.taxRules.put({
                        id: '2024-2025',
                        personalAllowance: 12570,
                        basicRateLimit: 37700,
                        higherRateLimit: 125140,
                        basicRate: 0.2,
                        higherRate: 0.4,
                        additionalRate: 0.45,
                        dividendAllowance: 500,
                        dividendBasicRate: 0.0875,
                        dividendHigherRate: 0.3375,
                        dividendAdditionalRate: 0.3935,
                        personalSavingsAllowanceBasic: 1000,
                        personalSavingsAllowanceHigher: 500,
                        propertyAllowance: 1000,
                        updatedAt: Date.now()
                    });

                    // Seed Accounts
                    await db.accounts.put({
                        id: 'acc1',
                        ownerId: 'p1',
                        name: 'Taxable Savings',
                        balance: 10000,
                        interestRate: 5.0,
                        category: 'Cash',
                        updatedAt: Date.now(),
                        interestTrackingMethod: 'aer'
                    });

                    await db.accounts.put({
                        id: 'acc2',
                        ownerId: 'p1',
                        name: 'ISA Savings',
                        balance: 10000,
                        interestRate: 5.0,
                        category: 'Cash ISA',
                        updatedAt: Date.now(),
                        interestTrackingMethod: 'aer'
                    });
                }
            """)

            print("Reloading to skip setup and load data...")
            await page.goto("http://localhost:5173/incometrack/#/accounts") # Go directly to accounts with hash routing if used
            await page.wait_for_load_state("networkidle")

            # If it's still on setup, maybe hash routing isn't used or we need to wait
            if "setup" in page.url:
                print("Still on setup, trying a full reload at root...")
                await page.goto("http://localhost:5173/incometrack/")
                await page.wait_for_load_state("networkidle")

            print(f"Current URL: {page.url}")

            # Navigate to accounts if not there
            if "/accounts" not in page.url:
                print("Navigating to Accounts page via nav bar...")
                await page.get_by_role("link", name="account_balance_wallet Accounts").click()
                await page.wait_for_load_state("networkidle")

            screenshot_path = "/home/jules/verification/accounts_page_v2.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            print("Checking Taxable Savings card...")
            taxable_card = page.locator("div:has-text('Taxable Savings')").last
            await taxable_card.scroll_into_view_if_needed()

            taxable_interest_label = taxable_card.locator("text=Taxable Interest")
            if await taxable_interest_label.is_visible():
                print("SUCCESS: 'Taxable Interest' label found.")
                text_content = await taxable_card.inner_text()
                print(f"Taxable Card Text: {text_content}")
            else:
                print("FAILURE: 'Taxable Interest' label NOT found.")

            print("Checking ISA Savings card...")
            isa_card = page.locator("div:has-text('ISA Savings')").last
            isa_taxable_label = isa_card.locator("text=Taxable Interest")
            if await isa_taxable_label.is_visible():
                print("ISA card shows taxable interest label (expected to be £0.00).")
                isa_text = await isa_card.inner_text()
                print(f"ISA Card Text: {isa_text}")
            else:
                print("ISA card does NOT show taxable interest label (unexpected if it's 0).")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="/home/jules/verification/error_state_v2.png")
        finally:
            await context.tracing.stop(path="/home/jules/verification/trace_v2.zip")
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
