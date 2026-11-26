// حدود الشهر (تُستخدم في الحسابات المرجعية). نظام الفترات الكامل في cycle.js

import { ymd } from './format.js';

export function monthRange(year, monthIndex) {
  return { start: ymd(new Date(year, monthIndex, 1)), end: ymd(new Date(year, monthIndex + 1, 0)) };
}

export { inPeriod } from './cycle.js';
