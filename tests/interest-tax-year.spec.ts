import { test, expect } from '@playwright/test';

test.describe('Interest Tax Year Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/incometrack/');
    await page.waitForFunction(() => (window as any).__DEXIE_DB__ !== undefined);

    await page.evaluate(async () => {
      const db = (window as any).__DEXIE_DB__;
      await db.profile.put({
        id: 'default',
        name: 'Test User',
        partner1Name: 'P1',
        partner2Name: 'P2',
        createdAt: Date.now()
      });

      await db.settings.put({
        id: 'default',
        currency: 'GBP',
        taxYear: '2024-2025',
        icloudSync: false,
        updatedAt: Date.now()
      });
    });
    await page.reload();
  });

  test('should show correct AER interest for monthly account maturing in future year', async ({ page }) => {
    await page.evaluate(async () => {
      const db = (window as any).__DEXIE_DB__;

      // Account maturing in Jan 2026 (outside 2024-2025 which ends April 2025)
      await db.accounts.put({
        id: 'acc-aer-future',
        ownerId: 'person1',
        name: 'Future Maturity',
        balance: 10000,
        interestRate: 5.0,
        interestTrackingMethod: 'aer',
        interestPayoutFrequency: 'monthly',
        interestPayoutDate: new Date(2026, 0, 1).getTime(), // Jan 2026
        category: 'Easy Access Savings',
        updatedAt: Date.now()
      });
    });

    await page.goto('/incometrack/accounts');
    await page.click('button:has-text("P1")'); // Select P1 tab

    // 2024-2025 should show 12 months of 5% on 10000 = £500
    // Currently, it might show nothing because of the bug I suspect.
    await expect(page.getByText('+ £500.00 interest this year')).toBeVisible();
  });

  test('should update interest when tax year is changed in settings', async ({ page }) => {
     // Setup manual interest for 2024-2025 and 2025-2026
     await page.evaluate(async () => {
      const db = (window as any).__DEXIE_DB__;
      const accId = 'acc-manual';
      await db.accounts.put({
        id: accId,
        ownerId: 'person1',
        name: 'Manual Account',
        balance: 1000,
        interestRate: 0,
        interestTrackingMethod: 'manual',
        category: 'Easy Access Savings',
        updatedAt: Date.now()
      });

      // Accrual in 2024-2025 (e.g. May 2024)
      await db.interestAccruals.put({
        id: 'accrual-1',
        accountId: accId,
        date: new Date(2024, 4, 10).getTime(),
        interestAccrued: 100,
        updatedAt: Date.now()
      });

      // Accrual in 2025-2026 (e.g. May 2025)
      await db.interestAccruals.put({
        id: 'accrual-2',
        accountId: accId,
        date: new Date(2025, 4, 10).getTime(),
        interestAccrued: 200,
        updatedAt: Date.now()
      });
    });

    await page.goto('/incometrack/accounts');
    await page.click('button:has-text("P1")');
    await expect(page.getByText('+ £100.00 interest this year')).toBeVisible();

    // Change tax year to 2025-2026
    await page.goto('/incometrack/settings');
    await page.locator('select').selectOption('2025-2026');

    // Wait for DB to be updated
    await page.waitForFunction(async (expectedYear) => {
      const db = (window as any).__DEXIE_DB__;
      const settings = await db.settings.get('default');
      return settings?.taxYear === expectedYear;
    }, '2025-2026');

    await page.goto('/incometrack/accounts');
    await page.click('button:has-text("P1")');
    // If it's not reactive, it will still show £100.00
    await expect(page.getByText('+ £200.00 interest this year')).toBeVisible();
  });
});
