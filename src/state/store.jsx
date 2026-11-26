// مخزن التطبيق: البيانات (useReducer) + الحفظ الدائم + النسخ التلقائي + الرسائل + حالة الواجهة.
// أي صفحة تأخذ ما تحتاجه بـ useStore() و useUi() بدل تمرير عشرات الخصائص.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { reducer } from './reducer.js';
import { makeT } from '../lib/i18n.jsx';
import { makeBackup, parseBackup } from '../lib/storage.js';
import { createSaver } from '../lib/persist.js';
import { onBackground, shareBackupFile } from '../lib/platform.js';
import { maybeAutoBackup, listBackups, BACKUP_DIR, KEY_LAST } from '../lib/autoBackup.js';
import { haptic } from '../lib/native.js';
import { collectReadings } from '../lib/odo.js';
import { chargesToCsv, saveFile, saveBinary } from '../lib/csv.js';
import { fileToSmallDataUrl } from '../lib/image.js';
import { todayStr } from '../lib/format.js';
import { useConfirm } from '../components/ConfirmSheet.jsx';

const StoreCtx = createContext(null);
const UiCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);
export const useUi = () => useContext(UiCtx);

export const TAB_IDS = ['home', 'list', 'analysis', 'bill', 'settings'];
const initialTab = () => {
  const h = typeof location !== 'undefined' ? location.hash.slice(1) : '';
  return TAB_IDS.includes(h) ? h : 'home';
};

/** حالة الواجهة: التبويب الحالي، الفلاتر، والنوافذ المفتوحة */
function useUiState() {
  const [tab, setTab] = useState(initialTab);
  const [month, setMonth] = useState('all'); // 'all' | 'YYYY-MM'
  const [typeFilter, setTypeFilter] = useState('all'); // all | home | fast
  const [chargesView, setChargesView] = useState('list'); // list | calendar
  const [form, setForm] = useState({ open: false, charge: null });
  const [sheet, setSheet] = useState(null); // 'period' | 'odo' | 'customize' | null

  // التبويب الحالي في عنوان الصفحة (#list ...) حتى يبقى بعد إعادة التحميل
  useEffect(() => {
    try { history.replaceState(history.state, '', `#${tab}`); } catch { /* بيئة بلا History */ }
    window.scrollTo({ top: 0 });
  }, [tab]);

  return useMemo(() => ({
    tab, setTab, month, setMonth, typeFilter, setTypeFilter, chargesView, setChargesView,
    form,
    openAdd: () => setForm({ open: true, charge: null }),
    openEdit: (c) => setForm({ open: true, charge: c }),
    closeForm: () => setForm({ open: false, charge: null }),
    sheet, openSheet: setSheet, closeSheet: () => setSheet(null),
  }), [tab, month, typeFilter, chargesView, form, sheet]);
}

