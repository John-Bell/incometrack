import { test, expect } from '@playwright/test';
import { seedDatabase } from './utils/seedDb';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await seedDatabase(page);
});

test('example test with seeded database', async ({ page }) => {
  // This is a placeholder test to show how to use the seeder.
  // The database should have 'Monthly Bills', 'Annual Bills', and 'Groceries' accounts.
  await expect(page).toHaveURL(/.*setup|.*dashboard/);
});
