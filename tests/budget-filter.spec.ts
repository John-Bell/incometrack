import { test, expect } from '@playwright/test';

test.describe('Budget Filter Dropdown', () => {
    test.beforeEach(async ({ page }) => {
        // Seed data via window.__DEXIE_DB__ before going to the page
        await page.goto('/incometrack/');

        await page.waitForLoadState('networkidle');

        const isSetup = await page.url().includes('/setup');
        if (isSetup) {
            await page.getByPlaceholder('e.g. Alex').first().fill('Alex');
            await page.getByPlaceholder('e.g. Sam').fill('Sam');
            await page.getByRole('button', { name: /Get Started/ }).click();
            await page.waitForURL('**/incometrack/', { timeout: 15000 });
        }

        await page.evaluate(async () => {
            const db = (window as any).__DEXIE_DB__;
            if (!db) return;

            // Clear existing data
            await db.accounts.clear();
            await db.budgets.clear();
            await db.transactions.clear();

            await db.accounts.bulkAdd([
                {
                    id: 'acc1',
                    name: 'Account With Budget Order',
                    nickname: 'Main Account',
                    last4Digits: '1234',
                    budgetOrder: 1,
                    balance: 1000,
                    interestRate: 0,
                    ownerId: 'person1',
                    category: 'Current Account',
                    updatedAt: Date.now()
                },
                {
                    id: 'acc2',
                    name: 'Account Without Budget Order',
                    balance: 500,
                    interestRate: 0,
                    ownerId: 'person1',
                    category: 'Savings',
                    updatedAt: Date.now()
                },
                {
                    id: 'acc3',
                    name: 'Another Account With Budget Order',
                    budgetOrder: 2,
                    balance: 2000,
                    interestRate: 0,
                    ownerId: 'person2',
                    category: 'Current Account',
                    updatedAt: Date.now()
                }
            ]);

            await db.budgets.add({
                id: 'b1',
                name: 'Test Budget',
                amount: 100,
                frequency: 'monthly',
                accountId: 'acc1',
                updatedAt: Date.now()
            });
        });

        await page.goto('/incometrack/budgets');
        await page.waitForLoadState('networkidle');
    });

    test('should only show accounts with a budget order in the filter dropdown', async ({ page }) => {
        // Debug: Log the page content if the select is not found
        try {
            const select = page.locator('select');
            await expect(select).toBeVisible({ timeout: 15000 });

            const options = await select.locator('option').allTextContents();

            expect(options).toContain('All Accounts');
            expect(options).toContain('Another Account With Budget Order');
            expect(options).toContain('Main Account (x1234)');

            expect(options).not.toContain('Account Without Budget Order');

            expect(options.length).toBe(3);
        } catch (e) {
            console.log('Current URL:', page.url());
            throw e;
        }
    });
});
