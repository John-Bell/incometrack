import { test, expect } from '@playwright/test';
import { seedtestdb } from './utils/seedtestdb';

test.beforeEach(async ({ page }) => {
  await page.goto('/incometrack/');
  await seedtestdb(page);
  // Add a profile so we don't get redirected to /setup
  await page.evaluate(async () => {
    const db = (window as any).__DEXIE_DB__;
    await db.profile.put({ id: 'default', name: 'Test User', createdAt: Date.now() });
  });
  await page.goto('/incometrack/budgets');
  // Wait for budgets to load
  await expect(page.locator('text=All Budgets')).toBeVisible();
});

test('cannot delete budget with attached transactions', async ({ page }) => {
  // Add a transaction for 'Council Tax' (budg_1)
  await page.evaluate(async () => {
    const db = (window as any).__DEXIE_DB__;
    await db.transactions.add({
      id: 'tx_1',
      date: Date.now(),
      payee: 'City Council',
      amount: 200,
      type: 'expense',
      icon: 'shopping_cart',
      budgetId: 'budg_1',
      accountId: 'acc_1'
    });
  });

  // Navigate to edit budget page for 'Council Tax'
  await page.goto('/incometrack/budgets/edit/budg_1');
  await expect(page).toHaveURL(/\/budgets\/edit\/budg_1/);

  // Catch alert
  page.on('dialog', async dialog => {
    expect(dialog.message()).toBe('Cannot delete budget item as it has associated payments.');
    await dialog.dismiss();
  });

  // Click delete button
  await page.getByRole('button', { name: /Delete Budget Item/i }).click();

  // Verify we are still on the same page
  await expect(page).toHaveURL(/\/budgets\/edit\/budg_1/);
});

test('can delete budget without attached transactions', async ({ page }) => {
  // Navigate to edit budget page for 'Food Shopping' (budg_2)
  await page.goto('/incometrack/budgets/edit/budg_2');
  await expect(page).toHaveURL(/\/budgets\/edit\/budg_2/);

  // Click delete button
  await page.getByRole('button', { name: /Delete Budget Item/i }).click();

  // Verify we are redirected back to budgets page
  await expect(page).toHaveURL(/\/budgets/);

  // Verify budget is gone
  await expect(page.locator('text=Food Shopping')).not.toBeVisible();
});
