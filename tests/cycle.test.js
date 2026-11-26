import { describe, it, expect } from 'vitest';
import {
  monthOf, plainCycleOf, cycleOf, shiftPeriod, resolvePeriod, dayOf, cyclesBetween, monthsBetween, migratePeriodMode, addDays,
} from '../src/lib/cycle.js';

describe('cycle', () => {
  it('plain cycle from the 6th', () => {
    expect(plainCycleOf('2026-11-23', 6)).toEqual({ kind: 'cycle', start: '2026-11-06', end: '2026-12-05' });
    expect(plainCycleOf('2026-11-05', 6)).toEqual({ kind: 'cycle', start: '2026-10-06', end: '2026-11-05' });
    expect(plainCycleOf('2026-01-03', 6)).toEqual({ kind: 'cycle', start: '2025-12-06', end: '2026-01-05' });
    expect(plainCycleOf('2026-03-01', 1)).toEqual({ kind: 'cycle', start: '2026-03-01', end: '2026-03-31' });
    // يوم غير صالح يعود إلى 6
    expect(plainCycleOf('2026-11-23', 40).start).toBe('2026-11-06');
  });

  it('a recorded bill wins over its computed cycle, neighbours are clipped', () => {
    const bills = [{ id: 'b', start: '2026-10-09', end: '2026-11-08' }];
    expect(cycleOf('2026-11-01', 6, bills)).toEqual({ kind: 'cycle', start: '2026-10-09', end: '2026-11-08', billId: 'b' });
    expect(cycleOf('2026-11-20', 6, bills)).toEqual({ kind: 'cycle', start: '2026-11-09', end: '2026-12-05' });
    expect(cycleOf('2026-10-07', 6, bills)).toEqual({ kind: 'cycle', start: '2026-10-06', end: '2026-10-08' });
  });

  it('month and navigation', () => {
    expect(monthOf('2024-02-10')).toEqual({ kind: 'month', start: '2024-02-01', end: '2024-02-29' });
    const ctx = { startDay: 6, bills: [] };
    expect(shiftPeriod(monthOf('2026-01-10'), -1, ctx)).toMatchObject({ start: '2025-12-01', end: '2025-12-31' });
    expect(shiftPeriod(plainCycleOf('2026-11-23', 6), 1, ctx)).toMatchObject({ start: '2026-12-06', end: '2027-01-05' });
    expect(shiftPeriod({ kind: 'custom', start: '2026-11-01', end: '2026-11-07' }, -1, ctx)).toMatchObject({ start: '2026-10-25', end: '2026-10-31' });
    expect(shiftPeriod({ kind: 'custom', start: null, end: null, all: true }, -1, ctx).all).toBe(true);
  });

  it('resolvePeriod from settings + offset', () => {
    const today = '2026-11-23';
    expect(resolvePeriod({ periodMode: 'month' }, 0, { today })).toMatchObject({ kind: 'month', start: '2026-11-01' });
    expect(resolvePeriod({ periodMode: 'cycle', cycleStartDay: 6 }, -1, { today })).toMatchObject({ start: '2026-10-06', end: '2026-11-05' });
    expect(resolvePeriod({ periodMode: 'custom', periodPreset: 'last7' }, 0, { today })).toMatchObject({ start: '2026-11-17', end: today });
    expect(resolvePeriod({ periodMode: 'custom', periodPreset: 'last30' }, 0, { today }).start).toBe('2026-10-25');
    expect(resolvePeriod({ periodMode: 'custom', periodPreset: 'all' }, 0, { today })).toMatchObject({ all: true, start: null });
    expect(resolvePeriod({ periodMode: 'custom', periodStart: '2026-05-01', periodEnd: '2026-05-10' }, 0, { today })).toMatchObject({ start: '2026-05-01', end: '2026-05-10' });
    // مخصص غير صالح → آخر 30 يوماً
    expect(resolvePeriod({ periodMode: 'custom', periodStart: '2026-05-10', periodEnd: '2026-05-01' }, 0, { today }).preset).toBe('last30');
    expect(resolvePeriod({ periodMode: 'weird' }, 0, { today }).kind).toBe('month');
  });

  it('day N of M', () => {
    const p = plainCycleOf('2026-11-26', 6);
    expect(dayOf(p, '2026-11-26')).toEqual({ n: 21, m: 30 });
    expect(dayOf(p, '2026-12-06')).toBeNull();
    expect(dayOf({ start: null, end: null }, '2026-11-26')).toBeNull();
  });

  it('lists cycles and months between two dates', () => {
    expect(cyclesBetween('2026-09-10', '2026-11-20', 6).map((c) => c.start)).toEqual(['2026-09-06', '2026-10-06', '2026-11-06']);
    expect(monthsBetween('2026-11-30', '2027-01-01').map((c) => c.start)).toEqual(['2026-11-01', '2026-12-01', '2027-01-01']);
    expect(cyclesBetween('2026-11-20', '2026-09-01', 6)).toEqual([]);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('migrates the old period modes', () => {
    expect(migratePeriodMode('bill')).toEqual({ periodMode: 'cycle' });
    expect(migratePeriodMode('all')).toEqual({ periodMode: 'custom', periodPreset: 'all' });
    expect(migratePeriodMode('custom')).toEqual({ periodMode: 'custom', periodPreset: '' });
    expect(migratePeriodMode('prev')).toEqual({ periodMode: 'month' });
  });
});
