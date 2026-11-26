// كل تغييرات بيانات التطبيق في مكان واحد: دالة نقية (state, action) => state جديدة.
// لا تحفظ ولا تعرض رسائل؛ هذا عمل store.jsx. لذلك يسهل اختبارها وحدها.
// بعد أي تغيير يمس الشحنات أو التعرفة أو الدورة أو الفواتير يُعاد حساب شرائح الشحن المنزلي (tiers.js).

import { defaultSettings } from '../lib/storage.js';
import { makeDemo, isDemoOdo } from '../lib/demo.js';
import { retier, adoptOld } from '../lib/tiers.js';

export const CURRENCY_BY_LANG = { ar: 'د.أ', en: 'JOD' };

const upsert = (list, item) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const withTiers = (s) => {
  const charges = retier(s.charges, s.settings, s.bills);
  return charges === s.charges ? s : { ...s, charges };
};
const TIER_KEYS = ['tariff', 'cycleStartDay', 'tierDays'];

export function reducer(s, a) {
  switch (a.type) {
    case 'charge/save':
      // أول شحنة حقيقية تستبدل البيانات التجريبية (وقراءات العداد التجريبية)
      if (s.demo && !s.charges.some((x) => x.id === a.charge.id)) {
        return withTiers({ ...s, demo: false, charges: [a.charge], odos: s.odos.filter((o) => !isDemoOdo(o)) });
      }
      return withTiers({ ...s, charges: upsert(s.charges, a.charge) });
    case 'charge/delete':
      return withTiers({ ...s, charges: s.charges.filter((x) => x.id !== a.id) });
    case 'charge/restore': // «تراجع» بعد الحذف
      return withTiers({ ...s, charges: upsert(s.charges, a.charge) });
    case 'bill/save':
      return withTiers({ ...s, bills: upsert(s.bills, a.bill) });
    case 'bill/delete':
      return withTiers({ ...s, bills: s.bills.filter((x) => x.id !== a.id) });
    case 'odo/add':
      return { ...s, odos: [...s.odos, { id: a.id || newId(), ...a.odo }] };
    case 'odo/delete':
      return { ...s, odos: s.odos.filter((x) => x.id !== a.id) };
    case 'settings/change': {
      const next = { ...s.settings, ...a.patch };
      // عند تبديل اللغة نبدّل رمز العملة الافتراضي فقط إن لم يغيّره المستخدم
      if (a.patch.lang && a.patch.lang !== s.settings.lang) {
        const other = a.patch.lang === 'ar' ? 'en' : 'ar';
        if (next.currency === CURRENCY_BY_LANG[other]) next.currency = CURRENCY_BY_LANG[a.patch.lang];
      }
      const out = { ...s, settings: next };
      return TIER_KEYS.some((k) => k in a.patch) ? withTiers(out) : out;
    }
    case 'settings/reset': {
      // نعيد الإعدادات الافتراضية مع إبقاء المظهر واللغة
      const { lang, theme, fontPx, palette, homeLayout, recentCount, lastBackupAt } = s.settings;
      return withTiers({ ...s, settings: { ...defaultSettings(), lang, theme, fontPx, palette, homeLayout, recentCount, lastBackupAt, currency: CURRENCY_BY_LANG[lang] } });
    }
    case 'charges/adoptOld':
      return { ...s, charges: adoptOld(s.charges, s.settings, s.bills) };
    case 'data/replace':
      return withTiers({ ...a.data, demo: false });
    case 'charges/demo': {
      const demo = makeDemo(s.settings, a.today || new Date(), (list) => retier(list, s.settings, s.bills));
      return { ...s, demo: true, charges: demo.charges, odos: [...s.odos.filter((o) => !isDemoOdo(o)), ...demo.odos] };
    }
    case 'charges/clear':
      return { ...s, demo: false, charges: [], odos: s.odos.filter((o) => !isDemoOdo(o)) };
    default:
      return s;
  }
}
