import { describe, it, expect } from 'vitest';
import { round, energyFromSoc, sortChrono, computeSegments, summarize, byMonth, byType, overallEfficiency, priceForType } from '../src/lib/calc.js';

const ch = (o) => ({ id: o.id, date: o.date, time: '00:00', socBefore: 20, socAfter: 80, energyKwh: 36, totalCost: 3.6, type: 'home', odometer: null, capacity: 60, createdAt: 0, ...o });

describe('calc', () => {
  it('round', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(2.345)).toBe(2.35);
    expect(round(7.4, 0)).toBe(7);
  });

  it('energyFromSoc', () => {
    expect(energyFromSoc(20, 80, 60.48)).toBeCloseTo(36.288, 6);
    expect(energyFromSoc(80, 20, 60)).toBe(0);
  });

  it('sortChrono uses date, time, then createdAt', () => {
    const list = [ch({ id: 'c', date: '2026-01-02', createdAt: 1 }), ch({ id: 'b', date: '2026-01-01', time: '10:00' }), ch({ id: 'a', date: '2026-01-01', time: '09:00' }), ch({ id: 'd', date: '2026-01-02', createdAt: 0 })];
    expect(sortChrono(list).map((x) => x.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('computeSegments: odometer to odometer with an intermediate charge', () => {
    const list = [
      ch({ id: '1', date: '2026-01-01', socBefore: 20, socAfter: 80, energyKwh: 36, totalCost: 3.6, odometer: 1000 }),
      ch({ id: '2', date: '2026-01-03', socBefore: 50, socAfter: 70, energyKwh: 12, totalCost: 3, type: 'fast' }),
      ch({ id: '3', date: '2026-01-05', socBefore: 30, socAfter: 90, energyKwh: 36, totalCost: 3.6, odometer: 1300 }),
    ];
    const segs = computeSegments(list, 60);
    expect(segs).toHaveLength(1);
    const s = segs[0];
    expect(s.endId).toBe('3');
    expect(s.distance).toBe(300);
    // (80% - 30%) × 60 + 12 من الشحنة الوسيطة = 42
    expect(s.consumed).toBeCloseTo(42, 6);
    expect(s.efficiency).toBeCloseTo(14, 6);
    // السعر = (3 + 3.6) / (12 + 36)
    expect(s.cost).toBeCloseTo(42 * (6.6 / 48), 6);
  });

  it('computeSegments skips non-positive distance', () => {
    const list = [ch({ id: '1', date: '2026-01-01', odometer: 1000 }), ch({ id: '2', date: '2026-01-02', odometer: 990 })];
    expect(computeSegments(list, 60)).toEqual([]);
  });

  it('summarize, byType, byMonth, overallEfficiency', () => {
    const list = [
      ch({ id: '1', date: '2026-01-01', energyKwh: 30, totalCost: 3, odometer: 1000 }),
      ch({ id: '2', date: '2026-02-01', energyKwh: 20, totalCost: 5, type: 'fast', socBefore: 40, odometer: 1200 }),
    ];
    const segs = computeSegments(list, 60);
    const s = summarize(list, segs);
    expect(s.count).toBe(2);
    expect(s.energy).toBe(50);
    expect(s.cost).toBe(8);
    expect(s.avgPrice).toBeCloseTo(0.16, 6);
    expect(s.distance).toBe(200);
    expect(s.efficiency).toBeCloseTo(((0.8 - 0.4) * 60 / 200) * 100, 6);
    expect(overallEfficiency(segs)).toBeCloseTo(s.efficiency, 6);
    expect(overallEfficiency([])).toBeNull();
    expect(summarize([], []).avgPrice).toBeNull();

    const t = byType(list);
    expect(t.home.count).toBe(1);
    expect(t.fast.energyShare).toBeCloseTo(40, 6);
    expect(t.total.cost).toBe(8);

    const m = byMonth(list, segs);
    expect(m.map((x) => x.key)).toEqual(['2026-01', '2026-02']);
    expect(m[1].fastEnergy).toBe(20);
    expect(m[0].efficiency).toBeNull();
    expect(m[1].distance).toBe(200);
  });

  it('priceForType: history then fallback', () => {
    const list = [ch({ id: '1', date: '2026-01-01', energyKwh: 10, totalCost: 2.5, type: 'fast' })];
    expect(priceForType(list, 'fast', 0.3)).toEqual({ value: 0.25, source: 'history', n: 1 });
    expect(priceForType(list, 'home', 0.1)).toEqual({ value: 0.1, source: 'default', n: 0 });
  });
});
