import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore, useUi } from './state/store.jsx';
import { useAppearance, useNativeBehavior } from './hooks/useAppShell.js';
import { BottomNav, Overlays } from './components/AppChrome.jsx';
import Home, { HomeHeader } from './pages/Home.jsx';
import Charges from './pages/Charges.jsx';
import Analysis from './pages/Analysis.jsx';
import Bill from './pages/Bill.jsx';
import Settings from './pages/Settings.jsx';
import { I18nProvider } from './lib/i18n.jsx';
import { defaultSettings } from './lib/storage.js';
import { loadPersisted } from './lib/persist.js';
import { getBackend, getBackupFs } from './lib/platform.js';
import { makeDemo } from './lib/demo.js';
import { retier } from './lib/tiers.js';

const PAGES = { home: Home, list: Charges, analysis: Analysis, bill: Bill, settings: Settings };

/** يحمّل البيانات المحفوظة (غير متزامن) ثم يعرض التطبيق */
export default function App() {
  const [boot, setBoot] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const backend = await getBackend();
      let res;
      try {
        res = await loadPersisted(backend);
      } catch {
        res = { state: null, source: 'corrupt' };
      }
      let initial = res.state;
      if (!initial) {
        const settings = defaultSettings();
        // أول فتح: بيانات تجريبية موسومة بوضوح حتى يرى المستخدم ما يفعله التطبيق
        initial = res.source === 'fresh'
          ? { settings, ...makeDemo(settings, new Date(), (list) => retier(list, settings, [])), bills: [], demo: true }
          : { settings, charges: [], bills: [], odos: [], demo: false };
      }
      const fs = await getBackupFs();
      if (alive) setBoot({ initial, backend, fs, source: res.source, photo: res.source === 'data' ? initial.settings.carPhoto || '' : null });
    })();
    return () => { alive = false; };
  }, []);
  if (!boot) return <div className="min-h-screen bg-ink-950" aria-busy="true" />;
  return (
    <StoreProvider boot={boot}>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { state, t, lang, actions } = useStore();
  const { tab } = useUi();
  useAppearance();
  useNativeBehavior();
  const Page = PAGES[tab] || Home;
  return (
    <I18nProvider lang={lang}>
      <div className="mx-auto min-h-screen w-full max-w-lg pb-40">
        {tab === 'home' ? <HomeHeader /> : <div className="safe-top" />}
        <main className="space-y-4 px-4 pt-4">
          {state.demo && (
            <div className="flex items-center justify-between gap-3 rounded-[1.5rem] px-4 py-3" style={{ background: 'color-mix(in srgb, rgb(var(--fast)) 12%, transparent)' }}>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgb(var(--fast))' }}>{t('demo_banner')}</p>
              <button className="btn-ghost shrink-0 !px-3 !py-1.5 text-xs" onClick={actions.startFresh}>{t('start_fresh')}</button>
            </div>
          )}
          <Page />
        </main>
        <BottomNav />
        <Overlays />
      </div>
    </I18nProvider>
  );
}
