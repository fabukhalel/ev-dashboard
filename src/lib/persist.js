// طبقة الحفظ الدائم (المرحلة 3)
// - على الهاتف: @capacitor/preferences (SharedPreferences) فلا تُمسح مع بيانات WebView وتشملها نسخ أندرويد الاحتياطية.
// - في المتصفح: localStorage.
// - البيانات تحمل schemaVersion مع دالة ترحيل لكل إصدار.
// - صورة السيارة في مفتاح مستقل حتى لا تُعاد كتابتها مع كل تغيير صغير.
// - الحفظ مؤجَّل قليلاً (debounce) ويُفرَّغ فوراً عند ذهاب التطبيق للخلفية.

import { sanitizeSettings, sanitizeCharge, sanitizeBill, sanitizeOdo } from './storage.js';

export const SCHEMA_VERSION = 2;
export const KEY_V1 = 'ev-dashboard:v1';
export const KEY_DATA = 'ev-dashboard:data';
export const KEY_PHOTO = 'ev-dashboard:photo';

/** مخزن نصي بسيط: get(key) → string|null ، set(key, value) */
export function localStorageBackend(ls = globalThis.localStorage) {
  return {
    async get(key) { return ls.getItem(key); },
    async set(key, value) { ls.setItem(key, value); },
    async remove(key) { ls.removeItem(key); },
  };
}

export function preferencesBackend(Preferences) {
  return {
    async get(key) { return (await Preferences.get({ key })).value ?? null; },
    async set(key, value) { await Preferences.set({ key, value }); },
    async remove(key) { await Preferences.remove({ key }); },
  };
}

const list = (v, f) => (Array.isArray(v) ? v : []).map(f).filter(Boolean);

/** يحوّل أي شكل قديم إلى الشكل الحالي وينظّفه. يرجع null إن لم يكن قابلاً للقراءة */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  let p = raw;
  const v = Number.isInteger(p.schemaVersion) ? p.schemaVersion : 1;
  if (v > SCHEMA_VERSION) return null; // من نسخة أحدث من التطبيق: لا نلمسها
  if (v < 2) {
    // v1 → v2: نفس الحقول، ويُضاف رقم البنية. (صورة السيارة تُفصل عند الحفظ)
    p = { ...p, schemaVersion: 2 };
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: sanitizeSettings(p.settings),
    charges: list(p.charges, sanitizeCharge),
    bills: list(p.bills, sanitizeBill),
    odos: list(p.odos, sanitizeOdo),
    demo: !!p.demo,
  };
}

function parse(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

/**
 * يحمّل الحالة. الترتيب: المفتاح الجديد، ثم الشكل القديم v1 في localStorage (ترحيل مرة واحدة، ويُترك الأصل كشبكة أمان).
 * يرجع {state, source: 'data'|'v1'|'fresh'|'corrupt'}. (App يضيف 'unreadable' إن فشلت القراءة نفسها)
 */
export async function loadPersisted(backend, legacy = localStorageBackend()) {
  const curText = await backend.get(KEY_DATA);
  const cur = migrate(parse(curText));
  if (cur) {
    const photo = await backend.get(KEY_PHOTO);
    if (photo) cur.settings = sanitizeSettings({ ...cur.settings, carPhoto: photo });
    return { state: cur, source: 'data' };
  }
  if (curText != null) {
    // المفتاح الجديد موجود لكنه غير مقروء (تالف أو من نسخة أحدث): لا نكتب فوقه بيانات v1 القديمة،
    // بل نحتفظ بنسخة منه أولاً
    await backend.set(`${KEY_DATA}:corrupt-${Date.now()}`, curText);
    return { state: null, source: 'corrupt' };
  }
  let oldText = null;
  try { oldText = await legacy.get(KEY_V1); } catch { /* لا يوجد localStorage */ }
  const old = migrate(parse(oldText));
  if (old) {
    await writeState(backend, old, null);
    return { state: old, source: 'v1' };
  }
  if (oldText != null) {
    // بيانات موجودة لكنها غير قابلة للقراءة: نحتفظ بنسخة منها قبل أن يكتب فوقها أي شيء
    await backend.set(`${KEY_DATA}:corrupt-${Date.now()}`, oldText);
    return { state: null, source: 'corrupt' };
  }
  return { state: null, source: 'fresh' };
}

/** يكتب الحالة. lastPhoto: آخر صورة محفوظة لتجنب إعادة كتابتها. يرجع الصورة المحفوظة الآن */
export async function writeState(backend, state, lastPhoto) {
  const { carPhoto = '', ...settings } = state.settings || {};
  const data = { schemaVersion: SCHEMA_VERSION, settings, charges: state.charges, bills: state.bills, odos: state.odos, demo: !!state.demo };
  await backend.set(KEY_DATA, JSON.stringify(data));
  if (carPhoto !== lastPhoto) {
    if (carPhoto) await backend.set(KEY_PHOTO, carPhoto);
    else await backend.remove(KEY_PHOTO);
  }
  return carPhoto;
}

/**
 * حافظ مؤجَّل: schedule(state) يحفظ بعد delay، وflush() يحفظ فوراً ما هو معلّق.
 * onResult(ok, error) يُستدعى بعد كل محاولة.
 */
export function createSaver(backend, { delay = 300, onResult = () => {}, initialPhoto = null } = {}) {
  let pending = null;
  let timer = null;
  let lastPhoto = initialPhoto;
  let chain = Promise.resolve();

  const run = () => {
    clearTimeout(timer);
    timer = null;
    if (!pending) return chain;
    const s = pending;
    pending = null;
    chain = chain.then(async () => {
      try {
        lastPhoto = await writeState(backend, s, lastPhoto);
        onResult(true, null);
      } catch (e) {
        onResult(false, e);
      }
    });
    return chain;
  };

  return {
    schedule(state) {
      pending = state;
      clearTimeout(timer);
      timer = setTimeout(run, delay);
    },
    flush: run,
    hasPending: () => pending != null,
  };
}
