// بيانات محسوبة من الحالة (لا تُحفظ): المقاطع، القراءات، فترة الصفحة الرئيسية وملخصها.
import { useMemo } from 'react';
import { useStore, useUi } from './store.jsx';
import { computeSegments, summarize, byMonth, sortChrono } from '../lib/calc.js';
import { resolvePeriod, inPeriod } from '../lib/period.js';
import { collectReadings } from '../lib/odo.js';
import { periodStats } from '../lib/analysis.js';
import { todayStr } from '../lib/format.js';

export function useSegments() {
  const { charges, settings } = useStore().state;
  return useMemo(() => computeSegments(charges, settings.capacity), [charges, settings.capacity]);
}

export function useReadings() {
  const { charges, odos } = useStore().state;
  return useMemo(() => collectReadings(charges, odos), [charges, odos]);
}

/** أشهر السجل (YYYY-MM) من الأحدث إلى الأقدم */
export function useMonthKeys() {
  const { charges } = useStore().state;
  return useMemo(() => [...new Set(charges.map((c) => c.date.slice(0, 7)))].sort().reverse(), [charges]);
}

/** فترة الاحتساب للصفحة الرئيسية (الشهر الحالي افتراضياً) وكل ما يُعرض عنها */
export function usePeriod() {
  const { settings, charges, bills } = useStore().state;
  const segments = useSegments();
  const readings = useReadings();
  const today = todayStr();
  const period = useMemo(() => resolvePeriod(settings, today, bills), [settings.periodMode, settings.periodStart, settings.periodEnd, settings.periodBillId, bills, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const periodCharges = useMemo(() => charges.filter((c) => inPeriod(c.date, period)), [charges, period]);
  const summary = useMemo(
    () => summarize(periodCharges, segments.filter((s) => inPeriod(s.date, period))),
    [periodCharges, segments, period],
  );
  const stat = useMemo(() => periodStats(charges, readings, period), [charges, readings, period]);
  const recent = useMemo(() => sortChrono(periodCharges).reverse().slice(0, 4), [periodCharges]);
  const lastMonths = useMemo(() => byMonth(charges, segments).slice(-3), [charges, segments]);
  // حدود العرض: عند "الكل" نعرض أول وآخر شحنة
  const range = useMemo(() => {
    if (period.start) return { start: period.start, end: period.end };
    const ds = charges.map((c) => c.date).sort();
    return ds.length ? { start: ds[0], end: ds[ds.length - 1] } : null;
  }, [period, charges]);
  return { period, periodCharges, summary, stat, recent, lastMonths, range };
}

/** شحنات صفحة «الشحنات» بعد فلتر الشهر والنوع */
export function useFilteredCharges() {
  const { charges } = useStore().state;
  const { month, typeFilter } = useUi();
  const segments = useSegments();
  return useMemo(() => {
    const keep = (x) => (month === 'all' || x.date.startsWith(month)) && (typeFilter === 'all' || x.type === typeFilter);
    return { charges: charges.filter(keep), segments: segments.filter(keep), allSegments: segments };
  }, [charges, segments, month, typeFilter]);
}
