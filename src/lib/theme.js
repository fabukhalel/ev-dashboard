// تخصيص الألوان والخط: يُطبَّق على <html> كمتغيرات CSS، فتتبعها كل الواجهة

export const FONT_STACKS = {
  tajawal: "'Tajawal', system-ui, sans-serif",
  cairo: "'Cairo', system-ui, sans-serif",
  almarai: "'Almarai', system-ui, sans-serif",
  system: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

// ألوان الثيم الافتراضية (RGB) لحساب لون النص فوق التدرج
const DEFAULTS = {
  dark: { accent: [34, 211, 238], home: [52, 211, 153], fast: [251, 176, 64] },
  light: { accent: [34, 211, 238], home: [52, 211, 153], fast: [217, 119, 6] },
};

// ألوان جاهزة: [اسم المفتاح، accent، home، fast]
export const PALETTES = [
  { id: 'default', colors: { accent: '', home: '', fast: '' }, preview: ['#22d3ee', '#2ef2a0', '#ff9a3c'] },
  { id: 'blue', colors: { accent: '#3b82f6', home: '#10b981', fast: '#f59e0b' }, preview: ['#3b82f6', '#10b981', '#f59e0b'] },
  { id: 'indigo', colors: { accent: '#6366f1', home: '#14b8a6', fast: '#f59e0b' }, preview: ['#6366f1', '#14b8a6', '#f59e0b'] },
  { id: 'red', colors: { accent: '#ef4444', home: '#f59e0b', fast: '#22d3ee' }, preview: ['#ef4444', '#f59e0b', '#22d3ee'] },
  { id: 'gold', colors: { accent: '#eab308', home: '#84cc16', fast: '#f97316' }, preview: ['#eab308', '#84cc16', '#f97316'] },
  { id: 'mono', colors: { accent: '#94a3b8', home: '#5eead4', fast: '#fdba74' }, preview: ['#94a3b8', '#5eead4', '#fdba74'] },
];

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

const lin = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
export const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

/** خلط لون مع آخر بنسبة k (0..1) */
export const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

/** يطبّق الألوان والخط وحجمه على عنصر <html>. eff: 'dark' | 'light' */
export function applyAppearance(root, settings, eff) {
  const names = ['accent', 'home', 'fast'];
  const custom = {};
  for (const n of names) {
    const rgb = hexToRgb(settings.colors && settings.colors[n]);
    if (rgb) {
      custom[n] = rgb;
      root.style.setProperty(`--${n}`, rgb.join(' '));
    } else {
      root.style.removeProperty(`--${n}`);
    }
  }
  if (custom.accent || custom.home) {
    const base = DEFAULTS[eff] || DEFAULTS.dark;
    const a = custom.accent || base.accent;
    const h = custom.home || base.home;
    // لون النص فوق التدرج: داكن إن كان التدرج فاتحاً وإلا أبيض
    const lum = (luminance(a) + luminance(h)) / 2;
    root.style.setProperty('--onaccent', lum > 0.35 ? '4 6 12' : '255 255 255');
    root.style.setProperty('--brand1', a.join(' '));
    root.style.setProperty('--brand2', h.join(' '));
  } else {
    root.style.removeProperty('--onaccent');
    root.style.removeProperty('--brand1');
    root.style.removeProperty('--brand2');
  }
  root.style.setProperty('--font', FONT_STACKS[settings.fontFamily] || FONT_STACKS.tajawal);
  root.style.fontSize = `${settings.fontPx}px`;
}
