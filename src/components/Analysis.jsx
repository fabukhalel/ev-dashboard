import React, { useMemo, useState } from 'react';
import { Gauge, Plus, Trash2, Info } from 'lucide-react';
import PeriodChart from './PeriodChart.jsx';
import { Segmented } from './ui.jsx';
import { periodStats, monthPeriods, billPeriods, billResult } from '../lib/analysis.js';
import { monthShort, shortDM, formatDate, fix, num } from '../lib/format.js';
import { useI18n } from '../lib/i18n.jsx';

const dash = (v, d, est) => (v == null ? '—' : `${est ? '≈ ' : ''}${fix(v, d)}`);

/** التحليل: مقارنة الأشهر العادية أو دورات الفاتورة (الطاقة، التكلفة، المسافة، الكفاءة) + قراءات عداد السيارة */
export default function Analysis({ charges, bills, readings, odos, settings, onAddOdo, onDeleteOdo }) {
  const { t } = useI18n();
  const [group, setGroup] = useState('months');
  const [metric, setMetric] = useState('energy');
  const cur = settings.currency;

  const periods = useMemo(() => {
    const list = group === 'months' ? monthPeriods(charges) : billPeriods(bills);
    return list.slice(-12);
  }, [group, charges, bills]);

  const rowsData = useMemo(
    () => periods.map((p) => {
      const s = periodStats(charges, readings, p);
      const label = p.kind === 'month' ? monthShort(p.key, 'en') : `${shortDM(p.start)}→${shortDM(p.end)}`;
      const impact = p.kind === 'bill' ? billResult(p.bill, charges, settings.tariff, parseFloat(settings.bill.loss) || 0) : null;
      return { p, s, label, impact };
    }),
    [periods, charges, readings, settings.tariff, settings.bill.loss],
  );

  const chart = useMemo(() => {
    if (metric === 'energy' || metric === 'cost') {
      return {
        kind: 'stack',
        unit: metric === 'cost' ? cur : 'kWh',
        decimals: metric === 'cost' ? 2 : 1,
        rows: rowsData.map(({ s, label }) => ({
          label,
          home: metric === 'cost' ? s.homeCost : s.homeEnergy,
          fast: metric === 'cost' ? s.fastCost : s.fastEnergy,
        })),
      };
    }
    if (metric === 'distance') {
      return { kind: 'bar', unit: t('km'), decimals: 0, rows: rowsData.map(({ s, label }) => ({ label, value: s.distance, est: s.estimated })) };
    }
    return { kind: 'line', unit: 'kWh/100km', decimals: 2, rows: rowsData.map(({ s, label }) => ({ label, value: s.efficiency, est: s.estimated })) };
  }, [metric, rowsData, cur, t]);

  const sortedOdos = useMemo(() => [...odos].sort((a, b) => b.date.localeCompare(a.date)), [odos]);
  const chargeReadings = readings.filter((r) => r.src === 'charge').length;

  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold">{t('an_title')}</h3>
        </div>
        <Segmented
          value={group}
          onChange={setGroup}
          options={[{ value: 'months', label: t('an_months') }, { value: 'bills', label: t('an_bills') }]}
        />
        <Segmented
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'energy', label: t('m_energy') },
            { value: 'cost', label: t('m_cost') },
            { value: 'distance', label: t('m_distance') },
            { value: 'eff', label: t('m_eff') },
          ]}
        />
        {group === 'bills' && bills.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('an_no_bills')}</p>
        ) : (
          <PeriodChart rows={chart.rows} kind={chart.kind} unit={chart.unit} decimals={chart.decimals} ariaLabel={t('ch_aria')} />
        )}
        {(metric === 'distance' || metric === 'eff') && <p className="flex gap-2 text-[0.7rem] leading-relaxed text-slate-500"><Info size={14} className="mt-0.5 shrink-0" />{t('an_est_hint')}</p>}
      </section>

      {rowsData.length > 0 && (
        <section className="card p-4" aria-label={t('an_table')}>
          <h3 className="mb-3 text-base font-extrabold">{t('an_table')}</h3>
          <div className="space-y-2.5">
            {[...rowsData].reverse().map(({ p, s, label, impact }) => (
              <div key={p.key} className="rounded-xl border border-white/10 bg-ink-900/50 p-3" data-testid="an-row">
                <div className="flex items-center justify-between gap-2">
                  <b dir="ltr" className="tabular text-sm">{p.kind === 'month' ? monthShort(p.key, 'en') : `${formatDate(p.start)} → ${formatDate(p.end)}`}</b>
                  <span className="text-[0.7rem] text-slate-400">{t('charges_n', { n: s.count })}</span>
                </div>
                <dl className="tabular mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex justify-between"><dt className="text-slate-400">{t('kpi_energy')}</dt><dd dir="ltr" className="font-bold">{fix(s.energy, 1)} kWh</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">{t('kpi_cost')}</dt><dd className="font-bold">{fix(s.cost, 2)} {cur}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">{t('m_distance')}</dt><dd dir="ltr" className="font-bold">{dash(s.distance, 0, s.estimated)} {s.distance != null ? t('km') : ''}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">{t('m_eff')}</dt><dd dir="ltr" className="font-bold">{dash(s.efficiency, 1, s.estimated)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">{t('an_cost_km')}</dt><dd className="font-bold">{dash(s.costPerKm, 3, s.estimated)}</dd></div>
                  {impact && <div className="flex justify-between"><dt className="text-slate-400">{t('bill_impact_short')}</dt><dd className="font-bold text-fast">{fix(impact.res.impact, 2)} {cur}</dd></div>}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card space-y-3 p-4" data-testid="odo-section">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-extrabold"><Gauge size={18} className="text-accent" /> {t('odo_title')}</h3>
          <button className="btn-primary !px-3 !py-2 text-xs" onClick={onAddOdo}><Plus size={15} /> {t('odo_add')}</button>
        </div>
        <p className="text-[0.7rem] leading-relaxed text-slate-500">{t('odo_hint', { n: chargeReadings })}</p>
        {sortedOdos.length === 0 ? (
          <p className="rounded-xl bg-white/[0.04] px-3 py-3 text-center text-xs text-slate-400">{t('odo_empty')}</p>
        ) : (
          <ul className="space-y-1.5">
            {sortedOdos.map((o) => (
              <li key={o.id} className="tabular flex items-center justify-between gap-2 rounded-xl bg-ink-900/60 px-3 py-2 text-sm">
                <bdi dir="ltr" className="font-bold">{formatDate(o.date)}</bdi>
                <span dir="ltr" className="font-extrabold">{num(o.km, 0)} {t('km')}</span>
                <button className="rounded-lg p-1.5 text-danger hover:bg-red-500/10" onClick={() => onDeleteOdo(o)} aria-label={`${t('delete')}: ${formatDate(o.date)}`}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
