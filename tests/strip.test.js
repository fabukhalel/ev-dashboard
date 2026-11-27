import { describe, it, expect } from 'vitest';
import { stripDays, tierRuns, MAX_STRIP_DAYS } from '../src/components/CycleStrip.jsx';
import { defaultSettings } from '../src/lib/storage.js';

const settings = defaultSettings(); // الدورة تبدأ يوم 6، أول 10 أيام منخفضة وآخر 7 مرتفعة
const cycle = { start: '2026-11-06', end: '2026-12-05' };

describe('cycle strip', () => {
  it('builds one day per date with tier and summed energy by type', () => {
    const charges = [
      { date: '2026-11-07', type: 'home', energyKwh: 20 },
      { date: '2026-11-07', type: 'fast', energyKwh: 5 },
      { date: '2026-11-20', type: 'home', energyKwh: 30 },
    ];
    const days = stripDays(cycle, charges, settings);
    expect(days).toHaveLength(30);
    expect(days[1]).toMatchObject({ date: '2026-11-07', level: 'low', home: 20, fast: 5 });
    expect(days[14]).toMatchObject({ date: '2026-11-20', level: 'mid', home: 30, fast: 0 });
    expect(days[29].level).toBe('high');
    expect(tierRuns(days).map((r) => [r.level, r.n])).toEqual([['low', 10], ['mid', 13], ['high', 7]]);
  });

  it('follows each date\'s own cycle when a month spans two cycles', () => {
    const days = stripDays({ start: '2026-11-01', end: '2026-11-30' }, [], settings);
    expect(tierRuns(days).map((r) => [r.level, r.n])).toEqual([['high', 5], ['low', 10], ['mid', 13], ['high', 2]]);
  });

  it('is hidden for long or open periods', () => {
    expect(stripDays(null, [], settings)).toBeNull();
    expect(stripDays({ start: '2026-01-01', end: '2026-12-31' }, [], settings)).toBeNull();
    expect(MAX_STRIP_DAYS).toBeGreaterThanOrEqual(31);
  });
});
