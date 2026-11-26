// كل تغييرات بيانات التطبيق في مكان واحد: دالة نقية (state, action) => state جديدة.
// لا تحفظ ولا تعرض رسائل؛ هذا عمل store.jsx. لذلك يسهل اختبارها وحدها.

import { defaultSettings } from '../lib/storage.js';
import { makeDemoCharges } from '../lib/demo.js';

export const CURRENCY_BY_LANG = { ar: 'د.أ', en: 'JOD' };

const upsert = (list, item) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function reducer(s, a) {
  switch (a.type) {
    case 'charge/save':
      // أول شحنة حقيقية تستبدل البيانات التجريبية
      if (s.demo && !s.charges.some((x) => x.id === a.charge.id)) return { ...s, demo: false, charges: [a.charge] };
      return { ...s, charges: upsert(s.charges, a.charge) };
    case 'charge/delete':
      return { ...s, charges: s.charges.filter((x) => x.id !== a.id) };
    case 'bill/save':
      return { ...s, bills: upsert(s.bills, a.bill) };
    case 'bill/delete':
      return { ...s, bills: s.bills.filter((x) => x.id !== a.id) };
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
      return { ...s, settings: next };
    }
    case 'settings/reset': {
      // نعيد الإعدادات الافتراضية مع إبقاء المظهر واللغة
      const { lang, theme, fontPx, fontFamily, colors } = s.settings;
      return { ...s, settings: { ...defaultSettings(), lang, theme, fontPx, fontFamily, colors, currency: CURRENCY_BY_LANG[lang] } };
    }
    case 'data/replace':
      return { ...a.data, demo: false };
    case 'charges/demo':
      return { ...s, demo: true, charges: makeDemoCharges(s.settings.capacity, s.settings) };
    case 'charges/clear':
      return { ...s, demo: false, charges: [] };
    default:
      return s;
  }
}
