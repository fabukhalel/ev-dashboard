// المظهر: ثلاثة ثيمات (ليل عمّان افتراضي، ليموني، فيروزي) × ليلي/نهاري، وحجم الخط فقط (S6).
// الألوان نفسها متغيرات CSS في index.css؛ هنا نضبط data-palette والخط والحجم على <html>.

export const PALETTES = {
  amman: { font: "'Readex Pro', system-ui, sans-serif", bar: { dark: '#0d1520', light: '#eef2f6' }, preview: ['#16202d', '#f2b33d', '#6fd0e8'] },
  lime: { font: "'Readex Pro', system-ui, sans-serif", bar: { dark: '#0a0a0b', light: '#f1f2ee' }, preview: ['#151617', '#c5f04a', '#60a5fa'] },
  teal: { font: "'IBM Plex Sans Arabic', 'IBM Plex Sans', system-ui, sans-serif", bar: { dark: '#070c18', light: '#eef2f5' }, preview: ['#0f5d5f', '#2dd4bf', '#fbbf24'] },
};

export const paletteOf = (settings) => PALETTES[settings.palette] || PALETTES.amman;

/** الخط المستخدم في تقرير PDF وغيره خارج CSS */
export const fontOf = (settings) => paletteOf(settings).font;

/** يطبّق الثيم والخط وحجمه على عنصر <html>. eff: 'dark' | 'light'. يرجع لون شريط النظام */
export function applyAppearance(root, settings, eff) {
  const id = PALETTES[settings.palette] ? settings.palette : 'amman';
  root.dataset.palette = id;
  root.dataset.theme = eff;
  root.style.setProperty('--font', PALETTES[id].font);
  root.style.fontSize = `${settings.fontPx}px`;
  return PALETTES[id].bar[eff] || PALETTES[id].bar.dark;
}

// أدوات ألوان صغيرة (لرسمة السيارة في صفحة السيارة)
export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgbToHex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
/** خلط لون مع آخر بنسبة k (0..1) */
export const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
