import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard, ListOrdered, BarChart3, Receipt, Settings, Zap, Wallet, Plus, Download, BatteryCharging, ChevronDown, SlidersHorizontal, Gauge,
} from 'lucide-react';
import ChargeList, { ChargeRow } from './components/ChargeList.jsx';
import Analysis from './components/Analysis.jsx';
import PeriodSheet from './components/PeriodSheet.jsx';
import OdoSheet from './components/OdoSheet.jsx';
import ChargeForm from './components/ChargeForm.jsx';
import CalendarView from './components/CalendarView.jsx';
import BillImpact from './components/BillImpact.jsx';
import SettingsView from './components/SettingsView.jsx';
import HomeCustomizer from './components/HomeCustomizer.jsx';
import CarImage from './components/CarImage.jsx';
import { Empty, Toast, Segmented, C } from './components/ui.jsx';
import { useConfirm } from './components/ConfirmSheet.jsx';
import { I18nProvider, makeT } from './lib/i18n.jsx';
import { loadState, saveState, makeBackup, parseBackup, defaultSettings } from './lib/storage.js';
import { computeSegments, summarize, byMonth, sortChrono } from './lib/calc.js';
import { resolvePeriod, inPeriod } from './lib/period.js';
import { collectReadings } from './lib/odo.js';
import { periodStats } from './lib/analysis.js';
import { buildReportPdf } from './lib/report.js';
import { applyAppearance } from './lib/theme.js';
import { chargesToCsv, saveFile, saveBinary } from './lib/csv.js';
import { makeDemoCharges } from './lib/demo.js';
import { fileToSmallDataUrl } from './lib/image.js';
import { monthLabel, monthShort, todayStr, num, fix, formatDate } from './lib/format.js';

const TABS = [
  { id: 'home', key: 'tab_home', icon: LayoutDashboard },
  { id: 'list', key: 'tab_list', icon: ListOrdered },
  { id: 'analysis', key: 'tab_analysis', icon: BarChart3 },
  { id: 'bill', key: 'tab_bill', icon: Receipt },
  { id: 'settings', key: 'tab_settings', icon: Settings },
];

const CURRENCY_BY_LANG = { ar: 'د.أ', en: 'JOD' };

