// تنظيف البيانات + النسخ الاحتياطي JSON (الحفظ الدائم في persist.js)

import { defaultTariff, TARIFF_PLANS } from './tariff.js';
import { PERIOD_KINDS, CUSTOM_PRESETS, DEFAULT_CYCLE_DAY, migratePeriodMode } from './cycle.js';
import { DEFAULT_TIER_DAYS } from './tiers.js';

export const HOME_SECTIONS = ['hero', 'stats', 'bill', 'recent'];
export const PALETTE_IDS = ['lime', 'teal'];
export const RECENT_COUNTS = [3, 5, 10];
const THEMES = ['system', 'dark', 'light'];
const OLD_FONT_PX = { sm: 13, md: 14.5, lg: 16 };
export const MIN_FONT_PX = 13;
export const DEFAULT_FONT_PX = 15;
export const MAX_FONT_PX = 19;
const STYLES = ['auto', 'sedan', 'suv', 'hatch', 'pickup', 'yuan'];
export const DEFAULT_CAR_COLOR = '#9aa5b4'; // فضي محايد للرسم الاحتياطي
const HEX = /^#[0-9a-fA-F]{6}$/;

export const MIN_CAPACITY = 5;
export const MAX_CAPACITY = 300;

export function defaultSettings() {
  return {
    userName: '',
    carName: 'BYD',
    carModel: 'Yuan Plus',
    capacity: 60.48, // kWh
    currency: 'د.أ',
    fastPrice: 0.25, // السعر الافتراضي لكيلوواط الشحن السريع
    defaultEfficiency: 16, // kWh/100km حتى تتوفر قراءات عداد كافية
    lang: 'ar',
    theme: 'system',
    palette: 'lime', // ليموني (افتراضي) | فيروزي
    fontPx: DEFAULT_FONT_PX,
    carColor: DEFAULT_CAR_COLOR,
    periodMode: 'month', // month | cycle | custom
    periodPreset: '', // للمخصص: last7 | last30 | all | '' (من/إلى)
    periodStart: '',
    periodEnd: '',
    cycleStartDay: DEFAULT_CYCLE_DAY, // يوم بداية دورة الفاتورة (1..28)
    tierDays: { ...DEFAULT_TIER_DAYS }, // أول N أيام = الشريحة الأولى، آخر M أيام = العليا
    tariff: defaultTariff(),
    bill: { start: '', end: '', total: '', loss: '' },
    carStyle: 'auto',
    carPhoto: '',
    homeLayout: [
      { id: 'hero', visible: true },
      { id: 'stats', visible: true },
      { id: 'bill', visible: true },
      { id: 'recent', visible: true },
    ],
    recentCount: 5,
    lastBackupAt: 0, // آخر نسخة احتياطية (ms): تصدير يدوي أو تلقائي
  };
}

export const DEFAULT_SETTINGS = defaultSettings();

