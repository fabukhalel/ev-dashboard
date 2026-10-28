// أدوات التنسيق والتواريخ (الأرقام لاتينية دائماً، وأسماء الأشهر والأيام حسب اللغة)

export const MONTHS = {
  // أسماء الأشهر بالإنجليزية في الواجهتين (بطلب المستخدم)
  ar: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export const WEEKDAYS = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
export const WEEKDAYS_SHORT = {
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const cache = new Map();
function nf(d, fixed) {
  const k = `${d}${fixed ? 'f' : 'v'}`;
  if (!cache.has(k)) {
    cache.set(
      k,
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: fixed ? d : 0,
        maximumFractionDigits: d,
      }),
    );
  }
  return cache.get(k);
}

const ok = (v) => typeof v === 'number' && Number.isFinite(v);

/** رقم بحد أقصى d منازل عشرية (بدون أصفار زائدة) */
export const num = (v, d = 1) => (ok(v) ? nf(d, false).format(v) : '—');
/** رقم بعدد ثابت من المنازل العشرية */
export const fix = (v, d = 1) => (ok(v) ? nf(d, true).format(v) : '—');

/** تحويل نص إدخال المستخدم إلى رقم (يدعم الأرقام العربية والفاصلة) */
export function parseNum(s) {
  if (s == null) return null;
  let t = String(s).trim();
  if (!t) return null;
  t = t
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 1776))
    .replace(/[٫,]/g, '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const pad = (n) => String(n).padStart(2, '0');

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => ymd(new Date());

/** التاريخ بصيغة dd/mm/yyyy (من نص ISO yyyy-mm-dd) */
export function formatDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

/** يقرأ dd/mm/yyyy ويرجع ISO أو null إن لم يكن تاريخاً حقيقياً */
export function parseDMY(text) {
  const m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(String(text || '').trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d || y < 1900 || y > 2200) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/** تنسيق أثناء الكتابة: يُبقي الأرقام فقط ويضيف الشرطات المائلة تلقائياً */
export function maskDMY(raw) {
  const d = String(raw || '')
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 1632))
    .replace(/\D/g, '')
    .slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** فرق الأيام بين تاريخين ISO (شاملاً الطرفين) */
export function daysInclusive(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
}

export function weekdayOf(s, lang = 'ar') {
  const [y, m, d] = s.split('-').map(Number);
  return WEEKDAYS[lang][new Date(y, m - 1, d).getDay()];
}

export function monthLabel(key, lang = 'ar') {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[lang][m - 1]} ${y}`;
}

/** اسم الشهر المختصر بالإنجليزية: Oct 26 (أو Oct فقط عند withYear=false) */
export function monthShort(key, lang = 'ar', withYear = true) {
  const [y, m] = key.split('-').map(Number);
  const name = MONTHS.en[m - 1].slice(0, 3);
  return withYear ? `${name} ${String(y).slice(2)}` : name;
}

/** dd/mm اختصاراً من نص ISO */
export const shortDM = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? `${s.slice(8)}/${s.slice(5, 7)}` : '');

/** أول وآخر يوم في شهر 'YYYY-MM' كنصوص ISO */
export function monthRangeOf(key) {
  const [y, m] = key.split('-').map(Number);
  return { start: ymd(new Date(y, m - 1, 1)), end: ymd(new Date(y, m, 0)) };
}
