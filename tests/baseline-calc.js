// حساب الأرقام المرجعية من البيانات التجريبية بتاريخ ثابت (يستخدمه الاختبار ومولّد الملف)
import { makeDemoCharges } from '../src/lib/demo.js';
import { computeSegments, summarize, byMonth, byType, overallEfficiency } from '../src/lib/calc.js';
import { collectReadings } from '../src/lib/odo.js';
import { periodStats, billResult } from '../src/lib/analysis.js';
import { defaultTariff } from '../src/lib/tariff.js';
import { monthRange } from '../src/lib/period.js';

export const BASELINE_TODAY = '2026-11-26';
export const CAPACITY = 60.48;

const r = (v, d = 4) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

export function baselineFromDemo() {
  const [y, m, d] = BASELINE_TODAY.split('-').map(Number);
  const charges = makeDemoCharges(CAPACITY, {}, new Date(y, m - 1, d, 12));
  const segs = computeSegments(charges, CAPACITY);
  const sum = summarize(charges, segs);
  const readings = collectReadings(charges, []);
  const oct = monthRange(2026, 9);
  const octStats = periodStats(charges, readings, oct);
  const bill = { id: 'b1', start: '2026-10-06', end: '2026-11-05', kwh: 700, amount: null };
  const br = billResult(bill, charges, defaultTariff(), 0);
  const types = byType(charges);
  return {
    today: BASELINE_TODAY,
    count: charges.length,
    firstDate: charges[0].date,
    lastDate: charges[charges.length - 1].date,
    summary: {
      energy: r(sum.energy), cost: r(sum.cost), distance: r(sum.distance),
      efficiency: r(sum.efficiency), costPerKm: r(sum.costPerKm), avgPrice: r(sum.avgPrice),
    },
    overallEfficiency: r(overallEfficiency(segs)),
    segments: segs.length,
    months: byMonth(charges, segs).map((x) => ({ key: x.key, count: x.count, energy: r(x.energy), cost: r(x.cost), efficiency: r(x.efficiency) })),
    types: { home: { count: types.home.count, energy: r(types.home.energy) }, fast: { count: types.fast.count, energy: r(types.fast.energy) } },
    october: { count: octStats.count, energy: r(octStats.energy), cost: r(octStats.cost), distance: r(octStats.distance), efficiency: r(octStats.efficiency) },
    bill: { homeKwh: r(br.homeKwh), months: br.months, impact: r(br.res.impact), billWith: r(br.res.billWith) },
  };
}
