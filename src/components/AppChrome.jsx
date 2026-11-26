// إطار التطبيق الثابت: الترويسة، شريط التنقل، زر الإضافة، والنوافذ المشتركة.
import React from 'react';
import { LayoutDashboard, ListOrdered, BarChart3, Receipt, Settings, Plus, Download } from 'lucide-react';
import CarImage from './CarImage.jsx';
import ChargeForm from './ChargeForm.jsx';
import PeriodSheet from './PeriodSheet.jsx';
import OdoSheet from './OdoSheet.jsx';
import HomeCustomizer from './HomeCustomizer.jsx';
import { Toast } from './ui.jsx';
import { ChargesFilters } from '../pages/Charges.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { useReadings } from '../state/derived.js';
import { num } from '../lib/format.js';

const TABS = [
  { id: 'home', key: 'tab_home', icon: LayoutDashboard },
  { id: 'list', key: 'tab_list', icon: ListOrdered },
  { id: 'analysis', key: 'tab_analysis', icon: BarChart3 },
  { id: 'bill', key: 'tab_bill', icon: Receipt },
  { id: 'settings', key: 'tab_settings', icon: Settings },
];

/** صورة السيارة + تحية المستخدم + الموديل + البطارية، وتحتها فلاتر الشحنات */
export function AppHeader() {
  const { state: { settings, charges }, t, actions } = useStore();
  return (
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
        <button className="btn-ghost !p-2.5" onClick={actions.exportCsv} disabled={!charges.length} aria-label={t('export_csv_title')} title={t('export_csv_title')}>
          <Download size={18} />
        </button>
      </div>
      <ChargesFilters />
    </header>
  );
}

export function BottomNav() {
  const { t } = useStore();
  const { tab, setTab, openAdd } = useUi();
  return (
    <>
      {(tab === 'home' || tab === 'list') && (
        <button
          onClick={openAdd}
          aria-label={t('add_charge')}
          className="fixed bottom-[88px] end-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand1 to-brand2 text-onaccent shadow-glow transition active:scale-90"
          style={{ marginBottom: 'max(env(safe-area-inset-bottom), var(--safe-area-inset-bottom, 0px))' }}
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      )}
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
    </>
  );
}

/** النوافذ المنبثقة المشتركة + شريط خطأ الحفظ + التأكيد + الرسالة القصيرة */
export function Overlays() {
  const { state: { settings, bills }, t, actions, saveError, confirmNode, toast } = useStore();
  const ui = useUi();
  const readings = useReadings();
  return (
    <>
      <ChargeForm open={ui.form.open} onClose={ui.closeForm} onSave={actions.saveCharge} onDelete={actions.deleteCharge} initial={ui.form.charge} settings={settings} />
      <PeriodSheet open={ui.sheet === 'period'} onClose={ui.closeSheet} settings={settings} bills={bills} onChange={actions.changeSettings} />
      <OdoSheet open={ui.sheet === 'odo'} onClose={ui.closeSheet} onSave={actions.saveOdo} readings={readings} />
      <HomeCustomizer open={ui.sheet === 'customize'} onClose={ui.closeSheet} layout={settings.homeLayout} onChange={actions.changeSettings} />
      {saveError && (
        <div role="alert" className="fixed inset-x-0 top-0 z-[70] flex items-center justify-between gap-3 bg-fast px-4 py-2.5 text-sm font-bold text-white" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top), var(--safe-area-inset-top, 0px))' }} data-testid="save-error">
          <span>{t('save_failed')}</span>
          <button type="button" className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold" onClick={actions.exportBackup}>{t('save_failed_btn')}</button>
        </div>
      )}
      {confirmNode}
      <Toast message={toast} />
    </>
  );
}
