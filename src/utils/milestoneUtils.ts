import type { Milestone } from '@/lib/db';

/**
 * Formats a milestone amount into whole-pound GBP currency with a '+' prefix for non-negative values.
 */
export function formatMilestoneAmount(amount: number): string {
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return amount >= 0 ? `+${formatted}` : formatted;
}

/**
 * Formats a milestone timestamp as a readable UK date (e.g., "15 November 2026").
 */
export function formatMilestoneDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats a timestamp into 'YYYY-MM-DD' for date inputs.
 */
export function formatMilestoneDateInput(timestamp?: number): string {
  const dateObj = timestamp !== undefined ? new Date(timestamp) : new Date();
  return dateObj.toISOString().split('T')[0];
}

/**
 * Sorts milestones ascending by date.
 */
export function sortMilestonesByDate(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort((a, b) => a.date - b.date);
}
