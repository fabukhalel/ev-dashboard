// بيانات محسوبة من الحالة (لا تُحفظ): القراءات، الفترة المعروضة وملخصها والمقارنة بالسابقة، الدورة الحالية وشريحة اليوم.
import { useMemo } from 'react';
import { useStore, useUi } from './store.jsx';
import { byMonth, computeSegments, sortChrono } from '../lib/calc.js';
import { resolvePeriod, shiftPeriod, cycleOf, dayOf, inPeriod, addDays } from '../lib/cycle.js';
import { collectReadings } from '../lib/odo.js';
import { periodStats } from '../lib/analysis.js';
import { tierOn } from '../lib/tiers.js';
import { todayStr, daysInclusive } from '../lib/format.js';

export function useReadings() {
  const { charges, odos } = useStore().state;
  return useMemo(() => collectReadings(charges, odos), [charges, odos]);
}

export function useSegments() {
  const { charges, settings } = useStore().state;
  return useMemo(() => computeSegments(charges, settings.capacity), [charges, settings.capacity]);
}

const pct = (a, b) => (b > 0 ? ((a - b) / b) * 100 : null);

/** ترقيم الشحنات داخل فترة: 1 لأقدم شحنة (H12). يرجع Map(id → رقم) */
export function numberCharges(charges, period) {
  const map = new Map();
  sortChrono(charges.filter((c) => inPeriod(c.date, period))).forEach((c, i) => map.set(c.id, i + 1));
  return map;
}

/** الفترة المعروضة (مشتركة بين الرئيسية والشحنات والتحليل) وكل ما يُعرض عنها */
export function usePeriod() {
  const { settings, charges, bills } = useStore().state;
  const { periodOffset } = useUi();
  const readings = useReadings();
  const today = todayStr();
  const ctx = useMemo(() => ({ today, bills, startDay: settings.cycleStartDay }), [today, bills, settings.cycleStartDay]);
  const period = useMemo(
    () => resolvePeriod(settings, periodOffset, ctx),
    [settings.periodMode, settings.periodPreset, settings.periodStart, settings.periodEnd, settings.cycleStartDay, periodOffset, ctx], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return useMemo(() => {
    const list = charges.filter((c) => inPeriod(c.date, period));
    const stat = periodStats(charges, readings, period);
    const day = dayOf(period, today);
    // المقارنة بالفترة السابقة: لفترة جارية نقارن نفس عدد الأيام من بداية السابقة
    let prevStat = null;
    if (!period.all) {
      const prev = shiftPeriod(period, -1, ctx);
      const win = day ? { start: prev.start, end: addDays(prev.start, day.n - 1) } : prev;
      prevStat = periodStats(charges, [], win);
    }
    const forecast = day && day.n < day.m && stat.energy > 0 ? (stat.energy / day.n) * day.m : null;
    const sorted = sortChrono(charges);
    const last = sorted[sorted.length - 1] || null;
    const range = period.all
      ? (sorted.length ? { start: sorted[0].date, end: last.date } : null)
      : { start: period.start, end: period.end };
    return {
      period,
      range,
      list,
      sortedDesc: sortChrono(list).reverse(),
      numbers: numberCharges(charges, period),
      stat,
      day,
      forecast,
      energyDelta: prevStat && prevStat.energy > 0 && stat.energy > 0 ? pct(stat.energy, prevStat.energy) : null,
      costDelta: prevStat && prevStat.cost > 0 && stat.cost > 0 ? pct(stat.cost, prevStat.cost) : null,
      avgPerCharge: stat.count ? stat.energy / stat.count : null,
      last: last ? { daysAgo: daysInclusive(last.date, today) - 1, after: last.socAfter } : null,
      isCurrent: periodOffset === 0,
    };
  }, [charges, readings, period, today, ctx, periodOffset]);
}

/** آخر 3 أشهر (للأعمدة الرفيعة في البطاقة الرئيسية) */
export function useLastMonths(n = 3) {
  const { charges } = useStore().state;
  return useMemo(() => byMonth(charges, []).slice(-n), [charges, n]);
}

/** الدورة الحالية: «اليوم N من M» وشريحة اليوم وأثر السيارة التقديري على فاتورتها */
export function useCurrentCycle() {
  const { settings, charges, bills } = useStore().state;
  const today = todayStr();
  return useMemo(() => {
    const cyc = cycleOf(today, settings.cycleStartDay, bills);
    const day = dayOf(cyc, today);
    const tier = tierOn(today, charges, settings, bills);
    const home = charges.filter((c) => c.type === 'home' && inPeriod(c.date, cyc));
    const homeKwh = home.reduce((s, c) => s + c.energyKwh, 0);
    const homeCost = home.reduce((s, c) => s + c.totalCost, 0);
    const extra = (homeKwh * (settings.tariff.extraFils || 0)) / 1000;
    return { cycle: cyc, day, tier, nTiers: settings.tariff.tiers.length, rate: settings.tariff.tiers[tier].rate, homeKwh, impact: homeCost + extra, homeN: home.length };
  }, [settings, charges, bills, today]);
}

/** آخر نسخة احتياطية (يدوية أو تلقائية) وهل مر عليها أكثر من 30 يوماً (H8) */
export function useBackupStatus() {
  const { state, autoBackups } = useStore();
  return useMemo(() => {
    const last = Math.max(state.settings.lastBackupAt || 0, (autoBackups && autoBackups.last) || 0) || null;
    const real = !state.demo && state.charges.length > 0;
    const firstDate = real ? sortChrono(state.charges)[0].date : null;
    const since = last ? Math.floor((Date.now() - last) / 86400000) : firstDate ? daysInclusive(firstDate, todayStr()) - 1 : 0;
    return { last, stale: real && since > 30, days: since };
  }, [state.settings.lastBackupAt, state.demo, state.charges, autoBackups]);
}
