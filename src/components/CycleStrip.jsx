import React, { useMemo } from 'react';
import { addDays, cycleOf } from '../lib/cycle.js';
import { autoTier, tierLevel } from '../lib/tiers.js';
import { daysInclusive } from '../lib/format.js';
import { num } from '../lib/format.js';

// شريط الدورة: مربع لكل يوم في الفترة ملوّن حسب شريحة ذلك اليوم، وفوقه عمود شحنات اليوم
// (المنزلي والسريع فوق بعض). اليوم الحالي محاط بإطار، والأيام القادمة باهتة.
export const MAX_STRIP_DAYS = 62;

const TIER_BG = { low: 'rgb(var(--tier-low))', mid: 'rgb(var(--tier-mid))', high: 'rgb(var(--tier-high))' };

/** أيام الشريط مع شحنات كل يوم وشريحته. يرجع null إن كانت الفترة طويلة أو بلا نطاق */
export function stripDays(range, charges, settings, bills = []) {
  if (!range || !range.start || !range.end) return null;
  const n = daysInclusive(range.start, range.end);
  if (!(n > 0) || n > MAX_STRIP_DAYS) return null;
  const nTiers = settings.tariff.tiers.length;
  const byDate = {};
  for (const c of charges) {
    const d = (byDate[c.date] ||= { home: 0, fast: 0 });
    d[c.type === 'fast' ? 'fast' : 'home'] += c.energyKwh || 0;
  }
  const days = [];
  for (let i = 0; i < n; i++) {
    const date = addDays(range.start, i);
    const cyc = cycleOf(date, settings.cycleStartDay, bills);
    const level = tierLevel(autoTier(date, cyc, settings.tierDays, nTiers), nTiers);
    days.push({ date, level, home: byDate[date]?.home || 0, fast: byDate[date]?.fast || 0 });
  }
  return days;
}

/** تجميع الأيام المتتالية بنفس الشريحة (لعناوين المناطق تحت الشريط) */
export function tierRuns(days) {
  const runs = [];
  for (const d of days) {
    const last = runs[runs.length - 1];
    if (last && last.level === d.level) last.n += 1;
    else runs.push({ level: d.level, n: 1 });
  }
  return runs;
}

export default function CycleStrip({ range, charges, settings, bills, today, t }) {
  const days = useMemo(() => stripDays(range, charges, settings, bills), [range, charges, settings, bills]);
  if (!days) return null;
  const max = Math.max(1, ...days.map((d) => d.home + d.fast));
  const runs = tierRuns(days);
  const cols = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };
  return (
    <div className="mt-5" data-testid="cycle-strip" role="img" aria-label={t('strip_label', { n: days.filter((d) => d.home + d.fast > 0).length })}>
      <div className="grid h-28 items-end gap-[2px]" style={cols}>
        {days.map((d, i) => (
          <div key={d.date} className="flex h-full flex-col justify-end" data-date={d.date}>
            {d.home + d.fast > 0 && (
              <div className="flex origin-bottom flex-col justify-end overflow-hidden rounded-t-[3px] motion-safe:animate-grow"
                style={{ height: `${((d.home + d.fast) / max) * 100}%`, animationDelay: `${i * 15}ms` }}
                title={`${d.date}: ${num(d.home + d.fast, 1)} kWh`}>
                {d.fast > 0 && <span style={{ flexGrow: d.fast, background: 'rgb(var(--fast))' }} />}
                {d.home > 0 && <span style={{ flexGrow: d.home, background: 'rgb(var(--home))' }} />}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 grid gap-[2px]" style={cols}>
        {days.map((d) => (
          <div key={d.date} className={`h-3.5 rounded-[2px] ${d.date === today ? 'outline outline-2 outline-offset-1' : ''} ${d.date > today ? 'opacity-40' : ''}`}
            style={{ background: TIER_BG[d.level], outlineColor: 'rgb(var(--hero-fg))' }} data-tier={d.level} data-today={d.date === today || undefined} />
        ))}
      </div>
      <div className="mt-2 flex text-xs hero-soft" aria-hidden="true">
        {runs.map((r, i) => (
          <span key={i} className="truncate text-center" style={{ flex: r.n }}>{r.n >= 4 ? t(`tier_${r.level}`) : ''}</span>
        ))}
      </div>
    </div>
  );
}
