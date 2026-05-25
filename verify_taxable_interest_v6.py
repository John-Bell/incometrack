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

            print("Filling setup form...")
            await page.get_by_placeholder("e.g. Alex").fill("Alex")
            await page.get_by_placeholder("e.g. Sam").fill("Sam")
            await page.get_by_role("button", name="Get Started").click()
            await page.wait_for_load_state("networkidle")

            print("Seeding database...")
            await page.evaluate("""
                async () => {
                    const db = window.__DEXIE_DB__;

                    await db.accounts.clear();
                    await db.interestAccruals.clear();
                    await db.taxRules.clear();

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

                    // OwnerId should match person tabs
                    // Usually 'p1' for partner 1, 'p2' for partner 2, 'joint' for joint
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
                }
            """)

            print("Navigating to Accounts page...")
            await page.get_by_role("link", name="account_balance_wallet Accounts").click()
            await page.wait_for_load_state("networkidle")

            # Click Alex tab
            print("Clicking Alex tab...")
            await page.get_by_role("button", name="Alex").click()
            await asyncio.sleep(1) # wait for animation/rendering

            print("Waiting for accounts to appear...")
            await page.wait_for_selector("text=Taxable Savings", timeout=10000)

            screenshot_path = "/home/jules/verification/accounts_page_v6.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            print("Checking cards...")
            taxable_card = page.locator("div.bg-white").filter(has_text="Taxable Savings").last
            taxable_interest_label = taxable_card.locator("text=Taxable Interest")

            if await taxable_interest_label.is_visible():
                print("SUCCESS: 'Taxable Interest' label found.")
                text = await taxable_card.inner_text()
                print(f"Taxable Card Content: {text}")
            else:
                print("FAILURE: 'Taxable Interest' label NOT found.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="/home/jules/verification/error_state_v6.png")
        finally:
            await context.tracing.stop(path="/home/jules/verification/trace_v6.zip")
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
