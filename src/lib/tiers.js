// شريحة الشحن المنزلي (T1, T2, T6, T7):
// - تلقائياً حسب موقع تاريخ الشحنة في دورة الفاتورة: أول N أيام = الأولى، آخر M أيام = العليا، وما بينهما = الوسطى.
// - المستخدم يقدر يختار شريحة يدوياً لأي شحنة (tierSource: 'manual').
// - الشريحة لا تنزل داخل الدورة: الشحنة التلقائية تأخذ الأعلى بين شريحتها حسب التاريخ وأعلى شريحة يدوية لشحنة أقدم في نفس الدورة.
// - الشحنات القديمة (بلا tierSource) تحتفظ بتكلفتها المسجّلة، إلا إن طلب المستخدم إعادة حسابها.

import { cycleOf } from './cycle.js';
import { daysInclusive } from './format.js';
import { sortChrono, round } from './calc.js';

export const DEFAULT_TIER_DAYS = { low: 10, high: 7 };

/** اسم الشريحة: low | mid | high حسب موقعها بين الشرائح */
export function tierLevel(i, n) {
  if (i <= 0) return 'low';
  if (i >= n - 1) return 'high';
  return 'mid';
}

/** الشريحة التلقائية لتاريخ داخل دورة {start,end} */
export function autoTier(date, cycle, tierDays = DEFAULT_TIER_DAYS, nTiers = 3) {
  const n = Math.max(1, nTiers);
  const day = daysInclusive(cycle.start, date);
  const len = daysInclusive(cycle.start, cycle.end);
  const low = Math.max(0, tierDays.low ?? DEFAULT_TIER_DAYS.low);
  const high = Math.max(0, tierDays.high ?? DEFAULT_TIER_DAYS.high);
  if (day <= low) return 0;
  if (day > len - high) return n - 1;
  return Math.min(1, n - 1);
}

const clampTier = (t, n) => Math.max(0, Math.min(n - 1, Number.isInteger(t) ? t : 0));

/** هل تخضع الشحنة لقاعدة الشرائح الجديدة؟ */
export const isTiered = (c) => c.type === 'home' && (c.tierSource === 'auto' || c.tierSource === 'manual');

/**
 * يعيد حساب الشريحة والسعر والتكلفة لكل شحنة منزلية خاضعة للقاعدة.
 * يرجع مصفوفة جديدة؛ الشحنات غير المتغيرة تبقى نفس الكائن.
 */
export function retier(charges, settings, bills = []) {
  const tiers = settings.tariff.tiers;
  const n = tiers.length;
  const from = settings.tariff.effectiveFrom || '';
  const startDay = settings.cycleStartDay;
  const tierDays = settings.tierDays || DEFAULT_TIER_DAYS;
  const updated = new Map();
  const byCycle = new Map();
  for (const c of sortChrono(charges)) {
    if (!isTiered(c) || (from && c.date < from)) continue;
    const cyc = cycleOf(c.date, startDay, bills);
    const k = cyc.start;
    if (!byCycle.has(k)) byCycle.set(k, { cyc, list: [] });
    byCycle.get(k).list.push(c);
  }
  for (const { cyc, list } of byCycle.values()) {
    let floor = -1; // أعلى شريحة يدوية حتى الآن في الدورة
    for (const c of list) {
      let tier;
      if (c.tierSource === 'manual') {
        tier = clampTier(c.tier, n);
        floor = Math.max(floor, tier);
      } else {
        tier = Math.max(autoTier(c.date, cyc, tierDays, n), floor);
      }
      const rate = tiers[tier].rate;
      const totalCost = round(c.energyKwh * rate, 3);
      if (c.tier !== tier || c.pricePerKwh !== rate || c.totalCost !== totalCost) {
        updated.set(c.id, { ...c, tier, pricePerKwh: rate, totalCost });
      }
    }
  }
  if (!updated.size) return charges;
  return charges.map((c) => updated.get(c.id) || c);
}

/** شريحة يوم معيّن (لسطر «اليوم: الشريحة X» وللشحنة الجديدة): تحترم قاعدة عدم النزول */
export function tierOn(date, charges, settings, bills = [], excludeId = null) {
  const n = settings.tariff.tiers.length;
  const cyc = cycleOf(date, settings.cycleStartDay, bills);
  let floor = -1;
  for (const c of charges) {
    if (c.id === excludeId || !isTiered(c) || c.tierSource !== 'manual') continue;
    if (c.date >= cyc.start && c.date <= date) floor = Math.max(floor, clampTier(c.tier, n));
  }
  return Math.max(autoTier(date, cyc, settings.tierDays || DEFAULT_TIER_DAYS, n), floor);
}

/** T6: يحوّل الشحنات المنزلية القديمة إلى القاعدة الجديدة (تلقائي) ثم يعيد الحساب */
export function adoptOld(charges, settings, bills = []) {
  const next = charges.map((c) => (c.type === 'home' && !c.tierSource ? { ...c, tierSource: 'auto' } : c));
  return retier(next, settings, bills);
}

export const countOld = (charges) => charges.filter((c) => c.type === 'home' && !c.tierSource).length;
