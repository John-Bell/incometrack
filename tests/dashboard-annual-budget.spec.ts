import { test, expect } from '@playwright/test';

test.describe('Dashboard Annual Budget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/incometrack/');
    // Wait for the app to load and initialize DB
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

      const accountId = 'acc-1';
      await db.accounts.put({
        id: accountId,
        ownerId: 'p1',
        name: 'Main Account',
        balance: 5000,
        interestRate: 0,
        category: 'Cash',
        updatedAt: Date.now()
      });

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Monthly Budget
      const monthlyBudgetId = 'budget-monthly';
      await db.budgets.put({
        id: monthlyBudgetId,
        accountId: accountId,
        name: 'Monthly Food',
        amount: 100,
        frequency: 'monthly',
        updatedAt: Date.now()
      });

      // Annual Budget
      const annualBudgetId = 'budget-annual';
      await db.budgets.put({
        id: annualBudgetId,
        accountId: accountId,
        name: 'Annual Car Insurance',
        amount: 1200,
        frequency: 'annual',
        updatedAt: Date.now()
      });

      // Transactions for Monthly Budget
      // 1. Current month (should show)
      await db.transactions.put({
        id: 't-m-1',
        date: new Date(currentYear, currentMonth, 15).getTime(),
        payee: 'Current Month Grocery',
        amount: 25,
        type: 'expense',
        budgetId: monthlyBudgetId,
        accountId: accountId,
        updatedAt: Date.now()
      });
      // 2. Previous month (should NOT show)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const yearForPrevMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
      await db.transactions.put({
        id: 't-m-2',
        date: new Date(yearForPrevMonth, prevMonth, 15).getTime(),
        payee: 'Prev Month Grocery',
        amount: 30,
        type: 'expense',
        budgetId: monthlyBudgetId,
        accountId: accountId,
        updatedAt: Date.now()
      });

      // Transactions for Annual Budget
      // 1. Current month (should show)
      await db.transactions.put({
        id: 't-a-1',
        date: new Date(currentYear, currentMonth, 10).getTime(),
        payee: 'Car Service',
        amount: 100,
        type: 'expense',
        budgetId: annualBudgetId,
        accountId: accountId,
        updatedAt: Date.now()
      });
      // 2. Previous month of same year (should show if frequency is annual)
      // If current month is Jan, we use Feb of same year for the test logic or just use another day in Jan if we want to be safe,
      // but the requirement says "calendar year".
      // Let's pick a month that is definitely in the same calendar year.
      let targetMonth = currentMonth > 0 ? 0 : 1; // If Jan, use Feb. Else use Jan.
      await db.transactions.put({
        id: 't-a-2',
        date: new Date(currentYear, targetMonth, 5).getTime(),
        payee: 'Car Tax',
        amount: 200,
        type: 'expense',
        budgetId: annualBudgetId,
        accountId: accountId,
        updatedAt: Date.now()
      });
      // 3. Previous year (should NOT show)
      await db.transactions.put({
        id: 't-a-3',
        date: new Date(currentYear - 1, 6, 1).getTime(),
        payee: 'Last Year Insurance',
        amount: 1000,
        type: 'expense',
        budgetId: annualBudgetId,
        accountId: accountId,
        updatedAt: Date.now()
      });
    });

    await page.reload();
  });

  test('should display annual budgets correctly on dashboard', async ({ page }) => {
    // Wait for data to be loaded
    await expect(page.getByText('Main Account').first()).toBeVisible();

    // Check Monthly Budget
    const monthlyBudgetContainer = page.locator('div').filter({ hasText: /Monthly Food/ }).first();
    await expect(monthlyBudgetContainer).toBeVisible();

    // Budgeted: 100.00
    // Spent: 25.00
    // Remaining: 75.00
    await expect(page.getByText('100.00').first()).toBeVisible();
    await expect(page.getByText('75.00').first()).toBeVisible();
    await expect(page.getByText('Current Month Grocery').first()).toBeVisible();
    await expect(page.getByText('Prev Month Grocery')).not.toBeVisible();

    // Check Annual Budget
    const annualBudgetContainer = page.locator('div').filter({ hasText: /Annual Car Insurance/ }).first();
    await expect(annualBudgetContainer).toBeVisible();

    // Budgeted: 1,200.00
    // Spent: 100 + 200 = 300
    // Remaining: 1200 - 300 = 900.00
    await expect(page.getByText('1,200.00').first()).toBeVisible();
    await expect(page.getByText('900.00').first()).toBeVisible();

    await expect(page.getByText('Car Service').first()).toBeVisible();
    await expect(page.getByText('Car Tax').first()).toBeVisible();
    await expect(page.getByText('Last Year Insurance')).not.toBeVisible();
  });
});
