import React, { useMemo, useState } from 'react';
import { Gauge, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import PeriodChart from '../components/PeriodChart.jsx';
import { PageTitle, Segmented, NumUnit, SectionTitle, C } from '../components/ui.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { useReadings } from '../state/derived.js';
import { periodStats } from '../lib/analysis.js';
import { monthsBetween, cyclesBetween, dayOf } from '../lib/cycle.js';
import { odoAt } from '../lib/odo.js';
import { sortChrono } from '../lib/calc.js';
import { monthTitle, formatDate, shortDM, fix, num, todayStr, daysInclusive } from '../lib/format.js';

/** عنوان واضح للفترة (A7): «نوفمبر 2026» للشهر، «دورة 06/11 – 05/12/2026» للدورة */
function periodTitle(p, kind, t, lang) {
  if (kind === 'month') return { title: monthTitle(p.start, lang), sub: `${shortDM(p.start)} – ${shortDM(p.end)}`, label: monthTitle(p.start, lang, false) };
  return { title: t('cycle_title', { a: shortDM(p.start), b: formatDate(p.end) }), sub: null, label: `${Number(p.start.slice(8))}/${Number(p.start.slice(5, 7))}` };
}

/** التحليل (A1–A7): الطاقة افتراضياً، التكلفة، والمسافة والكفاءة عند وجود قراءات عداد */
// للفترة الحالية: آخر قراءة حتى اليوم (لا نقدّر ما بعد آخر قراءة)
const lastOdoUpTo = (readings, today) => {
  const last = readings.length ? readings[readings.length - 1].date : today;
  return last < today ? last : today;
};

export default function Analysis() {
  const { state: { charges, settings, bills }, t, lang, actions } = useStore();
  const ui = useUi();
  const readings = useReadings();
  const kind = settings.periodMode === 'cycle' ? 'cycle' : 'month';
  const [metric, setMetric] = useState('energy');
  const today = todayStr();
  const hasOdo = readings.length >= 2;

  const rows = useMemo(() => {
    if (!charges.length) return [];
    const first = sortChrono(charges)[0].date;
    const list = kind === 'month' ? monthsBetween(first, today) : cyclesBetween(first, today, settings.cycleStartDay, bills);
    return list.slice(-12).map((p) => {
      const s = periodStats(charges, readings, p);
      const day = dayOf(p, today);
      const days = day ? day.n : daysInclusive(p.start, p.end);
      return { p, s, days, current: !!day, ...periodTitle(p, kind, t, lang), odoStart: odoAt(readings, p.start), odoEnd: odoAt(readings, day ? lastOdoUpTo(readings, today) : p.end) };
    });
  }, [charges, readings, kind, today, settings.cycleStartDay, bills, t, lang]);

  const m = !hasOdo && (metric === 'distance' || metric === 'eff') ? 'energy' : metric;
  const chart = m === 'energy' || m === 'cost'
    ? { kind: 'stack', unit: m === 'cost' ? settings.currency : 'kWh', decimals: m === 'cost' ? 1 : 0, rows: rows.map(({ s, label }) => ({ label, home: m === 'cost' ? s.homeCost : s.homeEnergy, fast: m === 'cost' ? s.fastCost : s.fastEnergy })) }
    : m === 'distance'
      ? { kind: 'bar', unit: t('km'), decimals: 0, rows: rows.map(({ s, label }) => ({ label, value: s.distance })) }
      : { kind: 'line', unit: 'kWh/100km', decimals: 1, rows: rows.map(({ s, label }) => ({ label, value: s.efficiency })) };

  const metrics = [{ value: 'energy', label: t('m_energy') }, { value: 'cost', label: t('m_cost') }];
  if (hasOdo) metrics.push({ value: 'distance', label: t('m_distance') }, { value: 'eff', label: t('m_eff') });
  const [allOdo, setAllOdo] = useState(false);
  const list = [...readings].reverse();
  const Chev = lang === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <>
      <PageTitle title={t('tab_analysis')} />
      <section className="card space-y-4 p-4">
        <Segmented value={kind} onChange={(v) => { actions.changeSettings({ periodMode: v }); ui.setPeriodOffset(0); }}
          options={[{ value: 'month', label: t('kind_month') }, { value: 'cycle', label: t('kind_cycle') }]} />
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('an_metric')}>
          {metrics.map((x) => <button key={x.value} type="button" className="chip" aria-pressed={m === x.value} onClick={() => setMetric(x.value)}>{x.label}</button>)}
        </div>
        <PeriodChart rows={chart.rows} kind={chart.kind} unit={chart.unit} decimals={chart.decimals} ariaLabel={t('ch_aria')} />
      </section>

      {rows.length > 0 && (
        <section className="space-y-3" aria-label={t('an_table')}>
          <SectionTitle>{t('an_table')}</SectionTitle>
          {[...rows].reverse().map(({ p, s, days, current, title, sub }) => (
            <div key={p.start} className="card p-4" data-testid="an-row">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-bold">{title}</div>
                  {sub && <div className="tabular text-sm text-slate-400" dir="ltr">{sub}</div>}
                </div>
                <span className="text-sm text-slate-400">{t('charges_n', { n: s.count })}{current ? ` · ${t('current')}` : ''}</span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <NumUnit value={fix(s.energy, 1)} unit="kWh" className="text-[2rem] font-bold leading-none" unitClass="text-sm font-medium text-slate-400" />
                <span className="tabular text-sm text-slate-400">{fix(s.cost, 2)} {settings.currency}</span>
              </div>
              <div className="tabular mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><div className="text-slate-400">{t('type_home_s')}</div><b dir="ltr" style={{ color: C.home }}>{num(s.homeEnergy, 1)} kWh</b></div>
                <div><div className="text-slate-400">{t('type_fast_s')}</div><b dir="ltr" style={{ color: C.fast }}>{num(s.fastEnergy, 1)} kWh</b></div>
                <div><div className="text-slate-400">{t('daily_avg')}</div><b dir="ltr">{num(s.energy / days, 1)} kWh</b></div>
              </div>
              {s.distance != null && (
                <div className="tabular mt-3 flex justify-between border-t border-white/[0.07] pt-3 text-sm">
                  <span className="text-slate-400">{t('m_distance')} <b className="text-slate-100" dir="ltr">{s.estimated ? '≈ ' : ''}{num(s.distance, 0)} {t('km')}</b></span>
                  {s.efficiency != null && <span className="text-slate-400">{t('m_eff')} <b className="text-slate-100" dir="ltr">{fix(s.efficiency, 1)}</b></span>}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="card space-y-3 p-4" data-testid="odo-section">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Gauge size={19} className="text-accent" /> {t('odo_title')}</h3>
          <button className="btn-primary !px-3.5 !py-2 text-sm" onClick={() => ui.openOdo(null)} data-testid="odo-today"><Plus size={16} /> {t('odo_today')}</button>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{t('odo_hint_new')}</p>
        {rows.length > 0 && hasOdo && (
          <ul className="row-divide" data-testid="odo-periods">
            {[...rows].reverse().slice(0, 6).map(({ p, title, odoStart, odoEnd }) => (
              <li key={p.start} className="tabular flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="font-bold">{title}</span>
                <span className="text-slate-400" dir="ltr">{odoStart ? `${odoStart.exact ? '' : '≈'}${num(odoStart.km, 0)}` : '—'} → {odoEnd ? `${odoEnd.exact ? '' : '≈'}${num(odoEnd.km, 0)}` : '—'} {t('km')}</span>
              </li>
            ))}
          </ul>
        )}
        {list.length === 0 ? (
          <p className="rounded-2xl bg-ink-900 px-3 py-3 text-center text-sm text-slate-400">{t('odo_empty')}</p>
        ) : (
          <>
            <p className="text-sm text-slate-500">{t('odo_tap_hint')}</p>
            <ul className="space-y-1.5" data-testid="odo-list">
              {(allOdo ? list : list.slice(0, 6)).map((r) => (
                <li key={`${r.src}-${r.id}`}>
                  <button type="button" className="tabular flex w-full items-center justify-between gap-2 rounded-2xl bg-ink-900 px-3 py-2.5 text-start text-sm" onClick={() => ui.openOdo(r)} data-testid="odo-row">
                    <span className="min-w-0">
                      <bdi dir="ltr" className="block font-bold">{formatDate(r.date)}</bdi>
                      {r.src === 'charge' && <span className="block text-xs text-slate-500">{t('odo_from_charge')}</span>}
                    </span>
                    <span className="flex items-center gap-1.5"><b dir="ltr">{num(r.km, 0)} {t('km')}</b><Chev size={16} className="text-slate-500" /></span>
                  </button>
                </li>
              ))}
            </ul>
            {list.length > 6 && <button type="button" className="btn-ghost w-full !py-2 text-sm" onClick={() => setAllOdo(!allOdo)}>{allOdo ? t('show_less') : t('view_all_n', { n: list.length })}</button>}
          </>
        )}
      </section>
    </>
  );
}
