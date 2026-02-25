from playwright.sync_api import sync_playwright

def verify_accounts_tabs():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to root...")
            page.goto("http://localhost:5174/")
            page.wait_for_load_state("networkidle")

            print(f"Current URL: {page.url}")

            if "/setup" in page.url:
                print("At setup page. Filling form...")
                page.fill("input[placeholder='e.g. Alex']", "Alice")
                page.fill("input[placeholder='e.g. Sam']", "Bob")

                print("Clicking Get Started...")
                page.click("button:has-text('Get Started')")

                # Wait for navigation
                page.wait_for_url("http://localhost:5174/", timeout=5000)
                print("Setup complete. Navigated to dashboard.")

            print(f"Current URL after setup: {page.url}")
            page.screenshot(path="verification/dashboard.png")

            # Go to Accounts page directly if link fails
            print("Navigating to Accounts page...")
            page.goto("http://localhost:5174/accounts")
            page.wait_for_load_state("networkidle")
            print(f"Current URL: {page.url}")
            page.screenshot(path="verification/accounts_page.png")

            # Verify Tabs
            print("Verifying Tabs...")

            # Check Joint (Default)
            if page.locator("text=Santander eSaver").is_visible():
                print("SUCCESS: Santander eSaver (Joint) is visible.")
            else:
                print("FAILURE: Santander eSaver (Joint) is NOT visible.")

            if not page.locator("text=Barclays Rainy Day").is_visible():
                print("SUCCESS: Barclays Rainy Day (Alice) is hidden.")
            else:
                print("FAILURE: Barclays Rainy Day (Alice) is VISIBLE.")

            # Click Alice
            print("Clicking Alice tab...")
            page.click("button:has-text('Alice')")
            page.wait_for_timeout(500) # Wait for React state update

            if page.locator("text=Barclays Rainy Day").is_visible():
                print("SUCCESS: Barclays Rainy Day (Alice) is visible.")
            else:
                print("FAILURE: Barclays Rainy Day (Alice) is NOT visible.")

            if not page.locator("text=Santander eSaver").is_visible():
                print("SUCCESS: Santander eSaver (Joint) is hidden.")
            else:
                print("FAILURE: Santander eSaver (Joint) is VISIBLE.")

            # Click Bob
            print("Clicking Bob tab...")
            page.click("button:has-text('Bob')")
            page.wait_for_timeout(500)

            if page.locator("text=Nationwide FlexDirect").is_visible():
                print("SUCCESS: Nationwide FlexDirect (Bob) is visible.")
            else:
                print("FAILURE: Nationwide FlexDirect (Bob) is NOT visible.")

            page.screenshot(path="verification/final_state.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_accounts_tabs()
