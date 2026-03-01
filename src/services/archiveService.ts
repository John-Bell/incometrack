import { db } from '@/lib/db';

export async function archiveCurrentMonth() {
    // 1. Determine current month details
    const now = new Date();
    // We assume the close out is for the current month being completed
    const monthString = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const year = now.getFullYear();
    const id = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 2. Load accounts
    const accounts = await db.accounts.toArray();

    // 3. Calculate Interest
    let totalInterest = 0;
    let estimatedAccruedInterest = 0;

    const startOfMonth = new Date(year, now.getMonth(), 1).getTime();
    const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const msInMonth = endOfMonth - startOfMonth;

    accounts.forEach(acc => {
        if (acc.balance && acc.interestRate) {
            // Annual interest for this account
            const annualInterest = acc.balance * (acc.interestRate / 100);

            // Monthly interest (straight line)
            const monthlyInterest = annualInterest / 12;
            totalInterest += monthlyInterest;

            // Weighted accrued interest based on updatedAt
            // Calculate how long the balance was held in the current month up to 'now'
            const heldFrom = Math.max(startOfMonth, acc.updatedAt || startOfMonth);
            const heldUntil = Math.min(now.getTime(), endOfMonth);

            const msHeldThisMonth = Math.max(0, heldUntil - heldFrom);

            const fractionOfMonthHeld = msHeldThisMonth / msInMonth;
            estimatedAccruedInterest += monthlyInterest * fractionOfMonthHeld;
        }
    });

    // 4. Construct the payload
    const dataSnapshot = {
        accounts,
    };

    // 5. Save to the db
    await db.monthlyArchives.put({
        id,
        month: monthString,
        year,
        totalInterest,
        estimatedAccruedInterest,
        closedAt: now.getTime(),
        data: dataSnapshot
    });
}
