import { Page } from '@playwright/test';

export async function seedDatabase(page: Page) {
    // page.evaluate runs THIS code inside the browser context, where IndexedDB exists
    await page.evaluate(async () => {
        const db = (window as any).__DEXIE_DB__;
        if (!db) throw new Error("Dexie DB not exposed to window");

        // Clear out any old test data
        await db.accounts.clear();
        await db.budgets.clear();

        const now = Date.now();

        // 1. Inject the 3 core Accounts
        await db.accounts.bulkAdd([
            { id: 'acc_1', ownerId: 'default', name: 'Monthly Bills', balance: 0, interestRate: 0, category: 'Current Account', budgetOrder: 1, updatedAt: now },
            { id: 'acc_2', ownerId: 'default', name: 'Annual Bills', balance: 0, interestRate: 0, category: 'Current Account', budgetOrder: 2, updatedAt: now },
            { id: 'acc_3', ownerId: 'default', name: 'Groceries', balance: 0, interestRate: 0, category: 'Current Account', budgetOrder: 3, updatedAt: now }
        ]);

        // 2. Inject sample Budgets linked via accountId
        await db.budgets.bulkAdd([
            { id: 'budg_1', accountId: 'acc_1', budgetCategoryId: 'cat_1', name: 'Council Tax', amount: 200, frequency: 'monthly', updatedAt: now },
            { id: 'budg_2', accountId: 'acc_3', budgetCategoryId: 'cat_2', name: 'Food Shopping', amount: 500, frequency: 'monthly', updatedAt: now }
        ]);
    });
}
