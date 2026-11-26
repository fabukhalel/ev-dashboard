// يولّد tests/fixtures/baseline.json من البيانات التجريبية بتاريخ ثابت.
// الأرقام مرجع للاختبارات: أي تغيير لاحق في الحسابات يجب أن يبقيها كما هي.
// التشغيل: node scripts/make-baseline.mjs
import { writeFileSync } from 'node:fs';
import { baselineFromDemo } from '../tests/baseline-calc.js';

const out = baselineFromDemo();
writeFileSync(new URL('../tests/fixtures/baseline.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(`baseline: ${out.count} charges, ${out.summary.energy} kWh`);
