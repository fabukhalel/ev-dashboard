// إطار التطبيق الثابت: شريط التنقل العائم، زر الإضافة، والنوافذ المشتركة.
import React from 'react';
import { LayoutGrid, ListOrdered, BarChart3, Receipt, Settings, Plus } from 'lucide-react';
import ChargeForm from './ChargeForm.jsx';
import ChargeDetails from './ChargeDetails.jsx';
import OdoSheet from './OdoSheet.jsx';
import HomeCustomizer from './HomeCustomizer.jsx';
import { Toast } from './ui.jsx';
import { useStore, useUi } from '../state/store.jsx';
import { useReadings } from '../state/derived.js';

const TABS = [
  { id: 'home', key: 'tab_home', icon: LayoutGrid },
  { id: 'list', key: 'tab_list', icon: ListOrdered },
  { id: 'analysis', key: 'tab_analysis', icon: BarChart3 },
  { id: 'bill', key: 'tab_bill', icon: Receipt },
  { id: 'settings', key: 'tab_settings', icon: Settings },
];

/** شريط تنقل عائم بحواف دائرية + زر إضافة دائري بتوهج خفيف (V8) */
export function BottomNav() {
  const { t } = useStore();
  const { tab, setTab, openAdd } = useUi();
  return (
    <>
      {(tab === 'home' || tab === 'list') && (
        <button
          onClick={openAdd}
          aria-label={t('add_charge')}
          className="fixed bottom-[6.5rem] start-5 z-40 grid h-16 w-16 place-items-center rounded-full bg-solid text-onsolid shadow-glow transition active:scale-90"
          style={{ marginBottom: 'max(env(safe-area-inset-bottom), var(--safe-area-inset-bottom, 0px))' }}
          data-testid="fab"
        >
          <Plus size={30} strokeWidth={2.6} />
        </button>
      )}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-3 pb-3" aria-label={t('nav_aria')}>
        <div className="mx-auto grid max-w-lg grid-cols-5 rounded-[1.75rem] px-1.5 py-1.5 shadow-[0_12px_30px_-12px_rgb(0_0_0/0.45)]" style={{ background: 'rgb(var(--nav-bg))' }}>
          {TABS.map(({ id, key, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-1.5 text-xs font-bold transition ${active ? 'text-accent' : 'text-slate-400'}`}
              >
                <span className={`grid place-items-center rounded-full px-4 py-1.5 transition ${active ? 'bg-accent/15' : ''}`}><Icon size={22} /></span>
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
  const { state: { settings }, t, actions, saveError, confirmNode, toast } = useStore();
  const ui = useUi();
  const readings = useReadings();
  return (
    <>
      <ChargeForm open={ui.form.open} onClose={ui.closeForm} onSave={actions.saveCharge} onDelete={actions.deleteCharge} initial={ui.form.charge} settings={settings} />
      <ChargeDetails />
      <OdoSheet open={ui.sheet === 'odo'} onClose={ui.closeSheet} onSave={actions.saveOdo} onDelete={actions.deleteOdo} initial={ui.odoEdit} readings={readings} />
      <HomeCustomizer open={ui.sheet === 'customize'} onClose={ui.closeSheet} layout={settings.homeLayout} recentCount={settings.recentCount} onChange={actions.changeSettings} />
      {saveError && (
        <div role="alert" className="fixed inset-x-0 top-0 z-[70] flex items-center justify-between gap-3 bg-danger px-4 py-2.5 text-sm font-bold text-white" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top), var(--safe-area-inset-top, 0px))' }} data-testid="save-error">
          <span>{t('save_failed')}</span>
          <button type="button" className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-bold" onClick={actions.exportBackup}>{t('save_failed_btn')}</button>
        </div>
      )}
      {confirmNode}
      <Toast message={toast.message} action={toast.action} />
    </>
  );
}
