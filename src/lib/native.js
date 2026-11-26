// سلوك أصلي على أندرويد (المرحلة 4). كل الدوال آمنة في المتصفح ولا تفعل شيئاً هناك.
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';

const native = () => Capacitor.isNativePlatform();

/** لون أيقونات شريط الحالة والتنقل حسب الثيم الفعّال */
export async function syncSystemBars(effectiveTheme) {
  if (!native()) return;
  try {
    await SystemBars.setStyle({ style: effectiveTheme === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Dark });
  } catch { /* غير مدعوم */ }
}

export async function hideSplash() {
  if (!native()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch { /* غير مدعوم */ }
}

/** اهتزاز خفيف: 'light' عند الحفظ، 'medium' عند الحذف */
export async function haptic(kind = 'light') {
  if (!native()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch { /* لا يوجد محرك اهتزاز */ }
}

/** زر الرجوع في أندرويد. يرجع دالة إلغاء */
export function onBackButton(handler) {
  if (!native()) return () => {};
  let h = null;
  let cancelled = false;
  import('@capacitor/app').then(({ App }) => App.addListener('backButton', handler)).then((x) => {
    if (cancelled) x.remove(); else h = x;
  }).catch(() => {});
  return () => { cancelled = true; if (h) h.remove(); };
}

export async function exitApp() {
  if (!native()) return;
  const { App } = await import('@capacitor/app');
  await App.exitApp();
}

/** عند عودة التطبيق من الخلفية (أو ظهور الصفحة في المتصفح). يرجع دالة إلغاء */
export function onResume(cb) {
  const vis = () => { if (document.visibilityState === 'visible') cb(); };
  document.addEventListener('visibilitychange', vis);
  let h = null;
  let cancelled = false;
  if (native()) {
    import('@capacitor/app').then(({ App }) => App.addListener('resume', cb)).then((x) => {
      if (cancelled) x.remove(); else h = x;
    }).catch(() => {});
  }
  return () => {
    cancelled = true;
    document.removeEventListener('visibilitychange', vis);
    if (h) h.remove();
  };
}