export function StoreProvider({ boot, children }) {
  const [state, dispatch] = useReducer(reducer, boot.initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const lang = state.settings.lang;
  const t = useMemo(() => makeT(lang), [lang]);
  const ui = useUiState();
  const [ask, confirmNode] = useConfirm();
  const [settingsKey, setSettingsKey] = useState(0);

  // ---- رسالة قصيرة أسفل الشاشة ----
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ---- الحفظ الدائم: مؤجَّل 300ms، ويُفرَّغ فوراً عند ذهاب التطبيق للخلفية ----
  const [saveError, setSaveError] = useState(false);
  const saver = useMemo(() => createSaver(boot.backend, { initialPhoto: boot.photo, onResult: (ok) => setSaveError(!ok) }), [boot]);
  const firstSave = useRef(boot.source === 'data');
  useEffect(() => {
    // لا داعي لإعادة كتابة ما حُمّل للتو كما هو
    if (firstSave.current) { firstSave.current = false; return; }
    saver.schedule(state);
  }, [state, saver]);
  useEffect(() => onBackground(() => { saver.flush(); }), [saver]);

  // ---- النسخ الاحتياطي التلقائي الأسبوعي (على الهاتف) ----
  const [autoBackups, setAutoBackups] = useState({ list: [], last: null });
  const refreshAutoBackups = useCallback(async () => {
    if (!boot.fs) return;
    const last = Number(await boot.backend.get(KEY_LAST)) || null;
    setAutoBackups({ list: await listBackups(boot.fs), last });
  }, [boot]);
  useEffect(() => {
    if (!boot.fs) return;
    maybeAutoBackup(boot.initial, { fs: boot.fs, store: boot.backend }).catch(() => {}).finally(refreshAutoBackups);
  }, [boot, refreshAutoBackups]);

  // إن حُذفت كل شحنات الشهر المحدد في الفلتر نعود إلى "الكل"
  const { month, setMonth } = ui;
  useEffect(() => {
    if (month !== 'all' && !state.charges.some((c) => c.date.startsWith(month))) setMonth('all');
  }, [month, setMonth, state.charges]);

  // ---- العمليات (تحفظ + تعرض رسالة + تطلب تأكيداً عند الحاجة) ----
  const actions = useMemo(() => {
    const cur = () => stateRef.current;
    const stamp = () => todayStr();
    const changeSettings = (patch) => dispatch({ type: 'settings/change', patch });
    const hasRealData = () => cur().charges.length > 0 && !cur().demo;

    const applyBackupText = async (text) => {
      const data = parseBackup(text);
      if (hasRealData() && !(await ask(t('confirm_replace', { n: data.charges.length }), t('replace')))) return;
      dispatch({ type: 'data/replace', data });
      setSettingsKey((k) => k + 1);
      notify(t('t_restored', { n: data.charges.length }));
    };
    const deleteCharge = (id) => {
      dispatch({ type: 'charge/delete', id });
      ui.closeForm();
      haptic('medium');
      notify(t('t_deleted'));
    };

    return {
      changeSettings,
      saveCharge: (c) => {
        dispatch({ type: 'charge/save', charge: c });
        ui.closeForm();
        haptic('light');
        notify(t('t_saved'));
      },
      deleteCharge,
      requestDelete: async (c) => {
        if (await ask(t('confirm_del_one'), t('delete'))) deleteCharge(c.id);
      },
      saveBill: (b) => {
        dispatch({ type: 'bill/save', bill: b });
        notify(t('t_bill_saved'));
      },
      deleteBill: async (b) => {
        if (!(await ask(t('confirm_del_bill'), t('delete')))) return;
        dispatch({ type: 'bill/delete', id: b.id });
        notify(t('t_bill_deleted'));
      },
      saveOdo: (o) => {
        dispatch({ type: 'odo/add', odo: o });
        ui.closeSheet();
        notify(t('t_odo_saved'));
      },
      deleteOdo: async (o) => {
        if (!(await ask(t('confirm_del_odo'), t('delete')))) return;
        dispatch({ type: 'odo/delete', id: o.id });
        notify(t('t_odo_deleted'));
      },
      resetSettings: () => {
        dispatch({ type: 'settings/reset' });
        setSettingsKey((k) => k + 1);
        notify(t('t_reset'));
      },
      exportCsv: async () => {
        try {
          await saveFile(`ev-charges-${stamp()}.csv`, chargesToCsv(cur().charges, t));
          notify(t('t_csv'));
        } catch {
          notify(t('t_csv_fail'));
        }
      },
      exportPdf: async (period) => {
        try {
          // مولّد التقرير يُحمَّل عند الطلب فقط حتى يفتح التطبيق أسرع
          const { buildReportPdf } = await import('../lib/report.js');
          const { charges, bills, odos, settings } = cur();
          const bytes = await buildReportPdf({ charges, bills, readings: collectReadings(charges, odos), settings, period, t, lang });
          await saveBinary(`ev-report-${stamp()}.pdf`, bytes, 'application/pdf');
          notify(t('t_pdf'));
        } catch {
          notify(t('t_pdf_fail'));
        }
      },
      exportBackup: async () => {
        try {
          await saveFile(`ev-backup-${stamp()}.json`, makeBackup(cur()), 'application/json');
          notify(t('t_backup'));
        } catch {
          notify(t('t_backup_fail'));
        }
      },
      importBackup: async (file) => {
        try {
          await applyBackupText(await file.text());
        } catch (e) {
          notify(e instanceof SyntaxError ? t('t_bad_file') : e.message === 'invalid_backup' ? t('t_bad_backup') : t('t_bad_file'));
        }
      },
      autoBackupNow: async () => {
        try {
          const r = await maybeAutoBackup(cur(), { fs: boot.fs, store: boot.backend, force: true });
          notify(r.written ? t('t_backup') : t('ab_nothing'));
        } catch {
          notify(t('t_backup_fail'));
        }
        refreshAutoBackups();
      },
      shareAutoBackup: async (name) => {
        try {
          await shareBackupFile(boot.fs, `${BACKUP_DIR}/${name}`);
        } catch {
          /* أُلغيت المشاركة */
        }
      },
      restoreAutoBackup: async (name) => {
        try {
          await applyBackupText(await boot.fs.read(`${BACKUP_DIR}/${name}`));
        } catch {
          notify(t('t_bad_backup'));
        }
      },
      loadDemo: async () => {
        if (hasRealData() && !(await ask(t('confirm_demo'), t('replace')))) return;
        dispatch({ type: 'charges/demo' });
        ui.setMonth('all');
        notify(t('t_demo'));
      },
      clearAll: async () => {
        if (!(await ask(t('confirm_clear'), t('delete_all')))) return;
        dispatch({ type: 'charges/clear' });
        notify(t('t_cleared'));
      },
      startFresh: () => {
        dispatch({ type: 'charges/clear' });
        ui.setMonth('all');
        notify(t('t_fresh'));
      },
      setPhoto: async (file) => {
        try {
          changeSettings({ carPhoto: await fileToSmallDataUrl(file) });
        } catch {
          notify(t('photo_fail'));
        }
      },
    };
    // ui.* المستعملة هنا دوال ثابتة (setState) أو لا تعتمد على حالة قديمة
  }, [t, lang, ask, notify, boot, refreshAutoBackups]); // eslint-disable-line react-hooks/exhaustive-deps

  const store = useMemo(() => ({
    state, t, lang, notify, actions, settingsKey, saveError, toast, confirmNode,
    autoBackups: boot.fs ? autoBackups : null,
  }), [state, t, lang, notify, actions, settingsKey, saveError, toast, confirmNode, boot.fs, autoBackups]);

  return (
    <StoreCtx.Provider value={store}>
      <UiCtx.Provider value={ui}>{children}</UiCtx.Provider>
    </StoreCtx.Provider>
  );
}
