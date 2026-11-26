import { describe, it, expect } from 'vitest';
import { tierCost, billImpact, monthsInPeriod, defaultTariff, TARIFF_PLANS } from '../src/lib/tariff.js';

const sub = TARIFF_PLANS.subsidized;

describe('tariff', () => {
  it('tier boundaries (subsidized)', () => {
    expect(tierCost(300, sub).cost).toBeCloseTo(15, 9);
    expect(tierCost(301, sub).cost).toBeCloseTo(15.1, 9);
    expect(tierCost(600, sub).cost).toBeCloseTo(45, 9);
    expect(tierCost(601, sub).cost).toBeCloseTo(45.2, 9);
    expect(tierCost(0, sub).cost).toBe(0);
    expect(tierCost(-5, sub).cost).toBe(0);
    expect(tierCost(100, sub).parts).toHaveLength(3);
  });

  it('unsubsidized', () => {
    expect(tierCost(1200, TARIFF_PLANS.unsubsidized).cost).toBeCloseTo(1000 * 0.12 + 200 * 0.15, 9);
  });

  it('README example: total 750, car 200 => 35.00', () => {
    const r = billImpact({ total: 750, ev: 200, tiers: sub });
    expect(r.impact).toBe(35);
    expect(r.base).toBe(550);
    expect(r.billWith).toBeCloseTo(75, 9);
    expect(r.billWithout).toBeCloseTo(40, 9);
    expect(r.effectiveRate).toBeCloseTo(0.175, 9);
    // السيارة في أعلى الشرائح: 150 بسعر 0.200 و50 بسعر 0.100
    expect(r.evParts.map((p) => Math.round(p.kwh))).toEqual([0, 50, 150]);
  });

  it('two-month bill doubles the tier limits', () => {
    const r = billImpact({ total: 1500, ev: 400, tiers: sub, scale: 2 });
    // 2 أشهر: 600 / 1200. مع السيارة 1500: 30+60+60=150. بدونها 1100: 30+50=80
    expect(r.impact).toBe(70);
  });

  it('ev larger than total is capped; extra fils added per kWh', () => {
    const r = billImpact({ total: 100, ev: 200, tiers: sub });
    expect(r.capped).toBe(true);
    expect(r.ev).toBe(100);
    const x = billImpact({ total: 750, ev: 200, tiers: sub, extraFils: 10 });
    expect(x.impact).toBe(37);
  });

  it('monthsInPeriod', () => {
    expect(monthsInPeriod(31)).toBe(1);
    expect(monthsInPeriod(10)).toBe(1);
    expect(monthsInPeriod(61)).toBe(2);
  });

  it('defaultTariff is a fresh copy', () => {
    const a = defaultTariff();
    a.tiers[0].rate = 9;
    expect(defaultTariff().tiers[0].rate).toBe(0.05);
  });
});
