import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ChargeItem } from './ChargeList.jsx';
import { MONTHS, WEEKDAYS_SHORT, ymd, todayStr, fix } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

export default function CalendarView({ charges, segments, currency, onEdit, onDelete, initialMonth }) {
  const { t, lang, rtl } = useI18n();
  const init = initialMonth && initialMonth !== 'all' ? initialMonth : todayStr().slice(0, 7);
  const [ym, setYm] = useState(init);
  const [selected, setSelected] = useState(null);

  const [y, m] = ym.split('-').map(Number); // m: 1..12
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

  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = first.getDay(); // الأحد = 0 (أول عمود)
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelected(null);
  };

  const monthCharges = [...byDay.values()].flat();
  const homeDays = new Set(monthCharges.filter((c) => c.type === 'home').map((c) => c.date)).size;
  const fastDays = new Set(monthCharges.filter((c) => c.type === 'fast').map((c) => c.date)).size;
  const effById = new Map(segments.map((s) => [s.endId, s.efficiency]));
  const selList = selected ? byDay.get(selected) || [] : [];
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;
  const monthName = MONTHS[lang][m - 1];

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <button className="btn-ghost !px-3 !py-2" onClick={() => shift(-1)} aria-label={t('prev_month')}><PrevIcon size={18} /></button>
          <div className="text-center">
            <div className="text-lg font-extrabold">{monthName} {y}</div>
            <div className="tabular text-[0.7rem] text-slate-400">{t('cal_stats', { n: monthCharges.length, h: homeDays, f: fastDays })}</div>
          </div>
          <button className="btn-ghost !px-3 !py-2" onClick={() => shift(1)} aria-label={t('next_month')}><NextIcon size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={t('cal_aria')}>
          {WEEKDAYS_SHORT[lang].map((w) => (
            <div key={w} className="pb-1 text-[0.7rem] font-medium text-slate-500">{w}</div>
          ))}
          {cells.map((d, i) => {
            if (d == null) return <div key={`e${i}`} />;
            const key = ymd(new Date(y, m - 1, d));
            const list = byDay.get(key) || [];
            const hasHome = list.some((c) => c.type === 'home');
            const hasFast = list.some((c) => c.type === 'fast');
            const isToday = key === today;
            const isSel = key === selected;
            const tint = hasHome && hasFast ? 'bg-gradient-to-br from-home/25 to-fast/25' : hasHome ? 'bg-home/20' : hasFast ? 'bg-fast/20' : 'bg-ink-900/60';
            const ring = isSel ? 'ring-2 ring-accent' : isToday ? 'ring-1 ring-white/40' : 'ring-1 ring-white/[0.04]';
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(list.length ? (isSel ? null : key) : null)}
                disabled={!list.length}
                aria-label={list.length ? t('day_aria_n', { d, m: monthName, n: list.length }) : t('day_aria', { d, m: monthName })}
                className={`tabular relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${tint} ${ring} ${list.length ? 'font-bold' : 'text-slate-500'}`}
              >
                {d}
                {list.length > 0 && (
                  <span className="mt-0.5 flex gap-0.5">
                    {hasHome && <span className="h-1.5 w-1.5 rounded-full bg-home shadow-glow-home" />}
                    {hasFast && <span className="h-1.5 w-1.5 rounded-full bg-fast shadow-glow-fast" />}
                  </span>
                )}
                {list.length > 1 && (
                  <span className="absolute end-0.5 top-0.5 rounded-full bg-white/15 px-1 text-[0.55rem] leading-tight">{list.length}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center gap-5 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-home" /> {t('legend_home')}</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-fast" /> {t('legend_fast')}</span>
        </div>
      </section>

      {selected && (
        <section className="space-y-2.5">
          <h3 className="tabular px-1 text-sm font-bold text-slate-300">
            {t('sel_title', { d: selected, v: fix(selList.reduce((s, c) => s + c.totalCost, 0), 2), c: currency })}
          </h3>
          {selList.map((c) => (
            <ChargeItem key={c.id} c={c} currency={currency} eff={effById.get(c.id) ?? null} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </section>
      )}
    </div>
  );
}
