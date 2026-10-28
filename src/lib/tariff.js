// أثر شحن السيارة المنزلي على فاتورة الكهرباء حسب التعرفة الأردنية المتدرجة.
//
// المصدر: هيئة تنظيم قطاع الطاقة والمعادن (EMRC) — تعرفة القطاع المنزلي السارية من 1/1/2025
// (الأسعار بالدينار لكل kWh، والشرائح شهرية وتراكمية: كل جزء من الاستهلاك يُسعَّر بشريحته):
//   مدعوم:      1–300 = 0.050 | 301–600 = 0.100 | أكثر من 600 = 0.200
//   غير مدعوم:  1–1000 = 0.120 | أكثر من 1000 = 0.150
// التعرفة تتغير بقرار من المجلس، لذلك الأرقام قابلة للتعديل من شاشة الأداة.

export const TARIFF_PLANS = {
  subsidized: [
    { upTo: 300, rate: 0.05 },
    { upTo: 600, rate: 0.1 },
    { upTo: null, rate: 0.2 },
  ],
  unsubsidized: [
    { upTo: 1000, rate: 0.12 },
    { upTo: null, rate: 0.15 },
  ],
};

export function defaultTariff() {
  return { plan: 'subsidized', tiers: TARIFF_PLANS.subsidized.map((x) => ({ ...x })), extraFils: 0 };
}

const r3 = (v) => Math.round(v * 1000) / 1000;

/**
 * كلفة استهلاك kwh على شرائح التعرفة. scale = عدد الأشهر التي تغطيها الفاتورة
 * (حدود الشرائح شهرية فتُضرب بعدد الأشهر). يرجع {cost, parts[{from,to,kwh,rate,cost}]}
 */
export function tierCost(kwh, tiers, scale = 1) {
  const parts = [];
  let prev = 0;
  let left = Math.max(0, kwh);
  let cost = 0;
  for (const t of tiers) {
    const top = t.upTo == null ? Infinity : t.upTo * scale;
    const take = Math.max(0, Math.min(left, top - prev));
    parts.push({ from: prev, to: t.upTo == null ? null : top, kwh: take, rate: t.rate, cost: take * t.rate });
    cost += take * t.rate;
    left -= take;
    prev = top;
    if (left <= 0) {
      // الشرائح المتبقية تُعرض بصفر
      const idx = tiers.indexOf(t);
      for (const rest of tiers.slice(idx + 1)) {
        parts.push({ from: prev, to: rest.upTo == null ? null : rest.upTo * scale, kwh: 0, rate: rest.rate, cost: 0 });
        prev = rest.upTo == null ? Infinity : rest.upTo * scale;
      }
      break;
    }
  }
  return { cost, parts };
}

/**
 * total: استهلاك المنزل الكلي في الفاتورة (يشمل السيارة)، ev: طاقة الشحن المنزلي (من الجدار) خلال نفس الفترة.
 * الأثر = كلفة (total) − كلفة (total − ev)، أي أن السيارة تُعتبر آخر ما استُهلك فتقع في أعلى الشرائح.
 */
export function billImpact({ total, ev, tiers, scale = 1, extraFils = 0 }) {
  const t = Math.max(0, total);
  const e = Math.min(Math.max(0, ev), t);
  const base = t - e;
  const withEv = tierCost(t, tiers, scale);
  const without = tierCost(base, tiers, scale);
  // الأجزاء التي تخص السيارة فقط (الفرق بين الحالتين في كل شريحة)
  const evParts = withEv.parts.map((p, i) => ({
    from: p.from,
    to: p.to,
    rate: p.rate,
    kwh: p.kwh - without.parts[i].kwh,
    cost: p.cost - without.parts[i].cost,
  }));
  const extra = (e * Math.max(0, extraFils)) / 1000;
  const impact = withEv.cost - without.cost + extra;
  return {
    total: t,
    ev: e,
    base,
    capped: ev > t,
    billWith: withEv.cost + (t * Math.max(0, extraFils)) / 1000,
    billWithout: without.cost + (base * Math.max(0, extraFils)) / 1000,
    impact: r3(impact),
    extra,
    evParts,
    share: withEv.cost > 0 ? (impact / (withEv.cost + (t * Math.max(0, extraFils)) / 1000)) * 100 : 0,
    effectiveRate: e > 0 ? impact / e : null,
  };
}

/** عدد الأشهر التي تغطيها فترة الفاتورة (للحدود الشهرية): أقرب عدد صحيح لا يقل عن 1 */
export function monthsInPeriod(days) {
  return Math.max(1, Math.round(days / 30.4));
}
