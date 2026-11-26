// ربط طبقة الحفظ والنسخ التلقائي بالمنصة: هاتف (Capacitor) أو متصفح
import { Capacitor } from '@capacitor/core';
import { localStorageBackend, preferencesBackend } from './persist.js';
import { capacitorFs } from './autoBackup.js';

export const isNative = () => Capacitor.isNativePlatform();

export async function getBackend() {
  if (!isNative()) return localStorageBackend();
  const { Preferences } = await import('@capacitor/preferences');
  return preferencesBackend(Preferences);
}

/** نظام ملفات النسخ التلقائية (على الهاتف فقط) */
export async function getBackupFs() {
  if (!isNative()) return null;
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  return capacitorFs(Filesystem, Directory, Encoding);
}

/** يستدعي cb عندما يذهب التطبيق للخلفية أو تُغلق الصفحة. يرجع دالة إلغاء */
export function onBackground(cb) {
  const vis = () => { if (document.visibilityState === 'hidden') cb(); };
  document.addEventListener('visibilitychange', vis);
  window.addEventListener('pagehide', cb);
  let handle = null;
  if (isNative()) {
    import('@capacitor/app').then(({ App }) => App.addListener('pause', cb)).then((h) => { handle = h; }).catch(() => {});
  }
  return () => {
    document.removeEventListener('visibilitychange', vis);
    window.removeEventListener('pagehide', cb);
    if (handle) handle.remove();
  };
}

/** مشاركة نسخة من مجلد التطبيق (Drive، واتساب...): تُنسخ إلى الكاش أولاً لأن المشاركة مسموحة من هناك فقط */
export async function shareBackupFile(fs, path) {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const name = path.split('/').pop();
  const res = await Filesystem.writeFile({ path: name, data: await fs.read(path), directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: name, url: res.uri, dialogTitle: name });
}
