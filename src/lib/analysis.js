// إحصاءات الفترات: الطاقة والتكلفة والمسافة والكفاءة، للأشهر العادية ولدورات الفاتورة

import { periodDistance } from './odo.js';
import { billImpact, monthsInPeriod } from './tariff.js';
import { daysInclusive, monthRangeOf } from './format.js';

const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

/** إحصاءات فترة {start,end} (أحدهما null = مفتوح) من الشحنات وقراءات العداد */
export function periodStats(charges, readings, period) {
  const inRange = (c, s, e) => (!s || c.date >= s) && (!e || c.date <= e);
  const list = charges.filter((c) => inRange(c, period.start, period.end));
  const dist = periodDistance(readings, period.start, period.end);
  // الكفاءة تُحسب على نفس النافذة التي قيست فيها المسافة
  const win = dist ? list.filter((c) => inRange(c, dist.from, dist.to)) : [];
  const winEnergy = sum(win, (c) => c.energyKwh);
  const winCost = sum(win, (c) => c.totalCost);
  const part = (type, f) => sum(list.filter((c) => c.type === type), f);
  return {
    count: list.length,
    energy: sum(list, (c) => c.energyKwh),
    cost: sum(list, (c) => c.totalCost),
    homeEnergy: part('home', (c) => c.energyKwh),
    fastEnergy: part('fast', (c) => c.energyKwh),
    homeCost: part('home', (c) => c.totalCost),
    fastCost: part('fast', (c) => c.totalCost),
    distance: dist ? dist.distance : null,
    estimated: dist ? dist.estimated : false,
    window: dist ? { from: dist.from, to: dist.to } : null,
    efficiency: dist && winEnergy > 0 ? (winEnergy / dist.distance) * 100 : null,
    costPerKm: dist && winCost > 0 ? winCost / dist.distance : null,
  };
}

/** الأشهر العادية التي تحوي شحنات (تصاعدياً) كفترات */
export function monthPeriods(charges) {
  const keys = [...new Set(charges.map((c) => c.date.slice(0, 7)))].sort();
  return keys.map((key) => ({ key, kind: 'month', ...monthRangeOf(key) }));
}

/** دورات الفاتورة (تصاعدياً) كفترات */
export function billPeriods(bills) {
  return [...bills]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((b) => ({ key: b.id, kind: 'bill', start: b.start, end: b.end, bill: b }));
}

/** أثر السيارة على فاتورة محددة: يرجع null إن لم تكن البيانات صالحة */
export function billResult(bill, charges, tariff, lossPct = 0) {
  const home = charges.filter((c) => c.type === 'home' && c.date >= bill.start && c.date <= bill.end);
  const homeKwh = sum(home, (c) => c.energyKwh);
  const loss = lossPct > 0 && lossPct < 60 ? lossPct : 0;
  const evKwh = homeKwh * (1 + loss / 100);
  const days = daysInclusive(bill.start, bill.end);
  const months = monthsInPeriod(days);
  const res = billImpact({ total: bill.kwh, ev: evKwh, tiers: tariff.tiers, scale: months, extraFils: tariff.extraFils });
  const diff = bill.amount != null ? bill.amount - res.billWith : null;
  return { days, months, homeKwh, homeN: home.length, evKwh, res, diff, approx: Math.abs(days - months * 30.4) > 5 };
}
