import { describe, it, expect } from 'vitest';
import { periodStats, monthPeriods, billPeriods, billResult } from '../src/lib/analysis.js';
import { collectReadings } from '../src/lib/odo.js';
import { defaultTariff } from '../src/lib/tariff.js';

const charges = [
  { id: '1', date: '2026-10-06', energyKwh: 30, totalCost: 1.5, type: 'home', odometer: 1000 },
  { id: '2', date: '2026-10-20', energyKwh: 20, totalCost: 5, type: 'fast', odometer: 1300 },
  { id: '3', date: '2026-11-03', energyKwh: 40, totalCost: 2, type: 'home', odometer: 1600 },
];

describe('analysis', () => {
  it('periodStats for a month', () => {
    const s = periodStats(charges, collectReadings(charges), { start: '2026-10-01', end: '2026-10-31' });
    expect(s.count).toBe(2);
    expect(s.energy).toBe(50);
    expect(s.homeEnergy).toBe(30);
    expect(s.fastCost).toBe(5);
    // من 06/10 (أول قراءة) إلى 31/10 مقدّرة بين 20/10 و03/11: 1300 + 300 × 11/14
    expect(s.distance).toBeCloseTo(300 + 300 * (11 / 14), 9);
    expect(s.window).toEqual({ from: '2026-10-06', to: '2026-10-31' });
    expect(s.estimated).toBe(true);
  });

  it('monthPeriods / billPeriods', () => {
    expect(monthPeriods(charges).map((p) => p.key)).toEqual(['2026-10', '2026-11']);
    const bills = [{ id: 'b2', start: '2026-11-06', end: '2026-12-05' }, { id: 'b1', start: '2026-10-06', end: '2026-11-05' }];
    expect(billPeriods(bills).map((p) => p.key)).toEqual(['b1', 'b2']);
  });

  it('billResult counts only home charges in the cycle, with charger loss', () => {
    const r = billResult({ id: 'b1', start: '2026-10-06', end: '2026-11-05', kwh: 750, amount: 80 }, charges, defaultTariff(), 10);
    expect(r.homeN).toBe(2);
    expect(r.homeKwh).toBe(70);
    expect(r.evKwh).toBeCloseTo(77, 9);
    expect(r.days).toBe(31);
    expect(r.months).toBe(1);
    expect(r.diff).toBeCloseTo(80 - 75, 9);
    expect(r.approx).toBe(false);
  });
});
