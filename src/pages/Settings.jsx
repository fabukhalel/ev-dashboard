// الإعدادات (S1–S7): حالة النسخ الاحتياطي في الأعلى، ثم 5 بنود لكل منها صفحة.
import React, { useEffect, useRef, useState } from 'react';
import {
  Car, Zap, Palette, Database, Info, Download, Upload, Share2, History, FileSpreadsheet, FileText, FlaskConical, Trash2,
  Gauge, ShieldCheck, ShieldAlert, SlidersHorizontal, RefreshCw,
} from 'lucide-react';
import { PageTitle, Segmented, ListRow, NavArrow, C } from '../components/ui.jsx';
import DateField from '../components/DateField.jsx';
import About from './About.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { useBackupStatus, usePeriod } from '../state/derived.js';
import { pushBack } from '../lib/backStack.js';
import { TARIFF_PLANS } from '../lib/tariff.js';
import { countOld } from '../lib/tiers.js';
import { PALETTES } from '../lib/theme.js';
import { backupDate } from '../lib/autoBackup.js';
import { MIN_FONT_PX, MAX_FONT_PX, MIN_CAPACITY, MAX_CAPACITY, RECENT_COUNTS } from '../lib/storage.js';
import { parseNum, formatDate, ymd, num } from '../lib/format.js';

