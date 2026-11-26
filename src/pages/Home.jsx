import React from 'react';
import { Zap, Wallet, Plus, BatteryCharging, SlidersHorizontal, Gauge } from 'lucide-react';
import { ChargeRow } from '../components/ChargeList.jsx';
import { Empty, C } from '../components/ui.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { usePeriod } from '../state/derived.js';
import { monthShort, num, fix, formatDate } from '../lib/format.js';

function SummarySection() {
  const { state: { settings, bills }, t, notify, actions } = useStore();
  const ui = useUi();
  const { period, summary, stat, lastMonths, range } = usePeriod();
  const isBill = period.mode === 'bill';
  const maxMonthEnergy = Math.max(1, ...lastMonths.map((m) => m.energy));
  const kindChip = (active) => `rounded-full px-3 py-1.5 text-xs font-extrabold transition ${active ? 'hero-chip' : 'opacity-80 hover:opacity-100'}`;
  return (
    <>
      <section className="hero p-4" data-section="summary">
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0" data-testid="period-range">
            {range ? (
              <div className="tabular text-[0.95rem] font-extrabold leading-snug">
                {t('period_from')} <bdi dir="ltr">{formatDate(range.start)}</bdi> {t('period_to')} <bdi dir="ltr">{formatDate(range.end)}</bdi>
              </div>
            ) : (
              <div className="text-[0.95rem] font-extrabold">{t('period_all')}</div>
            )}
          </div>
          <button className="hero-chip shrink-0 px-3.5 py-1.5 text-xs" onClick={() => ui.openSheet('period')} data-testid="period-change">{t('period_change_long')}</button>
        </div>

        <div className="relative mt-2.5 flex gap-1.5" role="group" aria-label={t('period_kind')}>
          <button type="button" aria-pressed={!isBill} className={kindChip(!isBill)} onClick={() => actions.changeSettings({ periodMode: 'month' })} data-testid="kind-month">{t('kind_month')}</button>
          <button
            type="button" aria-pressed={isBill} className={kindChip(isBill)} data-testid="kind-bill"
            onClick={() => (bills.length ? actions.changeSettings({ periodMode: 'bill' }) : (notify(t('no_bills_toast')), ui.setTab('bill')))}
          >{t('kind_bill')}</button>
        </div>

        <div className="relative mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold hero-soft"><Zap size={14} /> {t('kpi_energy')}</div>
            <div className="tabular mt-0.5 flex items-baseline gap-1.5" dir="ltr">
              <span className="text-[3.6rem] font-extrabold leading-none tracking-tight" data-testid="total-energy">{num(summary.energy, 1)}</span>
              <span className="text-base font-bold hero-soft">kWh</span>
            </div>
          </div>
          {lastMonths.length > 0 && (
            <div dir="ltr" className="flex items-end gap-2" aria-label={t('ch_title')}>
              {lastMonths.map((m, i) => (
                <div key={m.key} className="flex flex-col items-center gap-1">
                  <div className="w-[1.15rem] rounded-t-md" style={{ height: `${Math.max(8, (m.energy / maxMonthEnergy) * 46)}px`, background: 'rgb(255 255 255 / ' + (i === lastMonths.length - 1 ? '0.95' : '0.5') + ')' }} />
                  <span className="text-[0.6rem] font-bold hero-soft">{monthShort(m.key, 'en', false)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tabular relative mt-3 text-xs hero-soft">
          {stat.distance != null ? (
            <span data-testid="hero-distance">
              {t('hero_distance')} <bdi dir="ltr" className="font-extrabold">{stat.estimated ? '≈ ' : ''}{num(stat.distance, 0)} {t('km')}</bdi>
              {stat.efficiency != null && <> · <bdi dir="ltr" className="font-extrabold">{fix(stat.efficiency, 1)} kWh/100km</bdi></>}
            </span>
          ) : (
            <button type="button" className="inline-flex items-center gap-1 font-bold underline decoration-dotted underline-offset-4" onClick={() => ui.openSheet('odo')}>
              <Gauge size={13} /> {t('hero_add_odo')}
            </button>
          )}
        </div>
      </section>

      <section className="card flex items-center justify-between gap-3 px-4 py-3" data-testid="cost-card">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Wallet size={14} style={{ color: C.home }} /> {t('kpi_cost')}</div>
          <div className="tabular mt-0.5 text-[1.9rem] font-extrabold leading-none" data-testid="total-cost">{fix(summary.cost, 2)} <span className="text-sm font-bold text-slate-400">{settings.currency}</span></div>
        </div>
        <div className="tabular text-end text-xs font-bold text-slate-400">{summary.count ? t('charges_n', { n: summary.count }) : t('sum_empty')}</div>
      </section>
    </>
  );
}

function RecentSection() {
  const { state: { settings }, t } = useStore();
  const ui = useUi();
  const { recent, periodCharges } = usePeriod();
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-extrabold">{t('recent_title')}</h3>
        <button className="text-xs font-extrabold text-accent" onClick={() => { ui.setMonth('all'); ui.setChargesView('list'); ui.setTab('list'); }} data-testid="view-all">{t('view_all_n', { n: periodCharges.length })}</button>
      </div>
      {recent.length === 0 && <div className="card px-4 py-5 text-center text-sm text-slate-400">{t('sum_empty')}</div>}
      {recent.map((c) => <ChargeRow key={c.id} c={c} currency={settings.currency} onEdit={ui.openEdit} />)}
    </section>
  );
}

// أقسام الصفحة الرئيسية تُرسم بالترتيب المحفوظ في الإعدادات
const SECTIONS = { summary: SummarySection, charges: RecentSection };

export default function Home() {
  const { state: { settings, charges }, t, actions } = useStore();
  const ui = useUi();
  if (charges.length === 0) {
    return (
      <Empty icon={BatteryCharging} title={t('welcome_title')} hint={t('welcome_hint')}>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn-primary" onClick={ui.openAdd}><Plus size={17} /> {t('add_charge')}</button>
          <button className="btn-ghost" onClick={actions.loadDemo}>{t('demo_btn')}</button>
        </div>
      </Empty>
    );
  }
  return (
    <>
      <div className="flex justify-end">
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => ui.openSheet('customize')}>
          <SlidersHorizontal size={14} /> {t('customize')}
        </button>
      </div>
      {settings.homeLayout.filter((s) => s.visible && SECTIONS[s.id]).map((s) => {
        const Section = SECTIONS[s.id];
        return <Section key={s.id} />;
      })}
    </>
  );
}
