import { test, expect } from '@playwright/test';

test.describe('Account Sorting', () => {
    test.beforeEach(async ({ page }) => {
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
                    id: 'acc_b',
                    name: 'Bank B',
                    balance: 1000,
                    interestRate: 5.0,
                    ownerId: 'joint',
                    category: 'Savings',
                    updatedAt: Date.now()
                },
                {
                    id: 'acc_a',
                    name: 'Bank A',
                    balance: 500,
                    interestRate: 1.0,
                    ownerId: 'joint',
                    category: 'Savings',
                    updatedAt: Date.now()
                },
                {
                    id: 'acc_c',
                    name: 'Bank C',
                    balance: 2000,
                    interestRate: 3.0,
                    ownerId: 'joint',
                    category: 'Savings',
                    updatedAt: Date.now()
                }
            ]);
        });

        await page.goto('/incometrack/accounts');
        await page.waitForLoadState('networkidle');
    });

    test('should sort accounts by name by default', async ({ page }) => {
        // Default sort should be by name: Bank A, Bank B, Bank C

        // Wait for accounts to be visible and ensure we are on the accounts page
        await expect(page.locator('h3').filter({ hasText: 'Bank A' })).toBeVisible({ timeout: 15000 });

        // Filter h3 to only include our bank names to avoid other h3s like "Projected Tax Year Interest"
        const names = await page.locator('h3').allTextContents();
        const bankNames = names.filter(n => n.startsWith('Bank '));
        expect(bankNames).toEqual(['Bank A', 'Bank B', 'Bank C']);
    });

    test('should allow switching to sort by rate', async ({ page }) => {
        await expect(page.locator('h3').filter({ hasText: 'Bank A' })).toBeVisible({ timeout: 15000 });

        const sortButton = page.getByRole('button', { name: /Sort by/i });
        await sortButton.click();

        // After clicking, it should sort by rate (ascending): Bank A (1.0%), Bank C (3.0%), Bank B (5.0%)

        // We expect the order to change. Let's wait for the expected order.
        await expect(async () => {
            const names = await page.locator('h3').allTextContents();
            const bankNames = names.filter(n => n.startsWith('Bank '));
            expect(bankNames).toEqual(['Bank A', 'Bank C', 'Bank B']);
        }).toPass();
    });
});
