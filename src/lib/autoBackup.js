// نسخ احتياطي تلقائي محلي (المرحلة 3): عند فتح التطبيق، إن مرّت 7 أيام على آخر نسخة
// يُكتب ملف JSON في مجلد التطبيق الداخلي (تشمله نسخ أندرويد الاحتياطية) مع الاحتفاظ بآخر 5 نسخ.
// الملفات تُشارك من الإعدادات (Drive، واتساب...) أو تُستعاد مباشرة.

import { makeBackup } from './storage.js';

export const BACKUP_DIR = 'backups';
export const KEEP = 5;
export const EVERY_DAYS = 7;
export const KEY_LAST = 'ev-dashboard:lastAutoBackup';
const NAME = /^ev-auto-(\d{4}-\d{2}-\d{2})(?:-(\d+))?\.json$/;

const pad = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** هل حان وقت نسخة جديدة؟ lastAt بالميلي ثانية أو null */
export function isDue(lastAt, now = Date.now(), days = EVERY_DAYS) {
  return !Number.isFinite(lastAt) || now - lastAt >= days * 86400000;
}

/** أسماء النسخ التلقائية مرتبة من الأحدث للأقدم */
export function sortBackups(names) {
  const key = (n) => { const m = NAME.exec(n); return [m[1], Number(m[2] || 1)]; };
  return names.filter((n) => NAME.test(n)).sort((a, b) => {
    const [da, ia] = key(a), [db, ib] = key(b);
    return da === db ? ib - ia : da < db ? 1 : -1;
  });
}

/**
 * fs: محوّل نظام ملفات { list(dir) → [names], write(path, text), read(path) → text, remove(path), uri(path) }
 * store: مخزن نصي (نفس backend الحفظ) لتاريخ آخر نسخة.
 */
export async function maybeAutoBackup(state, { fs, store, now = new Date(), force = false }) {
  const last = Number(await store.get(KEY_LAST));
  if (!force && !isDue(last || NaN, now.getTime())) return { written: null };
  if (!state || !Array.isArray(state.charges) || state.demo || state.charges.length === 0) return { written: null };
  const existing = sortBackups(await fs.list(BACKUP_DIR));
  // اسم جديد دائماً أعلى من أي نسخة لنفس اليوم (لا نعيد استخدام رقم محذوف)
  const sameDay = existing.filter((n) => backupDate(n) === isoDay(now)).map((n) => Number(NAME.exec(n)[2] || 1));
  const next = sameDay.length ? Math.max(...sameDay) + 1 : 1;
  const name = next === 1 ? `ev-auto-${isoDay(now)}.json` : `ev-auto-${isoDay(now)}-${next}.json`;
  await fs.write(`${BACKUP_DIR}/${name}`, makeBackup(state));
  await store.set(KEY_LAST, String(now.getTime()));
  const all = sortBackups([...existing, name]);
  for (const old of all.slice(KEEP)) await fs.remove(`${BACKUP_DIR}/${old}`);
  return { written: name };
}

export async function listBackups(fs) {
  return sortBackups(await fs.list(BACKUP_DIR));
}

export const backupDate = (name) => (NAME.exec(name) || [])[1] || '';

/** محوّل Capacitor Filesystem على مجلد Directory.Data */
export function capacitorFs(Filesystem, Directory, Encoding) {
  const dir = Directory.Data;
  return {
    async list(path) {
      try {
        const r = await Filesystem.readdir({ path, directory: dir });
        return r.files.map((f) => (typeof f === 'string' ? f : f.name));
      } catch {
        return [];
      }
    },
    async write(path, data) {
      await Filesystem.writeFile({ path, data, directory: dir, encoding: Encoding.UTF8, recursive: true });
    },
    async read(path) {
      return (await Filesystem.readFile({ path, directory: dir, encoding: Encoding.UTF8 })).data;
    },
    async remove(path) {
      await Filesystem.deleteFile({ path, directory: dir });
    },
    async uri(path) {
      return (await Filesystem.getUri({ path, directory: dir })).uri;
    },
  };
}
