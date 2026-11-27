import React from 'react';
import { Plus, BatteryCharging, SlidersHorizontal, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import ChargeList from '../components/ChargeList.jsx';
import PeriodBar from '../components/PeriodBar.jsx';
import { Logo } from '../components/Brand.jsx';
import CycleStrip, { MAX_STRIP_DAYS } from '../components/CycleStrip.jsx';
import { Empty, NumUnit, Delta, SectionTitle, C } from '../components/ui.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { usePeriod, useCurrentCycle, useBackupStatus } from '../state/derived.js';
import { tierLevel, tierOn } from '../lib/tiers.js';
import { addDays } from '../lib/cycle.js';
import { num, fix, todayStr, daysInclusive } from '../lib/format.js';

/** الترويسة في الرئيسية فقط (V7): الشعار والتحية والسيارة. شريحة اليوم انتقلت إلى بطاقة الطاقة */
export function HomeHeader() {
  const { state: { settings }, t } = useStore();
  const name = settings.userName.trim();
  return (
    <header className="safe-top px-4 pt-4" data-testid="home-header">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-bold leading-tight" data-testid="greeting">{name ? t('hello_name', { name }) : t('hello')}</p>
          <p className="truncate text-sm text-slate-400"><bdi dir="ltr">{settings.carName} {settings.carModel}</bdi></p>
        </div>
        <Logo size={48} />
      </div>
    </header>
  );
}

/** شريحة اليوم وكم يوم باقي للمرتفعة (أو لنهاية الدورة إن كنا فيها أو لن نصلها) */
function TierNow() {
  const { state: { settings, charges, bills }, t } = useStore();
  const cyc = useCurrentCycle();
  if (!cyc.day) return null;
  const level = tierLevel(cyc.tier, cyc.nTiers);
  const today = todayStr();
  let toHigh = null;
  if (level !== 'high') {
    for (let k = 1; k <= cyc.day.m - cyc.day.n; k++) {
      if (tierLevel(tierOn(addDays(today, k), charges, settings, bills), cyc.nTiers) === 'high') { toHigh = k; break; }
    }
  }
  const left = cyc.day.m - cyc.day.n;
  const hint = toHigh != null
    ? (toHigh === 1 ? t('high_in_one') : t('high_in', { d: toHigh }))
    : left === 0 ? t('cycle_ends_today') : left === 1 ? t('cycle_ends_tomorrow') : t('cycle_ends_in', { d: left });
  return (
    <div className="min-w-0 text-end" data-testid="today-tier">
      <div className="text-xs hero-soft">{t('day_n_of_m', { n: cyc.day.n, m: cyc.day.m })}</div>
      <div className="mt-0.5 text-base font-bold leading-snug">{t(`tier_${level}_full`)}</div>
      <div className="text-xs hero-soft" data-testid="tier-hint">{hint}</div>
    </div>
  );
}

function Hero() {
  const { state: { settings, bills, charges }, t } = useStore();
  const p = usePeriod();
  const { stat } = p;
  const today = todayStr();
  const total = stat.homeEnergy + stat.fastEnergy;
  const homePct = total > 0 ? (stat.homeEnergy / total) * 100 : 0;
  // «كل الفترة» تمتد حتى اليوم في الشريط (لا تقف عند آخر شحنة)
  const range = p.period.all && p.range ? { start: p.range.start, end: p.range.end > today ? p.range.end : today } : p.range;
  const long = !range || daysInclusive(range.start, range.end) > MAX_STRIP_DAYS;
  const sub = p.last ? (p.last.daysAgo === 0 ? t('last_today', { p: num(p.last.after, 0) }) : p.last.daysAgo === 1 ? t('last_ago_one', { p: num(p.last.after, 0) }) : t('last_ago', { d: p.last.daysAgo, p: num(p.last.after, 0) })) : null;
  const kindWord = t(p.period.kind === 'cycle' ? 'vs_prev_cycle' : p.period.kind === 'month' ? 'vs_prev_month' : 'vs_prev_period');
  return (
    <section className="hero p-4" data-section="hero">
      <PeriodBar period={p.period} variant="hero">{sub}</PeriodBar>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium hero-soft">{t('hero_energy')}</div>
          <NumUnit value={num(stat.energy, 1)} unit="kWh" className="mt-1 font-bold leading-none tracking-tight" valueClass="hero-num text-[3.2rem]" unitClass="text-base font-medium hero-soft" testid="total-energy" />
          {p.energyDelta != null && <div className="mt-1.5"><Delta pct={p.energyDelta} label={kindWord} className="!text-xs" /></div>}
        </div>
        {p.isCurrent && <TierNow />}
      </div>
      <CycleStrip range={range} charges={p.list} all={charges} settings={settings} bills={bills} today={today} t={t} />
      {long && total > 0 && (
        <div className="mt-4 flex h-2 gap-1 overflow-hidden" dir="ltr">
          {stat.fastEnergy > 0 && <span className="rounded-full" style={{ width: `${100 - homePct}%`, background: C.fast }} />}
          {stat.homeEnergy > 0 && <span className="rounded-full" style={{ width: `${homePct}%`, background: C.home }} />}
        </div>
      )}
      {total > 0 && (
        <div className="tabular mt-3 flex gap-5 text-sm" data-testid="type-split">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: C.home }} />{t('type_home_s')} <b className="font-bold"><bdi dir="ltr">{num(stat.homeEnergy, 1)}</bdi></b></span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: C.fast }} />{t('type_fast_s')} <b className="font-bold"><bdi dir="ltr">{num(stat.fastEnergy, 1)}</bdi></b></span>
        </div>
      )}
      {p.forecast != null && (
        <p className="mt-4 border-t pt-3 text-sm hero-soft" style={{ borderColor: 'rgb(var(--hero-fg) / 0.1)' }} data-testid="forecast">
          {t('forecast_lead')}<b className="tabular font-bold" style={{ color: 'rgb(var(--hero-fg))' }}><bdi dir="ltr">{num(p.forecast, 0)} kWh</bdi></b>{t(p.period.kind === 'cycle' ? 'forecast_tail_cycle' : 'forecast_tail_period')}
        </p>
      )}
    </section>
  );
}

function Stat({ label, children, testid, sub }) {
  return (
    <div className="min-w-0 px-3 first:ps-0 [&+&]:border-s [&+&]:border-white/10" data-testid={testid}>
      <div className="truncate text-xs text-slate-400">{label}</div>
      <div className="tabular mt-1 text-xl font-bold leading-tight">{children}</div>
      {sub}
    </div>
  );
}

function Stats() {
  const { state: { settings }, t } = useStore();
  const p = usePeriod();
  return (
    <section className="grid grid-cols-3 px-1" data-section="stats">
      <Stat label={t('kpi_cost')} testid="cost-card" sub={<Delta pct={p.costDelta} label="" tone="cost" className="!text-xs" />}>
        <span data-testid="total-cost">{fix(p.stat.cost, 2)}</span> <span className="text-xs font-normal text-slate-400">{settings.currency}</span>
      </Stat>
      <Stat label={t('charges_count')} testid="count-card">{p.stat.count}</Stat>
      {p.avgPerCharge != null && <Stat label={t('avg_per_charge')}>{num(p.avgPerCharge, 1)} <span className="text-xs font-normal text-slate-400">kWh</span></Stat>}
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