function NumField({ id, label, value, onCommit, hint, min = 0, max = Infinity, suffix }) {
  const [text, setText] = useState(String(value));
  const [bad, setBad] = useState(false);
  useEffect(() => { setText(String(value)); }, [value]);
  const commit = () => {
    const n = parseNum(text);
    if (n == null || n < min || n > max) { setBad(true); return; }
    setBad(false);
    if (n !== value) onCommit(n);
  };
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input id={id} inputMode="decimal" className={`field tabular ${bad ? '!border-danger/60' : ''}`} value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} aria-invalid={bad} />
        {suffix && <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-sm leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

const Group = ({ title, children }) => (
  <section className="space-y-2">
    {title && <h3 className="px-1 text-base font-bold text-slate-300">{title}</h3>}
    <div className="card space-y-4 p-4">{children}</div>
  </section>
);

function CarPage() {
  const { state: { settings }, t, actions } = useStore();
  const ui = useUi();
  const set = (k) => (e) => actions.changeSettings({ [k]: e.target.value });
  return (
    <>
      <Group>
        <div>
          <label className="label" htmlFor="s-username">{t('user_name')}</label>
          <input id="s-username" className="field" maxLength={24} value={settings.userName} onChange={set('userName')} placeholder={t('user_name_ph')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="s-name">{t('car_name')}</label><input id="s-name" className="field" maxLength={40} value={settings.carName} onChange={set('carName')} /></div>
          <div><label className="label" htmlFor="s-model">{t('car_model')}</label><input id="s-model" className="field" maxLength={40} value={settings.carModel} onChange={set('carModel')} /></div>
        </div>
        <NumField id="s-cap" label={t('capacity_label')} value={settings.capacity} min={MIN_CAPACITY} max={MAX_CAPACITY} suffix="kWh" onCommit={(n) => actions.changeSettings({ capacity: n })} hint={t('capacity_hint')} />
        <div><label className="label" htmlFor="s-cur">{t('currency_label')}</label><input id="s-cur" className="field" maxLength={10} value={settings.currency} onChange={set('currency')} /></div>
      </Group>
      <button className="btn-ghost w-full py-3" onClick={() => ui.openOdo(null)} data-testid="settings-add-odo"><Gauge size={16} /> {t('odo_add_long')}</button>
    </>
  );
}

function PowerPage() {
  const { state: { settings, charges }, t, actions } = useStore();
  const tariff = settings.tariff;
  const setTariff = (patch) => actions.changeSettings({ tariff: { ...tariff, ...patch } });
  const setPlan = (plan) => (plan === 'custom' ? setTariff({ plan }) : setTariff({ plan, tiers: TARIFF_PLANS[plan].map((x) => ({ ...x })) }));
  const setTier = (i, patch) => setTariff({ plan: 'custom', tiers: tariff.tiers.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const old = countOld(charges);
  return (
    <>
      <Group title={t('tariff_title')}>
        <Segmented value={tariff.plan} onChange={setPlan} options={[{ value: 'subsidized', label: t('plan_sub') }, { value: 'unsubsidized', label: t('plan_unsub') }, { value: 'custom', label: t('plan_custom') }]} />
        <div className="space-y-2">
          {tariff.tiers.map((x, i) => {
            const last = i === tariff.tiers.length - 1;
            return (
              <div key={`${tariff.plan}-${i}`} className="grid grid-cols-2 gap-3">
                {last
                  ? <div><span className="label">{t('tier_last')}</span><div className="field tabular text-slate-500">{t('tier_above', { a: num(tariff.tiers[i - 1].upTo, 0) })}</div></div>
                  : <NumField id={`t-up-${i}`} label={t('tier_limit')} value={x.upTo} min={1} suffix="kWh" onCommit={(n) => setTier(i, { upTo: n })} />}
                <NumField id={`t-rate-${i}`} label={t('tier_rate')} value={Math.round(x.rate * 10000) / 10} min={0} suffix={t('fils')} onCommit={(n) => setTier(i, { rate: n / 1000 })} />
              </div>
            );
          })}
        </div>
        <DateField id="t-from" label={t('tariff_from')} value={tariff.effectiveFrom || ''} onChange={(v) => setTariff({ effectiveFrom: v })} />
        <p className="text-sm leading-relaxed text-slate-500">{t('tariff_from_hint')}</p>
      </Group>
      <Group title={t('cycle_settings')}>
        <div>
          <label className="label" htmlFor="s-cycle">{t('cycle_day')}</label>
          <select id="s-cycle" className="field" value={settings.cycleStartDay} onChange={(e) => actions.changeSettings({ cycleStartDay: Number(e.target.value) })}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <p className="mt-1 text-sm text-slate-500">{t('cycle_day_hint')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="s-low" label={t('tier_days_low')} value={settings.tierDays.low} min={0} max={20} suffix={t('days')} onCommit={(n) => actions.changeSettings({ tierDays: { ...settings.tierDays, low: Math.round(n) } })} />
          <NumField id="s-high" label={t('tier_days_high')} value={settings.tierDays.high} min={0} max={20} suffix={t('days')} onCommit={(n) => actions.changeSettings({ tierDays: { ...settings.tierDays, high: Math.round(n) } })} />
        </div>
        <p className="text-sm leading-relaxed text-slate-500">{t('tier_days_hint')}</p>
      </Group>
      <Group title={t('more_prices')}>
        <NumField id="s-fast" label={t('fast_price')} value={settings.fastPrice} min={0} suffix={settings.currency} onCommit={(n) => actions.changeSettings({ fastPrice: n })} />
        <NumField id="t-extra" label={t('tariff_extra')} value={tariff.extraFils} min={0} max={500} suffix={t('fils')} onCommit={(n) => setTariff({ extraFils: n })} hint={t('tariff_extra_hint')} />
        <NumField id="b-loss" label={t('bill_loss')} value={parseNum(settings.bill.loss) || 0} min={0} max={59} suffix="%" onCommit={(n) => actions.changeSettings({ bill: { ...settings.bill, loss: String(n) } })} hint={t('bill_loss_hint')} />
      </Group>
      {old > 0 && (
        <Group>
          <p className="text-sm leading-relaxed text-slate-400">{t('recalc_hint', { n: old })}</p>
          <button className="btn-ghost w-full" onClick={actions.adoptOldTiers} data-testid="recalc-old"><RefreshCw size={15} /> {t('recalc_btn')}</button>
        </Group>
      )}
      <p className="px-1 text-sm leading-relaxed text-slate-500">{t('tariff_src')}</p>
      <button className="btn-ghost w-full" onClick={actions.resetSettings}>{t('reset_defaults')}</button>
    </>
  );
}

function LookPage() {
  const { state: { settings }, t, actions } = useStore();
  const ui = useUi();
  return (
    <>
      <Group>
        <div><span className="label">{t('s_lang')}</span>
          <Segmented value={settings.lang} onChange={(v) => actions.changeSettings({ lang: v })} options={[{ value: 'ar', label: t('lang_ar') }, { value: 'en', label: t('lang_en') }]} />
        </div>
        <div><span className="label">{t('s_theme')}</span>
          <Segmented value={settings.theme} onChange={(v) => actions.changeSettings({ theme: v })} options={[{ value: 'dark', label: t('theme_dark') }, { value: 'light', label: t('theme_light') }, { value: 'system', label: t('theme_system') }]} />
        </div>
      </Group>
      <Group title={t('s_palette')}>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PALETTES).map(([id, p]) => (
            <button key={id} type="button" aria-pressed={settings.palette === id} data-palette-choice={id} onClick={() => actions.changeSettings({ palette: id })}
              className={`rounded-2xl p-3 text-start ring-2 transition ${settings.palette === id ? 'ring-accent' : 'ring-transparent'} bg-ink-900`}>
              <span className="flex h-14 items-end gap-1.5 rounded-xl p-2" style={{ background: p.preview[0] }}>
                <span className="h-6 w-2 rounded-full" style={{ background: p.preview[1] }} />
                <span className="h-9 w-2 rounded-full" style={{ background: p.preview[1] }} />
                <span className="h-4 w-2 rounded-full" style={{ background: p.preview[2] }} />
              </span>
              <span className="mt-2 block font-bold" style={{ fontFamily: p.font }}>{t(`pal_${id}`)}</span>
              <span className="block text-xs text-slate-400">{t(`pal_${id}_sub`)}</span>
            </button>
          ))}
        </div>
      </Group>
      <Group>
        <div>
          <label className="label" htmlFor="s-fontsize">{t('font_size_val', { v: `${settings.fontPx}px` })}</label>
          <input id="s-fontsize" type="range" min={MIN_FONT_PX} max={MAX_FONT_PX} step="0.5" value={settings.fontPx} onChange={(e) => actions.changeSettings({ fontPx: Number(e.target.value) })} className="w-full accent-[rgb(var(--accent))]" />
        </div>
        <div><span className="label">{t('recent_count')}</span>
          <Segmented value={settings.recentCount} onChange={(v) => actions.changeSettings({ recentCount: v })} options={RECENT_COUNTS.map((n) => ({ value: n, label: String(n) }))} />
        </div>
        <button className="btn-ghost w-full" onClick={() => ui.openSheet('customize')}><SlidersHorizontal size={16} /> {t('customize_home')}</button>
      </Group>
    </>
  );
}

function DataPage() {
  const { state: { charges }, t, actions, autoBackups } = useStore();
  const { period } = usePeriod();
  const fileRef = useRef(null);
  const count = charges.length;
  return (
    <>
      <BackupStatus />
      <Group title={t('s_backup')}>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary" onClick={actions.exportBackup} data-testid="backup-now"><Download size={16} /> {t('backup')}</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> {t('restore')}</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) actions.importBackup(f); e.target.value = ''; }} />
        {autoBackups && (
          <div className="space-y-2" data-testid="auto-backups">
            <p className="flex items-center gap-1.5 text-sm font-bold"><ShieldCheck size={16} className="text-accent" /> {t('ab_title')}</p>
            <p className="text-sm text-slate-400">{t('ab_hint')}</p>
            {autoBackups.list.map((name) => (
              <div key={name} className="flex items-center justify-between gap-2 rounded-2xl bg-ink-900 px-3 py-2 text-sm">
                <span dir="ltr" className="tabular font-bold">{formatDate(backupDate(name))}</span>
                <span className="flex gap-1.5">
                  <button type="button" className="btn-ghost !bg-ink-800 !px-3 !py-1.5 text-xs" onClick={() => actions.shareAutoBackup(name)}><Share2 size={14} /> {t('ab_share')}</button>
                  <button type="button" className="btn-ghost !bg-ink-800 !px-3 !py-1.5 text-xs" onClick={() => actions.restoreAutoBackup(name)}><History size={14} /> {t('ab_restore')}</button>
                </span>
              </div>
            ))}
            <button type="button" className="btn-ghost w-full" onClick={actions.autoBackupNow} disabled={!count}>{t('ab_now')}</button>
          </div>
        )}
      </Group>
      <Group title={t('s_export')}>
        <button className="btn-ghost w-full" onClick={() => actions.exportPdf(period)} disabled={!count} data-testid="export-pdf"><FileText size={17} /> {t('export_pdf')}</button>
        <button className="btn-ghost w-full" onClick={actions.exportCsv} disabled={!count}><FileSpreadsheet size={17} /> {t('export_csv')}</button>
      </Group>
      <Group title={t('s_danger')}>
        <button className="btn-ghost w-full" onClick={actions.loadDemo}><FlaskConical size={16} /> {t('load_demo')}</button>
        <button className="btn-danger w-full" onClick={actions.clearAll} disabled={!count} data-testid="clear-all"><Trash2 size={16} /> {t('clear_all')}</button>
      </Group>
    </>
  );
}

function BackupStatus() {
  const { t } = useStore();
  const ui = useUi();
  const b = useBackupStatus();
  const Icon = b.stale ? ShieldAlert : ShieldCheck;
  const color = b.stale ? C.fast : C.home;
  return (
    <button type="button" className="card flex w-full items-center gap-3 px-4 py-4 text-start" onClick={() => ui.setSettingsPage('data')} data-testid="backup-status">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}><Icon size={20} /></span>
      <span className="min-w-0">
        <span className="block font-bold">{t('backup_status')}</span>
        <span className="block text-sm text-slate-400">{b.last ? t('backup_last', { d: formatDate(ymd(new Date(b.last))) }) : t('backup_none')}</span>
      </span>
    </button>
  );
}

const PAGES = {
  car: { icon: Car, title: 'set_car', sub: 'set_car_sub', tint: C.home, Page: CarPage },
  power: { icon: Zap, title: 'set_power', sub: 'set_power_sub', tint: C.fast, Page: PowerPage },
  look: { icon: Palette, title: 'set_look', sub: 'set_look_sub', tint: C.accent, Page: LookPage },
  data: { icon: Database, title: 'set_data', sub: 'set_data_sub', tint: C.home, Page: DataPage },
  about: { icon: Info, title: 'set_about', sub: 'set_about_sub', tint: C.fast, Page: About },
};

export default function Settings() {
  const { t, settingsKey } = useStore();
  const ui = useUi();
  const page = PAGES[ui.settingsPage];
  // زر الرجوع في أندرويد يعود من الصفحة الفرعية إلى القائمة
  useEffect(() => {
    if (!page) return undefined;
    window.scrollTo({ top: 0 });
    return pushBack(() => ui.setSettingsPage(null));
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  if (page) {
    const { Page } = page;
    return (
      <div key={settingsKey} className="space-y-4" data-testid={`settings-${ui.settingsPage}`}>
        <PageTitle title={t(page.title)}>
          <NavArrow dir={-1} label={t('back')} className="bg-ink-800" onClick={() => ui.setSettingsPage(null)} />
        </PageTitle>
        <Page />
      </div>
    );
  }
  return (
    <>
      <PageTitle title={t('tab_settings')} />
      <BackupStatus />
      <div className="card row-divide overflow-hidden">
        {Object.entries(PAGES).map(([id, p]) => (
          <ListRow key={id} icon={p.icon} tint={p.tint} title={t(p.title)} sub={t(p.sub)} onClick={() => ui.setSettingsPage(id)} testid={`set-${id}`} />
        ))}
      </div>
    </>
  );
}
