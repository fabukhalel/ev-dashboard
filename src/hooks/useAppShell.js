// تأثيرات على مستوى التطبيق كله: اللغة والاتجاه، الثيم وأشرطة النظام، شاشة البداية، الرجوع، العودة من الخلفية.
import { useEffect, useRef, useState } from 'react';
import { useStore, useUi } from '../state/store.jsx';
import { applyAppearance } from '../lib/theme.js';
import { handleBack } from '../lib/backStack.js';
import { syncSystemBars, hideSplash, onBackButton, exitApp, onResume } from '../lib/native.js';

export function useAppearance() {
  const { settings } = useStore().state;
  const { lang } = settings;

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
      const bar = applyAppearance(root, settings, eff);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', bar);
      const scheme = document.querySelector('meta[name="color-scheme"]');
      if (scheme) scheme.setAttribute('content', eff);
      syncSystemBars(eff);
    };
    apply();
    if (settings.theme !== 'system' || !mq) return undefined;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme, settings.palette, settings.fontPx]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useNativeBehavior() {
  const { t, notify } = useStore();
  const { tab, setTab } = useUi();

  useEffect(() => { hideSplash(); }, []);

  // عند العودة من الخلفية: إعادة رسم ليتحدث «اليوم» والفترة الحالية (مثلاً بعد منتصف الليل أو بداية شهر)
  const [, setResumeTick] = useState(0);
  useEffect(() => onResume(() => setResumeTick((n) => n + 1)), []);

  // زر الرجوع: يغلق أعلى نافذة، ثم يعود للرئيسية، ثم «اضغط مرة أخرى للخروج»
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const lastBack = useRef(0);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleBack(); };
    window.addEventListener('keydown', onKey);
    const off = onBackButton(() => {
      if (handleBack()) return;
      if (tabRef.current !== 'home') { setTab('home'); return; }
      const now = Date.now();
      if (now - lastBack.current < 2000) { exitApp(); return; }
      lastBack.current = now;
      notify(t('back_again'));
    });
    return () => { window.removeEventListener('keydown', onKey); off(); };
  }, [notify, t, setTab]);
}
