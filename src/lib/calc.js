// منطق الحسابات (بدون أي اعتماديات خارجية، قابل للاختبار مباشرة)

export const round = (v, d = 2) => {
  const f = 10 ** d;
  return Math.round((v + Number.EPSILON) * f) / f;
};

/** الطاقة المكتسبة (kWh) من نسبة الشحن قبل/بعد وسعة البطارية */
export function energyFromSoc(before, after, capacity) {
  return Math.max(0, ((after - before) / 100) * capacity);
}

const stamp = (c) => `${c.date}T${c.time || '00:00'}`;

export function sortChrono(charges) {
  return [...charges].sort(
    (a, b) => stamp(a).localeCompare(stamp(b)) || (a.createdAt || 0) - (b.createdAt || 0),
  );
}

/**
 * مقاطع القيادة بين قراءتي عداد.
 * - المسافة = فرق قراءتي العداد.
 * - الطاقة المستهلكة = (SoC بعد الشحنة السابقة − SoC قبل الشحنة الحالية) × السعة
 *   + أي طاقة أُضيفت في شحنات وسيطة بدون قراءة عداد.
 * - يُنسب المقطع إلى الشحنة التي تُنهيه (شهرها ونوعها)، كأسلوب "تعبئة إلى تعبئة".
 */
export function computeSegments(charges, fallbackCapacity) {
  const sorted = sortChrono(charges);
  const segs = [];
  let anchor = -1;

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    if (c.odometer == null) continue;

    if (anchor >= 0) {
      const a = sorted[anchor];
      const group = sorted.slice(anchor + 1, i + 1); // الشحنات بعد A حتى B (شاملة B)
      const distance = c.odometer - a.odometer;
      const addedBetween = group.slice(0, -1).reduce((s, x) => s + x.energyKwh, 0);
      const capA = a.capacity ?? fallbackCapacity;
      const capB = c.capacity ?? fallbackCapacity;
      const socDrop = (a.socAfter / 100) * capA - (c.socBefore / 100) * capB;
      const consumed = socDrop + addedBetween;

      if (distance > 0 && consumed > 0) {
        const gEnergy = group.reduce((s, x) => s + x.energyKwh, 0);
        const gCost = group.reduce((s, x) => s + x.totalCost, 0);
        const price = gEnergy > 0 ? gCost / gEnergy : 0;
        segs.push({
          endId: c.id,
          date: c.date,
          month: c.date.slice(0, 7),
          type: c.type,
          distance,
          consumed,
          cost: consumed * price,
          efficiency: (consumed / distance) * 100,
        });
      }
    }
    anchor = i;
  }
  return segs;
}

const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

/** ملخص مؤشرات الأداء لمجموعة شحنات ومقاطعها */
export function summarize(charges, segments) {
  const energy = sum(charges, (c) => c.energyKwh);
  const cost = sum(charges, (c) => c.totalCost);
  const distance = sum(segments, (s) => s.distance);
  const consumed = sum(segments, (s) => s.consumed);
  const segCost = sum(segments, (s) => s.cost);
  return {
    count: charges.length,
    energy,
    cost,
    avgPrice: energy > 0 ? cost / energy : null,
    distance,
    consumed,
    efficiency: distance > 0 ? (consumed / distance) * 100 : null,
    costPerKm: distance > 0 ? segCost / distance : null,
  };
}

/** تجميع شهري (ترتيب تصاعدي) للرسم البياني */
export function byMonth(charges, segments) {
  const map = new Map();
  for (const c of charges) {
    const k = c.date.slice(0, 7);
    if (!map.has(k)) {
      map.set(k, {
        key: k, homeCost: 0, fastCost: 0, homeEnergy: 0, fastEnergy: 0,
        cost: 0, energy: 0, count: 0, distance: 0, consumed: 0,
      });
    }
    const m = map.get(k);
    const t = c.type === 'fast' ? 'fast' : 'home';
    m[`${t}Cost`] += c.totalCost;
    m[`${t}Energy`] += c.energyKwh;
    m.cost += c.totalCost;
    m.energy += c.energyKwh;
    m.count += 1;
  }
  for (const s of segments) {
    const m = map.get(s.month);
    if (m) {
      m.distance += s.distance;
      m.consumed += s.consumed;
    }
  }
  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => ({ ...m, efficiency: m.distance > 0 ? (m.consumed / m.distance) * 100 : null }));
}

/** مقارنة منزلي vs سريع: النسب والتكلفة الإجمالية */
export function byType(charges) {
  const init = () => ({ count: 0, energy: 0, cost: 0 });
  const r = { home: init(), fast: init() };
  for (const c of charges) {
    const t = r[c.type === 'fast' ? 'fast' : 'home'];
    t.count += 1;
    t.energy += c.energyKwh;
    t.cost += c.totalCost;
  }
  const te = r.home.energy + r.fast.energy;
  const tc = r.home.cost + r.fast.cost;
  const tn = r.home.count + r.fast.count;
  for (const k of ['home', 'fast']) {
    const t = r[k];
    t.avgPrice = t.energy > 0 ? t.cost / t.energy : null;
    t.energyShare = te > 0 ? (t.energy / te) * 100 : 0;
    t.costShare = tc > 0 ? (t.cost / tc) * 100 : 0;
    t.countShare = tn > 0 ? (t.count / tn) * 100 : 0;
  }
  return { ...r, total: { count: tn, energy: te, cost: tc } };
}

/** معدل الاستهلاك الفعلي الإجمالي kWh/100km (أو null) */
export function overallEfficiency(segments) {
  const d = sum(segments, (s) => s.distance);
  const e = sum(segments, (s) => s.consumed);
  return d > 0 ? (e / d) * 100 : null;
}

/** سعر الكيلوواط المتوقع حسب نوع الشاحن: من سجلك الفعلي وإلا السعر الافتراضي */
export function priceForType(charges, type, fallback) {
  const list = charges.filter((c) => c.type === type && c.energyKwh > 0);
  const energy = sum(list, (c) => c.energyKwh);
  const cost = sum(list, (c) => c.totalCost);
  if (energy > 0 && cost > 0) return { value: cost / energy, source: 'history', n: list.length };
  return { value: fallback, source: 'default', n: 0 };
}
