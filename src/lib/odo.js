// قراءات عداد السيارة: تُجمع من حقل العداد في الشحنات ومن القراءات المسجّلة يدوياً،
// ثم تُستخدم لتقدير المسافة داخل أي فترة (استيفاء نسبي بين قراءتين محيطتين).

import { daysInclusive } from './format.js';

const span = (a, b) => daysInclusive(a, b) - 1; // عدد الأيام بين تاريخين (0 لليوم نفسه)

/** كل القراءات مرتبة زمنياً: [{date, km, src: 'charge'|'manual', id}] */
export function collectReadings(charges, odos = []) {
  const out = [];
  for (const c of charges) if (c.odometer != null) out.push({ date: c.date, km: c.odometer, src: 'charge', id: c.id });
  for (const o of odos) out.push({ date: o.date, km: o.km, src: 'manual', id: o.id });
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.km - b.km);
}

/** قراءة العداد عند تاريخ: {km, exact} أو null إن كان خارج نطاق القراءات */
export function odoAt(readings, date) {
  if (!readings.length || date < readings[0].date || date > readings[readings.length - 1].date) return null;
  const same = readings.filter((r) => r.date === date);
  if (same.length) return { km: same[same.length - 1].km, exact: true };
  let prev = null;
  let next = null;
  for (const r of readings) {
    if (r.date < date) prev = r;
    else if (r.date > date && !next) next = r;
  }
  if (!prev || !next) return null;
  const k = span(prev.date, date) / span(prev.date, next.date);
  return { km: prev.km + (next.km - prev.km) * k, exact: false };
}

/**
 * المسافة المقطوعة داخل الفترة [start, end]. تُقصّ الفترة إلى نطاق القراءات المتاحة.
 * يرجع {distance, from, to, estimated} أو null إن لم تتوفر قراءتان تغطيان جزءاً من الفترة.
 */
export function periodDistance(readings, start, end) {
  if (readings.length < 2) return null;
  const first = readings[0].date;
  const last = readings[readings.length - 1].date;
  const from = !start || start < first ? first : start;
  const to = !end || end > last ? last : end;
  if (from >= to) return null;
  const a = odoAt(readings, from);
  const b = odoAt(readings, to);
  if (!a || !b || b.km - a.km <= 0) return null;
  return { distance: b.km - a.km, from, to, estimated: !(a.exact && b.exact) || from !== start || to !== end };
}
