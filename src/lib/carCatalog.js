// تحديد شكل الهيكل (سيدان/دفع رباعي/هاتشباك/بيك أب) من اسم السيارة وموديلها.
// الرسم المعروض شكل تقريبي حسب الفئة وليس صورة حقيقية، ويمكن رفع صورة السيارة من الإعدادات.
// لإضافة موديل جديد: أضف كلمته إلى القائمة المناسبة (بحروف صغيرة).

export const BODY_STYLES = ['sedan', 'suv', 'hatch', 'pickup', 'yuan'];

const MODELS = {
  // رسم مخصص مفصّل لـ BYD Yuan Plus (Atto 3)
  yuan: ['yuan plus', 'atto 3', 'yuan', 'يوان بلس', 'يوان'],
  pickup: ['cybertruck', 'lightning', 'r1t', 'hilux', 'pickup', 'f-150', 'f150', 'hummer', 'silverado'],
  suv: [
    // BYD
    'song plus', 'song pro', 'song l', 'tang', 'sealion', 'seal u', 'shark', 'yuan up',
    // Tesla
    'model y', 'model x',
    // Hyundai / Kia / Genesis
    'ioniq 5', 'ioniq 9', 'kona', 'ev6', 'ev9', 'ev5', 'niro', 'gv60', 'gv70',
    // أوروبي
    'id.4', 'id4', 'id.5', 'id.7', 'enyaq', 'q4', 'q8', 'e-tron', 'etron', 'ix3', 'ix1', 'ix ', 'eqa', 'eqb', 'eqc', 'xc40', 'ex30', 'ex40', 'ex90', 'c40', 'mach-e', 'mach e',
    // صيني
    'zs ev', 'mg zs', 'mg s5', 'hs ', 'zeekr x', 'zeekr 7x', '7x', 'xpeng g6', 'g6', 'g9', 'es6', 'es8', 'ec6', 'et5 touring', 'li l', 'l6', 'l7', 'l8', 'l9', 'jaecoo', 'omoda', 'vf 6', 'vf 7', 'vf 8', 'vf 9', 'vf6', 'vf7', 'vf8', 'vf9', 'deepal s07', 'aion v', 'aion y', 'galaxy e5', 'e5',
  ],
  hatch: [
    'dolphin', 'seagull', 'atto 2', 'leaf', 'bolt', 'id.3', 'id3', 'id.2', 'mg4', 'mg 4', 'zoe', 'twingo', 'e-208', 'e208', 'e-2008', '500e', 'mini', 'cooper se', 'spring', 'ora ', 'funky cat', 'polestar 2', 'corsa-e', 'e-up', 'i3', 'mulan', 'wuling', 'nano', 'megane', 'zeekr 001', 'zeekr001', 'ex 30 cross',
  ],
  sedan: [
    'seal', 'han', 'qin', 'destroyer', 'model 3', 'model s', 'ioniq 6', 'i4', 'i5', 'i7', 'eqe', 'eqs', 'taycan', 'lucid', 'air ', 'p7', 'su7', 'u7', 'g80', 'et7', 'a6 e-tron', 'e-tron gt', 'id.7 tourer',
  ],
};

/** يرجع أول نمط تتطابق كلمته مع النص؛ وإلا سيدان */
export function detectBodyStyle(name = '', model = '') {
  const s = ` ${`${name} ${model}`.toLowerCase().replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
  // الأطول أولاً حتى لا يلتقط "seal" داخل "seal u" ولا "model 3" داخل "model 3 highland" بطريق الخطأ
  const entries = [];
  for (const [style, words] of Object.entries(MODELS)) for (const w of words) entries.push([w, style]);
  entries.sort((a, b) => b[0].length - a[0].length);
  for (const [w, style] of entries) {
    const needle = w.endsWith(' ') ? w : w;
    // تطابق كلمة كاملة تقريباً: يسبقها حدّ كلمة
    const re = new RegExp(`(^|[^a-z0-9])${needle.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`);
    if (re.test(s)) return style;
  }
  return 'sedan';
}

export function resolveStyle(settings) {
  if (settings.carStyle && settings.carStyle !== 'auto') return settings.carStyle;
  return detectBodyStyle(settings.carName, settings.carModel);
}
