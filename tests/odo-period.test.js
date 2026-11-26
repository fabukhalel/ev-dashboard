import { describe, it, expect } from 'vitest';
import { collectReadings, odoAt, periodDistance } from '../src/lib/odo.js';
import { resolvePeriod, monthRange, inPeriod, latestBill } from '../src/lib/period.js';

describe('odo', () => {
  const readings = collectReadings(
    [{ id: 'c1', date: '2026-01-01', odometer: 1000 }, { id: 'c2', date: '2026-01-11', odometer: 1500 }, { id: 'c3', date: '2026-01-05', odometer: null }],
    [{ id: 'o1', date: '2026-01-21', km: 2000 }],
  );

  it('collects and sorts readings from charges and manual entries', () => {
    expect(readings.map((r) => r.km)).toEqual([1000, 1500, 2000]);
    expect(readings[2].src).toBe('manual');
  });

  it('odoAt: exact, interpolated, out of range', () => {
    expect(odoAt(readings, '2026-01-11')).toEqual({ km: 1500, exact: true });
    expect(odoAt(readings, '2026-01-06')).toEqual({ km: 1250, exact: false });
    expect(odoAt(readings, '2025-12-31')).toBeNull();
    expect(odoAt([], '2026-01-01')).toBeNull();
  });

  it('periodDistance clips to the reading range', () => {
    expect(periodDistance(readings, '2026-01-01', '2026-01-21')).toEqual({ distance: 1000, from: '2026-01-01', to: '2026-01-21', estimated: false });
    const p = periodDistance(readings, '2026-01-06', '2026-01-31');
    expect(p.distance).toBe(750);
    expect(p.to).toBe('2026-01-21');
    expect(p.estimated).toBe(true);
    expect(periodDistance(readings.slice(0, 1), null, null)).toBeNull();
  });
});

describe('period', () => {
  it('monthRange handles December / January', () => {
    expect(monthRange(2026, 11)).toEqual({ start: '2026-12-01', end: '2026-12-31' });
    expect(monthRange(2027, -1)).toEqual({ start: '2026-12-01', end: '2026-12-31' });
    expect(monthRange(2024, 1)).toEqual({ start: '2024-02-01', end: '2024-02-29' });
  });

  it('resolvePeriod modes', () => {
    expect(resolvePeriod({ periodMode: 'month' }, '2027-01-15')).toEqual({ mode: 'month', start: '2027-01-01', end: '2027-01-31' });
    expect(resolvePeriod({ periodMode: 'prev' }, '2027-01-15')).toEqual({ mode: 'prev', start: '2026-12-01', end: '2026-12-31' });
    expect(resolvePeriod({ periodMode: 'all' }, '2027-01-15')).toEqual({ mode: 'all', start: null, end: null });
    expect(resolvePeriod({ periodMode: 'custom', periodStart: '2026-05-01', periodEnd: '2026-05-10' }, '2027-01-15')).toEqual({ mode: 'custom', start: '2026-05-01', end: '2026-05-10' });
    // مخصص غير صالح يعود للشهر الحالي
    expect(resolvePeriod({ periodMode: 'custom', periodStart: '2026-02-30', periodEnd: '2026-03-01' }, '2027-01-15').mode).toBe('month');
    expect(resolvePeriod({ periodMode: 'nonsense' }, '2027-01-15').mode).toBe('month');
  });

  it('bill mode uses the chosen or latest bill', () => {
    const bills = [{ id: 'a', start: '2026-09-06', end: '2026-10-05' }, { id: 'b', start: '2026-10-06', end: '2026-11-05' }];
    expect(latestBill(bills).id).toBe('b');
    expect(latestBill([])).toBeNull();
    expect(resolvePeriod({ periodMode: 'bill', periodBillId: 'a' }, '2026-11-20', bills)).toMatchObject({ start: '2026-09-06', billId: 'a' });
    expect(resolvePeriod({ periodMode: 'bill', periodBillId: 'zz' }, '2026-11-20', bills).billId).toBe('b');
    expect(resolvePeriod({ periodMode: 'bill' }, '2026-11-20', []).mode).toBe('month');
  });

  it('inPeriod', () => {
    expect(inPeriod('2026-01-05', { start: '2026-01-01', end: '2026-01-31' })).toBe(true);
    expect(inPeriod('2026-02-01', { start: '2026-01-01', end: '2026-01-31' })).toBe(false);
    expect(inPeriod('2020-01-01', { start: null, end: null })).toBe(true);
  });
});