export default function App() {
  // أول فتح: نعرض بيانات تجريبية موسومة بوضوح حتى يرى المستخدم ما يفعله التطبيق
  const [state, setState] = useState(() => {
    const s = loadState();
    if (s.fresh) return { settings: s.settings, charges: makeDemoCharges(s.settings.capacity, s.settings), bills: [], odos: [], demo: true };
    return { settings: s.settings, charges: s.charges, bills: s.bills, odos: s.odos, demo: s.demo };
  });
  const { settings, charges, bills, odos } = state;
  const lang = settings.lang;
  const t = useMemo(() => makeT(lang), [lang]);

  const [ask, confirmNode] = useConfirm();
  const [tab, setTab] = useState('home');
  const [month, setMonth] = useState('all'); // 'all' | 'YYYY-MM'
  const [typeFilter, setTypeFilter] = useState('all'); // all | home | fast
  const [form, setForm] = useState({ open: false, charge: null });
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [chargesView, setChargesView] = useState('list'); // list | calendar
  const [periodOpen, setPeriodOpen] = useState(false);
  const [odoOpen, setOdoOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [settingsKey, setSettingsKey] = useState(0);
  const toastTimer = useRef(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  // اللغة والاتجاه وحجم الخط
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // الوضع الداكن/النهاري (تلقائي يتبع إعداد الجهاز) + الألوان والخط المخصصة
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const apply = () => {
      const eff = settings.theme === 'system' ? (mq && !mq.matches ? 'light' : 'dark') : settings.theme;
      root.dataset.theme = eff;
      applyAppearance(root, settings, eff);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', eff === 'light' ? '#eaf7fa' : '#07121f');
    };
    apply();
    if (settings.theme !== 'system' || !mq) return undefined;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme, settings.colors, settings.fontFamily, settings.fontPx]); // eslint-disable-line react-hooks/exhaustive-deps

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  // ---- البيانات المشتقة ----
  const allSegments = useMemo(() => computeSegments(charges, settings.capacity), [charges, settings.capacity]);

  const monthKeys = useMemo(() => {
    const set = new Set(charges.map((c) => c.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [charges]);

  // إن حُذفت كل شحنات الشهر المحدد نعود إلى "الكل"
  useEffect(() => {
    if (month !== 'all' && !monthKeys.includes(month)) setMonth('all');
  }, [month, monthKeys]);

  const inMonth = useCallback((date) => month === 'all' || date.startsWith(month), [month]);
  const monthCharges = useMemo(() => charges.filter((c) => inMonth(c.date)), [charges, inMonth]);
  const monthSegments = useMemo(() => allSegments.filter((s) => inMonth(s.date)), [allSegments, inMonth]);

  const viewCharges = useMemo(
    () => (typeFilter === 'all' ? monthCharges : monthCharges.filter((c) => c.type === typeFilter)),
    [monthCharges, typeFilter],
  );
  const viewSegments = useMemo(
    () => (typeFilter === 'all' ? monthSegments : monthSegments.filter((s) => s.type === typeFilter)),
    [monthSegments, typeFilter],
  );

  // فترة الاحتساب للصفحة الرئيسية (الشهر الحالي افتراضياً)
  const today = todayStr();
  const period = useMemo(() => resolvePeriod(settings, today, bills), [settings.periodMode, settings.periodStart, settings.periodEnd, settings.periodBillId, bills, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const periodCharges = useMemo(() => charges.filter((c) => inPeriod(c.date, period)), [charges, period]);
  const periodSegments = useMemo(() => allSegments.filter((s) => inPeriod(s.date, period)), [allSegments, period]);
  const periodSummary = useMemo(() => summarize(periodCharges, periodSegments), [periodCharges, periodSegments]);
  const months = useMemo(() => byMonth(charges, allSegments), [charges, allSegments]);
  const lastOdo = useMemo(() => {
    const withOdo = sortChrono(charges).filter((c) => c.odometer != null);
    return withOdo.length ? withOdo[withOdo.length - 1].odometer : null;
  }, [charges]);
  const recent = useMemo(() => sortChrono(periodCharges).reverse().slice(0, 4), [periodCharges]);
  const readings = useMemo(() => collectReadings(charges, odos), [charges, odos]);
  const periodStat = useMemo(() => periodStats(charges, readings, period), [charges, readings, period]);
  // حدود العرض: عند "الكل" نعرض أول وآخر شحنة
  const range = useMemo(() => {
    if (period.start) return { start: period.start, end: period.end };
    const ds = charges.map((c) => c.date).sort();
    return ds.length ? { start: ds[0], end: ds[ds.length - 1] } : null;
  }, [period, charges]);
  const lastMonths = useMemo(() => months.slice(-3), [months]);
  const effById = useMemo(() => new Map(allSegments.map((s) => [s.endId, s.efficiency])), [allSegments]);

  // ---- العمليات ----
  const openAdd = () => setForm({ open: true, charge: null });
  const openEdit = (c) => setForm({ open: true, charge: c });
  const closeForm = () => setForm({ open: false, charge: null });

  const saveCharge = (c) => {
    setState((s) => {
      // أول شحنة حقيقية تستبدل البيانات التجريبية
      if (s.demo && !s.charges.some((x) => x.id === c.id)) return { ...s, demo: false, charges: [c] };
      const exists = s.charges.some((x) => x.id === c.id);
      return { ...s, charges: exists ? s.charges.map((x) => (x.id === c.id ? c : x)) : [...s.charges, c] };
    });
    closeForm();
    notify(t('t_saved'));
  };

  const deleteCharge = (id) => {
    setState((s) => ({ ...s, charges: s.charges.filter((x) => x.id !== id) }));
    closeForm();
    notify(t('t_deleted'));
  };

  const requestDelete = async (c) => {
    if (await ask(t('confirm_del_one'), t('delete'))) deleteCharge(c.id);
  };

  const saveBill = (b) => {
    setState((s) => ({ ...s, bills: s.bills.some((x) => x.id === b.id) ? s.bills.map((x) => (x.id === b.id ? b : x)) : [...s.bills, b] }));
    notify(t('t_bill_saved'));
  };
  const deleteBill = async (b) => {
    if (!(await ask(t('confirm_del_bill'), t('delete')))) return;
    setState((s) => ({ ...s, bills: s.bills.filter((x) => x.id !== b.id) }));
    notify(t('t_bill_deleted'));
  };
  const saveOdo = (o) => {
    setState((s) => ({ ...s, odos: [...s.odos, { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, ...o }] }));
    setOdoOpen(false);
    notify(t('t_odo_saved'));
  };
  const deleteOdo = async (o) => {
    if (!(await ask(t('confirm_del_odo'), t('delete')))) return;
    setState((s) => ({ ...s, odos: s.odos.filter((x) => x.id !== o.id) }));
    notify(t('t_odo_deleted'));
  };

  const changeSettings = (patch) =>
    setState((s) => {
      const next = { ...s.settings, ...patch };
      // عند تبديل اللغة نبدّل رمز العملة الافتراضي فقط إن لم يغيّره المستخدم
      if (patch.lang && patch.lang !== s.settings.lang) {
        const other = patch.lang === 'ar' ? 'en' : 'ar';
        if (next.currency === CURRENCY_BY_LANG[other]) next.currency = CURRENCY_BY_LANG[patch.lang];
      }
      return { ...s, settings: next };
    });

  const resetSettings = () => {
    setState((s) => ({
      ...s,
      settings: {
        ...defaultSettings(),
        lang: s.settings.lang,
        theme: s.settings.theme,
        fontPx: s.settings.fontPx,
        fontFamily: s.settings.fontFamily,
        colors: s.settings.colors,
        currency: CURRENCY_BY_LANG[s.settings.lang],
      },
    }));
    setSettingsKey((k) => k + 1);
    notify(t('t_reset'));
  };

  const stamp = () => todayStr();

  const exportCsv = async () => {
    try {
      await saveFile(`ev-charges-${stamp()}.csv`, chargesToCsv(charges, t));
      notify(t('t_csv'));
    } catch {
      notify(t('t_csv_fail'));
    }
  };

  const exportPdf = async (p) => {
    try {
      const bytes = await buildReportPdf({ charges, bills, readings, settings, period: p || period, t, lang });
      await saveBinary(`ev-report-${stamp()}.pdf`, bytes, 'application/pdf');
      notify(t('t_pdf'));
    } catch {
      notify(t('t_pdf_fail'));
    }
  };

  const exportBackup = async () => {
    try {
      await saveFile(`ev-backup-${stamp()}.json`, makeBackup(state), 'application/json');
      notify(t('t_backup'));
    } catch {
      notify(t('t_backup_fail'));
    }
  };

  const importBackup = async (file) => {
    try {
      const data = parseBackup(await file.text());
      if (charges.length && !state.demo && !(await ask(t('confirm_replace', { n: data.charges.length }), t('replace')))) return;
      setState({ ...data, demo: false });
      setSettingsKey((k) => k + 1);
      notify(t('t_restored', { n: data.charges.length }));
    } catch (e) {
      notify(e instanceof SyntaxError ? t('t_bad_file') : e.message === 'invalid_backup' ? t('t_bad_backup') : t('t_bad_file'));
    }
  };

  const loadDemo = async () => {
    if (charges.length && !state.demo && !(await ask(t('confirm_demo'), t('replace')))) return;
    setState((s) => ({ ...s, demo: true, charges: makeDemoCharges(s.settings.capacity, s.settings) }));
    setMonth('all');
    notify(t('t_demo'));
  };

  const clearAll = async () => {
    if (!(await ask(t('confirm_clear'), t('delete_all')))) return;
    setState((s) => ({ ...s, demo: false, charges: [] }));
    notify(t('t_cleared'));
  };

  const startFresh = () => {
    setState((s) => ({ ...s, demo: false, charges: [] }));
    setMonth('all');
    notify(t('t_fresh'));
  };

  const setPhoto = async (file) => {
    try {
      changeSettings({ carPhoto: await fileToSmallDataUrl(file) });
    } catch {
      notify(t('photo_fail'));
    }
  };

  const showFilters = tab === 'list' && chargesView === 'list';

  // ---- أقسام الصفحة الرئيسية (تُرسم بالترتيب المحفوظ في الإعدادات) ----
  const maxMonthEnergy = Math.max(1, ...lastMonths.map((m) => m.energy));
  const renderSection = (id) => {
    switch (id) {
      case 'summary': {
        const isBill = period.mode === 'bill';
        const kindChip = (active) => `rounded-full px-3 py-1.5 text-xs font-extrabold transition ${active ? 'hero-chip' : 'opacity-80 hover:opacity-100'}`;
        return (
          <React.Fragment key="summary">
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
                <button className="hero-chip shrink-0 px-3.5 py-1.5 text-xs" onClick={() => setPeriodOpen(true)} data-testid="period-change">{t('period_change_long')}</button>
              </div>

              <div className="relative mt-2.5 flex gap-1.5" role="group" aria-label={t('period_kind')}>
                <button type="button" aria-pressed={!isBill} className={kindChip(!isBill)} onClick={() => changeSettings({ periodMode: 'month' })} data-testid="kind-month">{t('kind_month')}</button>
                <button
                  type="button" aria-pressed={isBill} className={kindChip(isBill)} data-testid="kind-bill"
                  onClick={() => (bills.length ? changeSettings({ periodMode: 'bill' }) : (notify(t('no_bills_toast')), setTab('bill')))}
                >{t('kind_bill')}</button>
              </div>

              <div className="relative mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold hero-soft"><Zap size={14} /> {t('kpi_energy')}</div>
                  <div className="tabular mt-0.5 flex items-baseline gap-1.5" dir="ltr">
                    <span className="text-[3.6rem] font-extrabold leading-none tracking-tight" data-testid="total-energy">{num(periodSummary.energy, 1)}</span>
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
                {periodStat.distance != null ? (
                  <span data-testid="hero-distance">
                    {t('hero_distance')} <bdi dir="ltr" className="font-extrabold">{periodStat.estimated ? '≈ ' : ''}{num(periodStat.distance, 0)} {t('km')}</bdi>
                    {periodStat.efficiency != null && <> · <bdi dir="ltr" className="font-extrabold">{fix(periodStat.efficiency, 1)} kWh/100km</bdi></>}
                  </span>
                ) : (
                  <button type="button" className="inline-flex items-center gap-1 font-bold underline decoration-dotted underline-offset-4" onClick={() => setOdoOpen(true)}>
                    <Gauge size={13} /> {t('hero_add_odo')}
                  </button>
                )}
              </div>
            </section>

            <section className="card flex items-center justify-between gap-3 px-4 py-3" data-testid="cost-card">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Wallet size={14} style={{ color: C.home }} /> {t('kpi_cost')}</div>
                <div className="tabular mt-0.5 text-[1.9rem] font-extrabold leading-none" data-testid="total-cost">{fix(periodSummary.cost, 2)} <span className="text-sm font-bold text-slate-400">{settings.currency}</span></div>
              </div>
              <div className="tabular text-end text-xs font-bold text-slate-400">{periodSummary.count ? t('charges_n', { n: periodSummary.count }) : t('sum_empty')}</div>
            </section>
          </React.Fragment>
        );
      }
      case 'charges':
        return (
          <section key="charges" className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-extrabold">{t('recent_title')}</h3>
              <button className="text-xs font-extrabold text-accent" onClick={() => { setMonth('all'); setChargesView('list'); setTab('list'); }} data-testid="view-all">{t('view_all_n', { n: periodCharges.length })}</button>
            </div>
            {recent.length === 0 && <div className="card px-4 py-5 text-center text-sm text-slate-400">{t('sum_empty')}</div>}
            {recent.map((c) => <ChargeRow key={c.id} c={c} currency={settings.currency} onEdit={openEdit} />)}
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <I18nProvider lang={lang}>
      <div className="mx-auto min-h-screen w-full max-w-lg pb-32">
        {/* الترويسة: صورة السيارة + تحية المستخدم + الموديل + البطارية */}
        <header className="safe-top sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <CarImage settings={settings} size="hd" />
              <div className="min-w-0">
                <p className="truncate text-[1.05rem] font-extrabold leading-tight" data-testid="greeting">
                  {settings.userName.trim() ? t('hello_name', { name: settings.userName.trim() }) : t('hello')}
                </p>
                <h1 dir="ltr" className="truncate text-start text-[0.8rem] font-bold leading-tight text-slate-300">
                  {settings.carName} <span className="text-accent">{settings.carModel}</span>
                </h1>
                <p className="tabular truncate text-[0.7rem] text-slate-400">{t('battery_only', { cap: num(settings.capacity, 2) })}</p>
              </div>
            </div>
            <button className="btn-ghost !p-2.5" onClick={exportCsv} disabled={!charges.length} aria-label={t('export_csv_title')} title={t('export_csv_title')}>
              <Download size={18} />
            </button>
          </div>

          {showFilters && charges.length > 0 && (
            <div className="space-y-2 px-4 pb-3">
              <div className="relative">
                <select
                  className="field appearance-none pe-9 font-bold"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  aria-label={t('filter_month')}
                >
                  <option value="all">{t('all_months')}</option>
                  {monthKeys.map((k) => (
                    <option key={k} value={k}>{monthLabel(k, lang)}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <Segmented
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: 'all', label: t('all') },
                  { value: 'home', label: t('type_home_s'), activeClass: 'bg-home/20 text-home' },
                  { value: 'fast', label: t('type_fast_s'), activeClass: 'bg-fast/20 text-fast' },
                ]}
              />
            </div>
          )}
        </header>

        <main className="space-y-4 px-4 pt-4">
          {state.demo && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-fast/40 bg-fast/10 px-3.5 py-2.5">
              <p className="text-xs font-medium leading-relaxed text-fast">{t('demo_banner')}</p>
              <button className="btn-ghost shrink-0 !px-3 !py-1.5 text-xs" onClick={startFresh}>{t('start_fresh')}</button>
            </div>
          )}

          {tab === 'home' &&
            (charges.length === 0 ? (
              <Empty icon={BatteryCharging} title={t('welcome_title')} hint={t('welcome_hint')}>
                <div className="flex flex-wrap justify-center gap-2">
                  <button className="btn-primary" onClick={openAdd}><Plus size={17} /> {t('add_charge')}</button>
                  <button className="btn-ghost" onClick={loadDemo}>{t('demo_btn')}</button>
                </div>
              </Empty>
            ) : (
              <>
                <div className="flex justify-end">
                  <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setCustomizeOpen(true)}>
                    <SlidersHorizontal size={14} /> {t('customize')}
                  </button>
                </div>
                {settings.homeLayout.filter((s) => s.visible).map((s) => renderSection(s.id))}
              </>
            ))}

          {tab === 'list' && (
            <>
              <Segmented
                value={chargesView}
                onChange={setChargesView}
                options={[{ value: 'list', label: t('view_list') }, { value: 'calendar', label: t('view_calendar') }]}
              />
              {chargesView === 'list' ? (
                <ChargeList charges={viewCharges} segments={viewSegments} currency={settings.currency} onEdit={openEdit} onDelete={requestDelete} onAdd={openAdd} />
              ) : (
                <CalendarView
                  key={month}
                  charges={charges}
                  segments={allSegments}
                  currency={settings.currency}
                  onEdit={openEdit}
                  onDelete={requestDelete}
                  initialMonth={month !== 'all' ? month : monthKeys[0]}
                />
              )}
            </>
          )}

          {tab === 'analysis' && (
            <Analysis charges={charges} bills={bills} readings={readings} odos={odos} settings={settings} onAddOdo={() => setOdoOpen(true)} onDeleteOdo={deleteOdo} />
          )}

          {tab === 'bill' && <BillImpact charges={charges} bills={bills} settings={settings} onChange={changeSettings} onSaveBill={saveBill} onDeleteBill={deleteBill} />}

          {tab === 'settings' && (
            <SettingsView
              key={settingsKey}
              settings={settings}
              count={charges.length}
              onChange={changeSettings}
              onReset={resetSettings}
              onExportCsv={exportCsv}
              onExportBackup={exportBackup}
              onImportBackup={importBackup}
              onPhoto={setPhoto}
              onDemo={loadDemo}
              onClear={clearAll}
              onCustomize={() => setCustomizeOpen(true)}
              onPdf={() => exportPdf()}
              onAddOdo={() => setOdoOpen(true)}
              bills={bills}
            />
          )}

          <p dir="ltr" className="pt-2 text-center text-[0.7rem] text-slate-500">{t('dev_by')}</p>
        </main>

        {/* زر الإضافة العائم */}
        {(tab === 'home' || tab === 'list') && (
          <button
            onClick={openAdd}
            aria-label={t('add_charge')}
            className="fixed bottom-[88px] end-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand1 to-brand2 text-onaccent shadow-glow transition active:scale-90"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        )}

        {/* شريط التنقل السفلي */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.1] bg-ink-950/85 backdrop-blur-2xl" aria-label={t('nav_aria')}>
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {TABS.map(({ id, key, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-bold transition ${active ? 'text-accent' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <span className={`grid place-items-center rounded-full px-4 py-1 transition ${active ? 'bg-accent/15' : ''}`}><Icon size={21} /></span>
                  {t(key)}
                </button>
              );
            })}
          </div>
        </nav>

        <ChargeForm
          open={form.open}
          onClose={closeForm}
          onSave={saveCharge}
          onDelete={deleteCharge}
          initial={form.charge}
          settings={settings}
        />
        <PeriodSheet open={periodOpen} onClose={() => setPeriodOpen(false)} settings={settings} bills={bills} onChange={changeSettings} />
        <OdoSheet open={odoOpen} onClose={() => setOdoOpen(false)} onSave={saveOdo} readings={readings} />
        <HomeCustomizer
          open={customizeOpen}
          onClose={() => setCustomizeOpen(false)}
          layout={settings.homeLayout}
          onChange={changeSettings}
        />
        {confirmNode}
        <Toast message={toast} />
      </div>
    </I18nProvider>
  );
}
