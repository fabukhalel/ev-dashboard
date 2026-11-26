import { describe, it, expect } from 'vitest';
import { autoTier, retier, tierOn, adoptOld, countOld, tierLevel } from '../src/lib/tiers.js';
import { defaultSettings } from '../src/lib/storage.js';

const S = defaultSettings(); // دورة من 6، أول 10 أيام منخفضة، آخر 7 عالية، مدعوم 0.05/0.10/0.20
const cyc = { start: '2026-11-06', end: '2026-12-05' };
const home = (id, date, extra = {}) => ({ id, date, time: '00:00', type: 'home', energyKwh: 10, pricePerKwh: 0, totalCost: 0, tierSource: 'auto', tier: null, createdAt: 1, ...extra });

describe('tiers (T1): by day in the cycle', () => {
  it('first 10 days low, last 7 high, middle mid (example 6/11–5/12)', () => {
    expect(autoTier('2026-11-06', cyc)).toBe(0);
    expect(autoTier('2026-11-15', cyc)).toBe(0);
    expect(autoTier('2026-11-16', cyc)).toBe(1);
    expect(autoTier('2026-11-28', cyc)).toBe(1);
    expect(autoTier('2026-11-29', cyc)).toBe(2);
    expect(autoTier('2026-12-05', cyc)).toBe(2);
  });
  it('two-tier plan: middle maps to the top', () => {
    expect(autoTier('2026-11-20', cyc, { low: 10, high: 7 }, 2)).toBe(1);
    expect(autoTier('2026-11-07', cyc, { low: 10, high: 7 }, 2)).toBe(0);
  });
  it('tier names', () => {
    expect([tierLevel(0, 3), tierLevel(1, 3), tierLevel(2, 3), tierLevel(1, 2)]).toEqual(['low', 'mid', 'high', 'high']);
  });
});

describe('retier: price and cost follow the tier', () => {
  it('sets tier, rate and cost for tiered home charges only', () => {
    const fast = { id: 'f', date: '2026-11-20', type: 'fast', energyKwh: 10, pricePerKwh: 0.25, totalCost: 2.5 };
    const old = { id: 'o', date: '2026-11-20', type: 'home', energyKwh: 10, pricePerKwh: 0.1, totalCost: 1, tierSource: null };
    const out = retier([home('a', '2026-11-08'), home('b', '2026-11-20'), home('c', '2026-12-01'), fast, old], S);
    const by = Object.fromEntries(out.map((c) => [c.id, c]));
    expect([by.a.tier, by.b.tier, by.c.tier]).toEqual([0, 1, 2]);
    expect([by.a.totalCost, by.b.totalCost, by.c.totalCost]).toEqual([0.5, 1, 2]);
    expect(by.f).toBe(fast);
    expect(by.o).toBe(old); // T6: القديمة تحتفظ بتكلفتها
  });

  it('returns the same array when nothing changes', () => {
    const once = retier([home('a', '2026-11-08')], S);
    expect(retier(once, S)).toBe(once);
  });
});

describe('T7: the tier never drops inside a cycle', () => {
  it('a manual higher tier lifts later auto charges in the same cycle', () => {
    const list = [home('a', '2026-11-07', { tierSource: 'manual', tier: 1 }), home('b', '2026-11-09'), home('c', '2026-11-20')];
    const by = Object.fromEntries(retier(list, S).map((c) => [c.id, c]));
    expect(by.a.tier).toBe(1);
    expect(by.b.tier).toBe(1); // تلقائياً 0 لكنها لا تنزل عن اليدوية الأقدم
    expect(by.b.totalCost).toBe(1);
    expect(by.c.tier).toBe(1);
  });

  it('editing an older charge to a higher tier raises the auto charges after it', () => {
    let list = retier([home('a', '2026-11-07'), home('b', '2026-11-10'), home('c', '2026-11-30')], S);
    expect(list.map((c) => c.tier)).toEqual([0, 0, 2]);
    list = retier(list.map((c) => (c.id === 'a' ? { ...c, tierSource: 'manual', tier: 2 } : c)), S);
    expect(list.map((c) => c.tier)).toEqual([2, 2, 2]);
  });

  it('a manual tier does not lift charges before it or in the next cycle', () => {
    const list = [home('a', '2026-11-07'), home('m', '2026-11-12', { tierSource: 'manual', tier: 2 }), home('n', '2026-12-07')];
    const by = Object.fromEntries(retier(list, S).map((c) => [c.id, c]));
    expect(by.a.tier).toBe(0);
    expect(by.n.tier).toBe(0); // دورة جديدة تبدأ من الأولى
  });

  it('a manual lower tier is kept as chosen but does not lower the floor', () => {
    const list = [home('m1', '2026-11-07', { tierSource: 'manual', tier: 2 }), home('m2', '2026-11-08', { tierSource: 'manual', tier: 0 }), home('x', '2026-11-09')];
    const by = Object.fromEntries(retier(list, S).map((c) => [c.id, c]));
    expect(by.m2.tier).toBe(0);
    expect(by.x.tier).toBe(2);
  });

  it('tierOn (today line / new charge) follows the same rule', () => {
    const list = [home('m', '2026-11-08', { tierSource: 'manual', tier: 1 })];
    expect(tierOn('2026-11-07', list, S)).toBe(0); // قبل اليدوية
    expect(tierOn('2026-11-09', list, S)).toBe(1);
    expect(tierOn('2026-11-30', list, S)).toBe(2);
    expect(tierOn('2026-11-09', list, S, [], 'm')).toBe(0); // عند تعديل نفس الشحنة لا تحسب نفسها
  });
});

describe('effective date and old charges', () => {
  it('charges before the tariff effective date keep their cost', () => {
    const s = { ...S, tariff: { ...S.tariff, effectiveFrom: '2026-11-15' } };
    const a = home('a', '2026-11-10', { tier: 0, pricePerKwh: 0.07, totalCost: 0.7 });
    const out = retier([a, home('b', '2026-11-20')], s);
    expect(out[0]).toBe(a);
    expect(out[1].tier).toBe(1);
  });

  it('adoptOld converts old home charges on request', () => {
    const old = [{ id: 'o', date: '2026-11-30', type: 'home', energyKwh: 10, pricePerKwh: 0.1, totalCost: 1, tierSource: null }];
    expect(countOld(old)).toBe(1);
    const out = adoptOld(old, S);
    expect(out[0]).toMatchObject({ tierSource: 'auto', tier: 2, totalCost: 2 });
    expect(countOld(out)).toBe(0);
  });
});
