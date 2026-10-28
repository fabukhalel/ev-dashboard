// فترة الاحتساب للصفحة الرئيسية: الشهر الحالي (افتراضي) أو الشهر السابق أو فترة مخصصة أو كل السجل

import { ymd, parseDMY } from './format.js';

export const PERIOD_MODES = ['month', 'prev', 'custom', 'all', 'bill'];

const isIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && parseDMY(`${s.slice(8)}/${s.slice(5, 7)}/${s.slice(0, 4)}`) === s;

export function monthRange(year, monthIndex) {
  return { start: ymd(new Date(year, monthIndex, 1)), end: ymd(new Date(year, monthIndex + 1, 0)) };
}

/**
 * يحسب حدود الفترة الفعلية من الإعدادات. يرجع {mode, start, end}
 * (start/end = null عند "الكل"). الفترة المخصصة غير الصالحة تعود للشهر الحالي.
 * today: نص ISO لليوم (لسهولة الاختبار)
 */
export function latestBill(bills) {
  return bills && bills.length ? [...bills].sort((a, b) => a.end.localeCompare(b.end) || a.start.localeCompare(b.start))[bills.length - 1] : null;
}

export function resolvePeriod(settings, today, bills = []) {
  const [y, m] = today.split('-').map(Number);
  const mode = PERIOD_MODES.includes(settings.periodMode) ? settings.periodMode : 'month';
  if (mode === 'bill') {
    const b = bills.find((x) => x.id === settings.periodBillId) || latestBill(bills);
    if (b) return { mode, start: b.start, end: b.end, billId: b.id };
    return { mode: 'month', ...monthRange(y, m - 1) };
  }
  if (mode === 'all') return { mode, start: null, end: null };
  if (mode === 'prev') return { mode, ...monthRange(y, m - 2) };
  if (mode === 'custom' && isIso(settings.periodStart) && isIso(settings.periodEnd) && settings.periodStart <= settings.periodEnd) {
    return { mode, start: settings.periodStart, end: settings.periodEnd };
  }
  return { mode: 'month', ...monthRange(y, m - 1) };
}

export const inPeriod = (date, p) => (!p.start || date >= p.start) && (!p.end || date <= p.end);
