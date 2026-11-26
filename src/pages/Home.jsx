import React from 'react';
import { Plus, BatteryCharging, SlidersHorizontal, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import ChargeList from '../components/ChargeList.jsx';
import PeriodBar from '../components/PeriodBar.jsx';
import { Logo, CycleRing } from '../components/Brand.jsx';
import { Empty, NumUnit, Delta, SectionTitle, C } from '../components/ui.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { usePeriod, useLastMonths, useCurrentCycle, useBackupStatus } from '../state/derived.js';
import { tierLevel } from '../lib/tiers.js';
import { monthShort, num, fix } from '../lib/format.js';

/** الترويسة الكاملة في الرئيسية فقط (V7): الشعار، التحية، الموديل والبطارية، شريحة اليوم، حلقة الدورة */
export function HomeHeader() {
  const { state: { settings }, t } = useStore();
  const cyc = useCurrentCycle();
  const name = settings.userName.trim();
  return (
    <header className="safe-top px-4 pt-4" data-testid="home-header">
      <div className="flex items-center gap-3">
        {cyc.day && <CycleRing n={cyc.day.n} m={cyc.day.m} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-bold leading-tight" data-testid="greeting">{name ? t('hello_name', { name }) : t('hello')}</p>
          <p className="truncate text-sm text-slate-400"><bdi dir="ltr">{settings.carName} {settings.carModel} · {num(settings.capacity, 2)} kWh</bdi></p>
          <p className="truncate text-sm text-slate-400" data-testid="today-tier">
            {t('today_tier')} <b className="font-bold" style={{ color: C.fast }}>{t(`tier_${tierLevel(cyc.tier, cyc.nTiers)}_full`)}</b>
          </p>
        </div>
        <Logo size={52} />
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useStore();
  const p = usePeriod();
  const months = useLastMonths();
  const max = Math.max(1, ...months.map((m) => m.energy));
  const { stat } = p;
  const total = stat.homeEnergy + stat.fastEnergy;
  const homePct = total > 0 ? (stat.homeEnergy / total) * 100 : 0;
  const sub = p.last ? (p.last.daysAgo === 0 ? t('last_today', { p: num(p.last.after, 0) }) : t('last_ago', { d: p.last.daysAgo, p: num(p.last.after, 0) })) : null;
  const kindWord = t(p.period.kind === 'cycle' ? 'vs_prev_cycle' : p.period.kind === 'month' ? 'vs_prev_month' : 'vs_prev_period');
  return (
    <section className="hero p-4" data-section="hero">
      <PeriodBar period={p.period} variant="hero">{sub}</PeriodBar>
      <div className="mt-4 flex items-end justify-between gap-3">
        {months.length > 0 && (
          <div dir="ltr" className="flex items-end gap-2.5" aria-label={t('ch_title')}>
            {months.map((m, i) => (
              <div key={m.key} className="flex flex-col items-center gap-1.5">
                <div className="w-2.5 rounded-full" style={{ height: `${Math.max(10, (m.energy / max) * 52)}px`, background: i === months.length - 1 ? 'rgb(var(--hero-num))' : 'rgb(var(--hero-fg) / 0.28)' }} />
                <span className="text-xs font-bold hero-soft">{monthShort(m.key, 'en', false)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="text-end">
          <div className="text-sm font-medium hero-soft">{t('hero_energy')}</div>
          <NumUnit value={num(stat.energy, 1)} unit="kWh" className="mt-1 font-bold leading-none tracking-tight" valueClass="hero-num text-[4.5rem]" unitClass="text-lg font-bold hero-soft" testid="total-energy" />
        </div>
      </div>
      {p.energyDelta != null && (
        <div className="mt-2 flex justify-end"><span className="hero-panel rounded-full px-3 py-1"><Delta pct={p.energyDelta} label={kindWord} /></span></div>
      )}
      {total > 0 && (
        <div className="mt-4" data-testid="type-split">
          <div className="flex h-2 gap-1 overflow-hidden" dir="ltr">
            {stat.fastEnergy > 0 && <span className="rounded-full" style={{ width: `${100 - homePct}%`, background: C.fast }} />}
            {stat.homeEnergy > 0 && <span className="rounded-full" style={{ width: `${homePct}%`, background: C.home }} />}
          </div>
          <div className="tabular mt-2 flex justify-between text-sm font-bold">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: C.home }} />{t('type_home_s')} <bdi dir="ltr">{num(stat.homeEnergy, 1)} kWh</bdi></span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: C.fast }} />{t('type_fast_s')} <bdi dir="ltr">{num(stat.fastEnergy, 1)} kWh</bdi></span>
          </div>
        </div>
      )}
      {p.forecast != null && (
        <div className="hero-panel mt-4 rounded-2xl px-4 py-2.5 text-sm" data-testid="forecast">
          {t(p.period.kind === 'cycle' ? 'forecast_cycle' : 'forecast_period')} ≈ <b className="tabular" dir="ltr">{num(p.forecast, 0)} kWh</b>
          <span className="hero-soft"> · {t('day_n_of_m', { n: p.day.n, m: p.day.m })}</span>
        </div>
      )}
    </section>
  );
}

function Stats() {
  const { state: { settings }, t } = useStore();
  const p = usePeriod();
  return (
    <section className="grid grid-cols-2 gap-3" data-section="stats">
      <div className="card px-4 py-4" data-testid="cost-card">
        <div className="text-sm font-medium text-slate-400">{t('kpi_cost')}</div>
        <div className="tabular mt-2 text-[1.9rem] font-bold leading-none" data-testid="total-cost">{fix(p.stat.cost, 2)} <span className="text-base font-medium text-slate-400">{settings.currency}</span></div>
        <div className="mt-2 min-h-5"><Delta pct={p.costDelta} label={t('vs_prev_short')} tone="cost" className="!text-sm" /></div>
      </div>
      <div className="card px-4 py-4" data-testid="count-card">
        <div className="text-sm font-medium text-slate-400">{t('charges_count')}</div>
        <div className="tabular mt-2 text-[1.9rem] font-bold leading-none">{p.stat.count} <span className="text-base font-medium text-slate-400">{t('charges_word', { n: p.stat.count })}</span></div>
        {p.avgPerCharge != null && <div className="tabular mt-2 text-sm font-bold text-slate-400">{t('avg_per_charge')} <bdi dir="ltr">{num(p.avgPerCharge, 1)} kWh</bdi></div>}
      </div>
    </section>
  );
}

function BillCard() {
  const { state: { settings }, t, lang } = useStore();
  const rtl = lang === 'ar';
  const ui = useUi();
  const cyc = useCurrentCycle();
  const Chev = rtl ? ChevronLeft : ChevronRight;
  return (
    <button type="button" className="card flex w-full items-center justify-between gap-3 px-4 py-4 text-start" onClick={() => ui.setTab('bill')} data-section="bill" data-testid="bill-card">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-400">{t('bill_card_title')}</span>
        <span className="tabular mt-1 block text-2xl font-bold">≈ {fix(cyc.impact, 2)} <span className="text-base font-medium text-slate-400">{settings.currency}</span></span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-accent">{t('details')} <Chev size={16} /></span>
    </button>
  );
}

function Recent() {
  const { state: { settings }, t } = useStore();
  const ui = useUi();
  const p = usePeriod();
  return (
    <section className="space-y-3" data-section="recent">
      <SectionTitle extra={<button className="text-sm font-bold text-accent" onClick={() => ui.setTab('list')} data-testid="view-all">{t('view_all_n', { n: p.list.length })}</button>}>{t('recent_title')}</SectionTitle>
      {p.sortedDesc.length === 0
        ? <div className="card px-4 py-5 text-center text-sm text-slate-400">{t('sum_empty')}</div>
        : <ChargeList charges={p.sortedDesc.slice(0, settings.recentCount)} numbers={p.numbers} settings={settings} onOpen={ui.openDetail} />}
    </section>
  );
}

function BackupAlert() {
  const { t } = useStore();
  const ui = useUi();
  const b = useBackupStatus();
  if (!b.stale) return null;
  return (
    <button type="button" className="flex w-full items-center gap-3 rounded-[1.5rem] bg-fast/12 px-4 py-3 text-start text-fast" style={{ background: 'color-mix(in srgb, rgb(var(--fast)) 13%, transparent)' }}
      onClick={() => { ui.setTab('settings'); setTimeout(() => ui.setSettingsPage('data'), 0); }} data-testid="backup-alert">
      <ShieldAlert size={20} className="shrink-0" />
      <span className="text-sm font-bold">{b.last ? t('backup_stale', { d: b.days }) : t('backup_never')}</span>
    </button>
  );
}

// أقسام الصفحة الرئيسية تُرسم بالترتيب المحفوظ في الإعدادات (H14)
const SECTIONS = { hero: Hero, stats: Stats, bill: BillCard, recent: Recent };

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
      <BackupAlert />
      {settings.homeLayout.filter((s) => s.visible && SECTIONS[s.id]).map((s) => {
        const Section = SECTIONS[s.id];
        return <Section key={s.id} />;
      })}
      <div className="flex justify-center pt-1">
        <button className="chip !bg-ink-800 !px-5 !py-2.5" onClick={() => ui.openSheet('customize')} data-testid="customize">
          <SlidersHorizontal size={16} /> {t('customize_home')}
        </button>
      </div>
    </>
  );
}
