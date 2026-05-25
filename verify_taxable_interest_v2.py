import asyncio
from playwright.async_api import async_playwright
import time
import os

async def run():
    async with async_playwright() as p:
        # Using a fixed viewport to ensure consistency
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Start tracing
        await context.tracing.start(screenshots=True, snapshots=True, sources=True)

        try:
            print("Navigating to app...")
            await page.goto("http://localhost:5173/incometrack/")

            # Handle setup if needed
            if await page.get_by_placeholder("e.g. Alex").is_visible():
                print("Handling setup flow...")
                await page.get_by_placeholder("e.g. Alex").fill("Alex")
                await page.get_by_placeholder("e.g. Sam").fill("Sam")
                await page.get_by_role("button", name="Get Started").click()
                await page.wait_for_load_state("networkidle")

            print("Seeding database...")
            # Seed the database via window.__DEXIE_DB__
            await page.evaluate("""
                async () => {
                    const db = window.__DEXIE_DB__;
                    if (!db) return;

                    // Clear existing data
                    await db.accounts.clear();
                    await db.interestAccruals.clear();
                    await db.profile.clear();
                    await db.taxRules.clear();

                    // Seed Profile
                    await db.profile.put({
                        id: 'default',
                        name: 'Alex & Sam',
                        partner1Name: 'Alex',
                        partner2Name: 'Sam',
                        createdAt: Date.now()
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
                    // 1. Taxable Account: 5% of 10,000 = 500 interest/year
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

                    // 2. Tax-Free Account: 5% of 10,000 = 500 interest/year (but should show 0 taxable)
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

            print("Refreshing page to load seeded data...")
            await page.reload()
            await page.wait_for_load_state("networkidle")

            print("Navigating to Accounts page...")
            # Click the Accounts link in the bottom navigation
            await page.get_by_role("link", name="account_balance_wallet Accounts").click()
            await page.wait_for_load_state("networkidle")

            # Take a screenshot of the accounts page
            screenshot_path = "/home/jules/verification/accounts_page.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            # Verify Taxable Savings card
            print("Checking Taxable Savings card...")
            taxable_card = page.locator("div:has-text('Taxable Savings')").last
            await taxable_card.scroll_into_view_if_needed()

            # The value should be roughly £500 (AER based on £10k at 5%)
            # We look for "Taxable Interest" text
            taxable_interest_label = taxable_card.locator("text=Taxable Interest")
            if await taxable_interest_label.is_visible():
                print("SUCCESS: 'Taxable Interest' label found on Taxable Savings card.")
                # Get the value next to it
                label_text = await taxable_card.inner_text()
                print(f"Card content: {label_text}")
            else:
                print("FAILURE: 'Taxable Interest' label NOT found on Taxable Savings card.")

            # Verify ISA Savings card (should NOT have Taxable Interest if it is exactly 0 and we hide it,
            # or it should show £0.00 if we don't hide 0s.
            # My implementation: {taxableInterest !== undefined && <p>...Taxable Interest: {taxableInterest}</p>}
            # Since calculateProjectedTaxableInterestForAccount returns 0 for ISA, it will show "Taxable Interest: £0.00")
            print("Checking ISA Savings card...")
            isa_card = page.locator("div:has-text('ISA Savings')").last
            isa_taxable_label = isa_card.locator("text=Taxable Interest")
            if await isa_taxable_label.is_visible():
                print("ISA card shows taxable interest label (expected since it is 0 but visible).")
                isa_text = await isa_card.inner_text()
                print(f"ISA Card content: {isa_text}")
            else:
                print("ISA card does NOT show taxable interest label.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="/home/jules/verification/error_state.png")
        finally:
            await context.tracing.stop(path="/home/jules/verification/trace.zip")
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