export const uid = () =>
  (globalThis.crypto && globalThis.crypto.randomUUID && globalThis.crypto.randomUUID()) ||
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** تنظيف سجل شحنة قادم من ملف خارجي */
export function sanitizeCharge(r) {
  if (!r || typeof r !== 'object') return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null;
  const time = /^\d{2}:\d{2}$/.test(r.time) ? r.time : '00:00';
  const socBefore = toNum(r.socBefore);
  const socAfter = toNum(r.socAfter);
  const energyKwh = toNum(r.energyKwh);
  if (!date || socBefore == null || socAfter == null || energyKwh == null) return null;
  return {
    id: String(r.id || uid()),
    date,
    time,
    socBefore,
    socAfter,
    energyKwh,
    energyManual: !!r.energyManual,
    capacity: toNum(r.capacity),
    pricePerKwh: toNum(r.pricePerKwh) ?? 0,
    totalCost: toNum(r.totalCost) ?? 0,
    type: r.type === 'fast' ? 'fast' : 'home',
    odometer: toNum(r.odometer),
    tier: Number.isInteger(r.tier) && r.tier >= 0 && r.tier < 4 ? r.tier : null,
    tierSource: r.type !== 'fast' && (r.tierSource === 'auto' || r.tierSource === 'manual') ? r.tierSource : null,
    note: String(r.note || '').slice(0, 200),
    createdAt: toNum(r.createdAt) || Date.now(),
  };
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** فاتورة كهرباء: فترة واستهلاك كلي (kWh) ومبلغ اختياري */
export function sanitizeBill(r) {
  if (!r || typeof r !== 'object') return null;
  const kwh = toNum(r.kwh);
  if (!ISO.test(r.start) || !ISO.test(r.end) || r.start > r.end || kwh == null || kwh <= 0) return null;
  const amount = toNum(r.amount);
  return { id: String(r.id || uid()), start: r.start, end: r.end, kwh, amount: amount != null && amount >= 0 ? amount : null };
}

/** قراءة عداد السيارة (كم) في تاريخ معيّن */
export function sanitizeOdo(r) {
  if (!r || typeof r !== 'object') return null;
  const km = toNum(r.km);
  if (!ISO.test(r.date) || km == null || km < 0) return null;
  return { id: String(r.id || uid()), date: r.date, km };
}

export function sanitizeLayout(raw) {
  const base = defaultSettings().homeLayout;
  const seen = new Set();
  const out = [];
  if (Array.isArray(raw)) {
    // الشكل القديم: summary → البطاقة الرئيسية + التكلفة والعدد، charges → آخر الشحنات
    raw = raw.flatMap((it) => (it && it.id === 'summary' ? [{ ...it, id: 'hero' }, { ...it, id: 'stats' }] : it && it.id === 'charges' ? [{ ...it, id: 'recent' }] : [it]));
    for (const it of raw) {
      if (it && HOME_SECTIONS.includes(it.id) && !seen.has(it.id)) {
        seen.add(it.id);
        out.push({ id: it.id, visible: it.visible !== false });
      }
    }
  }
  // أي قسم جديد غير موجود في المحفوظ يُضاف بحالته الافتراضية وفي موضعه الافتراضي
  base.forEach((b, i) => {
    if (seen.has(b.id)) return;
    // يوضع بعد القسم الذي يسبقه في الترتيب الافتراضي إن وُجد
    const prev = i > 0 ? out.findIndex((x) => x.id === base[i - 1].id) : -1;
    out.splice(prev >= 0 ? prev + 1 : Math.min(i, out.length), 0, { ...b });
  });
  return out;
}

export function sanitizeTariff(raw) {
  const out = defaultTariff();
  if (!raw || typeof raw !== 'object') return out;
  if (typeof raw.effectiveFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.effectiveFrom)) out.effectiveFrom = raw.effectiveFrom;
  if (['subsidized', 'unsubsidized', 'custom'].includes(raw.plan)) out.plan = raw.plan;
  const n = Array.isArray(raw.tiers) ? raw.tiers.length : 0;
  let ok = false;
  if (n >= 2 && n <= 4) {
    const tiers = raw.tiers.map((t, i) => {
      const rate = toNum(t && t.rate);
      const upTo = i === n - 1 ? null : toNum(t && t.upTo);
      return rate != null && rate >= 0 && (i === n - 1 || (upTo != null && upTo > 0)) ? { upTo, rate } : null;
    });
    ok = tiers.every((t, i) => t && (i === 0 || i === n - 1 || t.upTo > tiers[i - 1].upTo)) && (n < 3 || tiers[n - 2].upTo > (n > 2 ? tiers[n - 3].upTo : 0));
    if (ok) out.tiers = tiers;
  }
  if (!ok && out.plan !== 'custom') out.tiers = TARIFF_PLANS[out.plan].map((x) => ({ ...x }));
  if (!ok && out.plan === 'custom') out.plan = 'subsidized';
  const extra = toNum(raw.extraFils);
  if (extra != null && extra >= 0 && extra <= 500) out.extraFils = extra;
  return out;
}

