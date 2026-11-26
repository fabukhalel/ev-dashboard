// نظام الفترات (H13): شهر | دورة الفاتورة | مخصص، مع التنقل للسابقة والتالية.
// دورة الفاتورة تبدأ في «يوم بداية الدورة» (1..28، افتراضياً 6) وتنتهي في اليوم السابق من الشهر التالي.
// الفاتورة المسجّلة بتواريخ مختلفة تغلب على دورتها المحسوبة.

import { ymd, daysInclusive } from './format.js';

export const PERIOD_KINDS = ['month', 'cycle', 'custom'];
export const CUSTOM_PRESETS = ['last7', 'last30', 'all'];
export const DEFAULT_CYCLE_DAY = 6;

const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s, n) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
const clampDay = (n) => (Number.isInteger(n) && n >= 1 && n <= 28 ? n : DEFAULT_CYCLE_DAY);

/** الشهر الميلادي الذي يحوي التاريخ */
export function monthOf(date) {
  const d = parse(date);
  return { kind: 'month', start: ymd(new Date(d.getFullYear(), d.getMonth(), 1)), end: ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
}

/** الدورة المحسوبة (بلا فواتير) التي تحوي التاريخ */
export function plainCycleOf(date, startDay = DEFAULT_CYCLE_DAY) {
  const s = clampDay(startDay);
  const d = parse(date);
  const y = d.getFullYear();
  let m = d.getMonth();
  if (d.getDate() < s) m -= 1;
  const start = new Date(y, m, s);
  const end = new Date(y, m + 1, s - 1);
  return { kind: 'cycle', start: ymd(start), end: ymd(end) };
}

/**
 * الدورة التي تحوي التاريخ مع احترام الفواتير المسجّلة:
 * - إن كان التاريخ داخل فاتورة: الدورة = فترة الفاتورة.
 * - وإلا الدورة المحسوبة مقصوصة حتى لا تتداخل مع فاتورة قبلها أو بعدها.
 */
export function cycleOf(date, startDay = DEFAULT_CYCLE_DAY, bills = []) {
  const sorted = [...bills].filter((b) => b && b.start && b.end).sort((a, b) => a.start.localeCompare(b.start));
  const hit = sorted.find((b) => date >= b.start && date <= b.end);
  if (hit) return { kind: 'cycle', start: hit.start, end: hit.end, billId: hit.id };
  const c = plainCycleOf(date, startDay);
  for (const b of sorted) {
    if (b.end < date && b.end >= c.start) c.start = addDays(b.end, 1);
    if (b.start > date && b.start <= c.end) c.end = addDays(b.start, -1);
  }
  return c;
}

export const periodDays = (p) => (p.start && p.end ? daysInclusive(p.start, p.end) : null);

/** الفترة المجاورة: dir = -1 السابقة، +1 التالية */
export function shiftPeriod(p, dir, ctx) {
  if (!p.start || !p.end) return p;
  if (p.kind === 'month') return monthOf(dir < 0 ? addDays(p.start, -1) : addDays(p.end, 1));
  if (p.kind === 'cycle') return cycleOf(dir < 0 ? addDays(p.start, -1) : addDays(p.end, 1), ctx.startDay, ctx.bills);
  const len = periodDays(p);
  return { ...p, start: addDays(p.start, dir * len), end: addDays(p.end, dir * len), preset: '' };
}

const isIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/**
 * الفترة المعروضة من الإعدادات + إزاحة (0 = الحالية).
 * ctx: {today, bills, firstDate} — firstDate أول تاريخ في السجل لاختصار «كل السجل»
 */
export function resolvePeriod(settings, offset = 0, ctx = {}) {
  const today = ctx.today;
  const startDay = clampDay(settings.cycleStartDay);
  const bills = ctx.bills || [];
  let p;
  const kind = PERIOD_KINDS.includes(settings.periodMode) ? settings.periodMode : 'month';
  if (kind === 'cycle') p = cycleOf(today, startDay, bills);
  else if (kind === 'custom') {
    const preset = settings.periodPreset;
    if (preset === 'last7') p = { kind, preset, start: addDays(today, -6), end: today };
    else if (preset === 'last30') p = { kind, preset, start: addDays(today, -29), end: today };
    else if (preset === 'all') return { kind, preset, start: null, end: null, all: true };
    else if (isIso(settings.periodStart) && isIso(settings.periodEnd) && settings.periodStart <= settings.periodEnd) {
      p = { kind, preset: '', start: settings.periodStart, end: settings.periodEnd };
    } else p = { kind, preset: 'last30', start: addDays(today, -29), end: today };
  } else p = monthOf(today);
  const step = offset < 0 ? -1 : 1;
  for (let i = 0; i < Math.abs(offset); i++) p = shiftPeriod(p, step, { startDay, bills });
  return p;
}

export const inPeriod = (date, p) => (!p.start || date >= p.start) && (!p.end || date <= p.end);

/** «اليوم N من M» إن كانت الفترة تحوي اليوم، وإلا null */
export function dayOf(p, today) {
  if (!p.start || !p.end || today < p.start || today > p.end) return null;
  return { n: daysInclusive(p.start, today), m: daysInclusive(p.start, p.end) };
}

/** كل الدورات (تصاعدياً) من الدورة التي تحوي from حتى التي تحوي to */
export function cyclesBetween(from, to, startDay, bills = []) {
  const out = [];
  if (!from || !to || from > to) return out;
  let c = cycleOf(from, startDay, bills);
  for (let guard = 0; guard < 600 && c.start <= to; guard++) {
    out.push(c);
    c = cycleOf(addDays(c.end, 1), startDay, bills);
  }
  return out;
}

/** كل الأشهر (تصاعدياً) من شهر from حتى شهر to */
export function monthsBetween(from, to) {
  const out = [];
  if (!from || !to || from > to) return out;
  let c = monthOf(from);
  for (let guard = 0; guard < 600 && c.start <= to; guard++) {
    out.push(c);
    c = monthOf(addDays(c.end, 1));
  }
  return out;
}

/** ترحيل إعداد الفترة القديم (month|prev|custom|all|bill) إلى النظام الجديد */
export function migratePeriodMode(old) {
  if (old === 'bill') return { periodMode: 'cycle' };
  if (old === 'all') return { periodMode: 'custom', periodPreset: 'all' };
  if (old === 'custom') return { periodMode: 'custom', periodPreset: '' };
  return { periodMode: old === 'cycle' ? 'cycle' : 'month' };
}
