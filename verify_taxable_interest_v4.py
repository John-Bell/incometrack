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

            print("Waiting for database...")
            await page.wait_for_function("window.__DEXIE_DB__ !== undefined", timeout=10000)

            print("Seeding database...")
            await page.evaluate("""
                async () => {
                    const db = window.__DEXIE_DB__;

                    await db.accounts.clear();
                    await db.interestAccruals.clear();
                    await db.profile.clear();
                    await db.taxRules.clear();
                    await db.settings.clear();

                    await db.profile.put({
                        id: 'default',
                        name: 'Alex & Sam',
                        partner1Name: 'Alex',
                        partner2Name: 'Sam',
                        createdAt: Date.now()
                    });

                    await db.settings.put({
                        id: 'default',
                        currency: 'GBP',
                        taxYear: '2024-2025',
                        icloudSync: false,
                        updatedAt: Date.now()
                    });

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

            print("Reloading...")
            await page.reload()
            await page.wait_for_load_state("networkidle")

            print("Navigating to Accounts page...")
            # Use locator for the Accounts link in BottomNavigation
            accounts_nav_link = page.locator("nav a").filter(has_text="Accounts")
            await accounts_nav_link.click()
            await page.wait_for_load_state("networkidle")

            # Wait for the account cards to appear
            print("Waiting for account cards...")
            await page.wait_for_selector("text=Taxable Savings", timeout=10000)

            screenshot_path = "/home/jules/verification/accounts_page_v4.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            print("Checking cards...")
            taxable_card = page.locator("div:has-text('Taxable Savings')").last
            taxable_interest_label = taxable_card.locator("text=Taxable Interest")

            if await taxable_interest_label.is_visible():
                print("SUCCESS: 'Taxable Interest' label found on Taxable Savings card.")
                text = await taxable_card.inner_text()
                print(f"Taxable Card Content: {text}")
            else:
                print("FAILURE: 'Taxable Interest' label NOT found on Taxable Savings card.")

            isa_card = page.locator("div:has-text('ISA Savings')").last
            isa_taxable_label = isa_card.locator("text=Taxable Interest")
            if await isa_taxable_label.is_visible():
                print("ISA card shows taxable interest label.")
                text = await isa_card.inner_text()
                print(f"ISA Card Content: {text}")
                # It should show £0.00
                if "£0.00" in text:
                    print("ISA correctly shows £0.00 taxable interest.")
            else:
                print("ISA card does NOT show taxable interest label.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="/home/jules/verification/error_state_v4.png")
        finally:
            await context.tracing.stop(path="/home/jules/verification/trace_v4.zip")
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