export function sanitizeSettings(s) {
  const out = defaultSettings();
  if (!s || typeof s !== 'object') return out;
  for (const k of ['userName', 'carName', 'carModel', 'currency']) {
    if (typeof s[k] === 'string') out[k] = s[k].slice(0, 40);
  }
  for (const k of ['capacity', 'fastPrice', 'defaultEfficiency']) {
    const n = toNum(s[k]);
    if (n != null && n >= 0) out[k] = n;
  }
  if (!(out.capacity >= MIN_CAPACITY && out.capacity <= MAX_CAPACITY)) out.capacity = defaultSettings().capacity;
  if (s.lang === 'ar' || s.lang === 'en') out.lang = s.lang;
  if (THEMES.includes(s.theme)) out.theme = s.theme;
  // إعدادات ما قبل التصميم الجديد (بلا palette): الحجم الافتراضي القديم 13 يصبح 15
  const legacy = !PALETTE_IDS.includes(s.palette);
  if (!legacy) out.palette = s.palette;
  let px = toNum(s.fontPx) ?? OLD_FONT_PX[s.fontSize];
  if (legacy && (px == null || px <= 13)) px = DEFAULT_FONT_PX;
  if (px != null && px >= MIN_FONT_PX && px <= MAX_FONT_PX) out.fontPx = px;
  if (typeof s.carColor === 'string' && HEX.test(s.carColor)) out.carColor = s.carColor;
  if (PERIOD_KINDS.includes(s.periodMode)) {
    out.periodMode = s.periodMode;
    if (CUSTOM_PRESETS.includes(s.periodPreset)) out.periodPreset = s.periodPreset;
  } else Object.assign(out, migratePeriodMode(s.periodMode));
  const day = toNum(s.cycleStartDay);
  if (Number.isInteger(day) && day >= 1 && day <= 28) out.cycleStartDay = day;
  if (s.tierDays && typeof s.tierDays === 'object') {
    for (const k of ['low', 'high']) {
      const n = toNum(s.tierDays[k]);
      if (Number.isInteger(n) && n >= 0 && n <= 20) out.tierDays[k] = n;
    }
  }
  if (RECENT_COUNTS.includes(s.recentCount)) out.recentCount = s.recentCount;
  const lb = toNum(s.lastBackupAt);
  if (lb != null && lb > 0) out.lastBackupAt = lb;
  for (const k of ['periodStart', 'periodEnd']) if (typeof s[k] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s[k])) out[k] = s[k];
  out.tariff = sanitizeTariff(s.tariff);
  if (s.bill && typeof s.bill === 'object') {
    for (const k of ['start', 'end']) if (typeof s.bill[k] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.bill[k])) out.bill[k] = s.bill[k];
    for (const k of ['total', 'loss']) if (typeof s.bill[k] === 'string' && s.bill[k].length < 12) out.bill[k] = s.bill[k];
  }
  if (STYLES.includes(s.carStyle)) out.carStyle = s.carStyle;
  if (typeof s.carPhoto === 'string' && s.carPhoto.startsWith('data:image/') && s.carPhoto.length < 400000) out.carPhoto = s.carPhoto;
  out.homeLayout = sanitizeLayout(s.homeLayout);
  return out;
}

export function makeBackup(state) {
  return JSON.stringify(
    { app: 'ev-dashboard', version: 1, exportedAt: new Date().toISOString(), ...state },
    null,
    2,
  );
}

/** يقرأ نسخة احتياطية ويُرجع {settings, charges} أو يرمي Error('invalid_backup') */
export function parseBackup(text) {
  const p = JSON.parse(text);
  if (!p || p.app !== 'ev-dashboard' || !Array.isArray(p.charges)) {
    throw new Error('invalid_backup');
  }
  return {
    settings: sanitizeSettings(p.settings),
    charges: p.charges.map(sanitizeCharge).filter(Boolean),
    bills: (Array.isArray(p.bills) ? p.bills : []).map(sanitizeBill).filter(Boolean),
    odos: (Array.isArray(p.odos) ? p.odos : []).map(sanitizeOdo).filter(Boolean),
  };
}
