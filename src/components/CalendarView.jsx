import React, { useMemo, useState } from 'react';
import ChargeList from './ChargeList.jsx';
import { NavArrow, C } from './ui.jsx';
import { MONTHS, WEEKDAYS_SHORT, ymd, todayStr, num, formatDate } from '../lib/format.js';
import { cycleOf } from '../lib/cycle.js';
import { numberCharges } from '../state/derived.js';
import { useI18n } from '../lib/i18n.jsx';
import { useStore } from '../state/store.jsx';

/** التقويم (C8–C10): kWh داخل كل يوم شحن، تمييز يوم بداية الدورة، والضغط على يوم يعرض شحناته */
export default function CalendarView({ charges, settings, onOpen }) {
  const { t, lang } = useI18n();
  const { state: { bills } } = useStore();
  const [ym, setYm] = useState(todayStr().slice(0, 7));
  const [selected, setSelected] = useState(null);
  const [y, m] = ym.split('-').map(Number);
  const today = todayStr();

  const byDay = useMemo(() => {
    const map = new Map();
    for (const c of charges) {
      if (!c.date.startsWith(ym)) continue;
      if (!map.has(c.date)) map.set(c.date, []);
      map.get(c.date).push(c);
    }
    return map;
  }, [charges, ym]);

  // بدايات الدورات التي تقع في هذا الشهر (الفواتير المسجلة تغلب)
  const cycleStarts = useMemo(() => {
    const set = new Set();
    for (let d = 1; d <= 31; d++) {
      const key = ymd(new Date(y, m - 1, d));
      if (!key.startsWith(ym)) break;
      if (cycleOf(key, settings.cycleStartDay, bills).start === key) set.add(key);
    }
    return set;
  }, [ym, y, m, settings.cycleStartDay, bills]);

  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelected(null);
  };

  const monthCharges = [...byDay.values()].flat();
  const monthKwh = monthCharges.reduce((s, c) => s + c.energyKwh, 0);
  const selList = selected ? byDay.get(selected) || [] : [];
  const selNumbers = selected ? numberCharges(charges, cycleOf(selected, settings.cycleStartDay, bills)) : null;
  const monthName = MONTHS[lang][m - 1];

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <NavArrow dir={-1} onClick={() => shift(-1)} label={t('prev_month')} className="bg-ink-900" />
          <div className="text-center">
            <div className="text-lg font-bold">{monthName} {y}</div>
            <div className="tabular text-sm text-slate-400">{t('charges_n', { n: monthCharges.length })} · <bdi dir="ltr">{num(monthKwh, 1)} kWh</bdi></div>
          </div>
          <NavArrow dir={1} onClick={() => shift(1)} label={t('next_month')} className="bg-ink-900" />
        </div>

        <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={t('cal_aria')}>
          {WEEKDAYS_SHORT[lang].map((w) => <div key={w} className="pb-1 text-xs font-medium text-slate-500">{w}</div>)}
          {cells.map((d, i) => {
            if (d == null) return <div key={`e${i}`} />;
            const key = ymd(new Date(y, m - 1, d));
            const list = byDay.get(key) || [];
            const kwh = list.reduce((s, c) => s + c.energyKwh, 0);
            const type = list.some((c) => c.type === 'fast') ? (list.some((c) => c.type === 'home') ? 'mixed' : 'fast') : 'home';
            const isSel = key === selected;
            const tint = !list.length ? 'transparent' : type === 'mixed' ? `linear-gradient(135deg, color-mix(in srgb, ${C.home} 22%, transparent), color-mix(in srgb, ${C.fast} 22%, transparent))` : `color-mix(in srgb, ${type === 'fast' ? C.fast : C.home} 20%, transparent)`;
            const cycleStart = cycleStarts.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(list.length ? (isSel ? null : key) : null)}
                disabled={!list.length}
                aria-label={list.length ? t('day_aria_n', { d, m: monthName, n: list.length }) : t('day_aria', { d, m: monthName })}
                data-testid={cycleStart ? 'cycle-start-day' : list.length ? 'charge-day' : undefined}
                className={`tabular relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition ${isSel ? 'ring-2 ring-accent' : key === today ? 'ring-1 ring-white/40' : ''} ${list.length ? 'font-bold' : 'text-slate-500'}`}
                style={{ background: tint }}
              >
                <span>{d}</span>
                {list.length > 0 && <span className="text-xs font-bold leading-none" style={{ color: type === 'fast' ? C.fast : C.home }}>{num(kwh, kwh >= 10 ? 0 : 1)}</span>}
                {cycleStart && <span className="absolute top-1 h-1.5 w-1.5 rounded-full bg-accent" title={t('cycle_start')} />}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: C.home }} /> {t('legend_home')}</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: C.fast }} /> {t('legend_fast')}</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" /> {t('cycle_start')}</span>
        </div>
      </section>

      {selected && (
        <section className="space-y-2.5" data-testid="day-charges">
          <h3 className="tabular px-1 text-base font-bold"><bdi dir="ltr">{formatDate(selected)}</bdi></h3>
          <ChargeList charges={selList} numbers={selNumbers} settings={settings} onOpen={onOpen} />
        </section>
      )}
    </div>
  );
}

