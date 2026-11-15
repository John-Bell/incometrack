import { describe, it, expect } from 'vitest';
import {
  formatMilestoneAmount,
  formatMilestoneDate,
  formatMilestoneDateInput,
  sortMilestonesByDate,
} from './milestoneUtils';
import type { Milestone } from '@/lib/db';

describe('milestoneUtils', () => {
  it('formats positive, zero, and negative milestone amounts with sign prefix', () => {
    expect(formatMilestoneAmount(50000)).toBe('+£50,000');
    expect(formatMilestoneAmount(0)).toBe('+£0');
    expect(formatMilestoneAmount(-15000)).toBe('-£15,000');
  });

  it('formats milestone display date and input date strings', () => {
    const ts = new Date('2028-06-15T00:00:00.000Z').getTime();
    expect(formatMilestoneDateInput(ts)).toBe('2028-06-15');
    expect(formatMilestoneDate(ts)).toContain('2028');
  });

  it('sorts milestones ascending by date without mutating input array', () => {
    const m1: Milestone = { id: '1', name: 'Later', date: 2000, amount: 100 };
    const m2: Milestone = { id: '2', name: 'Earlier', date: 1000, amount: 200 };
    const sorted = sortMilestonesByDate([m1, m2]);

    expect(sorted.map((m) => m.id)).toEqual(['2', '1']);
  });
});
