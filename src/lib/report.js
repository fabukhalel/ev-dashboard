// تقرير PDF بلا مكتبات: نرسم كل صفحة على canvas (يتولى المتصفح تشكيل العربية واتجاهها)
// ثم نحفظها JPEG داخل ملف PDF بسيط. يعمل في المتصفح وفي WebView أندرويد دون إضافات.

import { sortChrono } from './calc.js';
import { periodStats, billResult } from './analysis.js';
import { FONT_STACKS } from './theme.js';
import { formatDate, fix, num, todayStr } from './format.js';

const W = 1240;
const H = 1754; // A4 بدقة 150 نقطة/إنش
const M = 70;
const FOOT = 1690;
const ROW = 54;

const INK = '#0f2a33';
const MUTED = '#5a7279';
const LINE = '#d6e8ec';
const TEAL = '#0e7490';
const AMBER = '#b45309';
const SOFT = '#f1f8fa';

function bytesFromDataUrl(url) {
  const bin = atob(url.slice(url.indexOf(',') + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** يجمع صفحات JPEG في ملف PDF (صفحة A4 لكل صورة) */
export function makePdf(pages) {
  const enc = new TextEncoder();
  const parts = [];
  let len = 0;
  const push = (u8) => { parts.push(u8); len += u8.length; };
  const str = (s) => push(enc.encode(s));
  const offsets = [];
  const obj = (id, fn) => { offsets[id] = len; str(`${id} 0 obj\n`); fn(); str('endobj\n'); };
  const n = pages.length;
  push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  obj(1, () => str('<< /Type /Catalog /Pages 2 0 R >>\n'));
  obj(2, () => str(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${n} >>\n`));
  pages.forEach((p, i) => {
    const pid = 3 + i * 3;
    const content = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
    obj(pid, () => str(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${pid + 2} 0 R >> >> /Contents ${pid + 1} 0 R >>\n`));
    obj(pid + 1, () => str(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\n`));
    obj(pid + 2, () => {
      str(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`);
      push(p.bytes);
      str('\nendstream\n');
    });
  });
  const total = 3 + n * 3;
  const xref = len;
  str(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let id = 1; id < total; id++) str(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  str(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(len);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

export async function buildReportPdf({ charges, bills, readings, settings, period, t, lang }) {
  const rtl = lang === 'ar';
  const family = FONT_STACKS[settings.fontFamily] || FONT_STACKS.tajawal;
  if (document.fonts && document.fonts.load) {
    try {
      await Promise.all([`400 24px ${family}`, `800 24px ${family}`].map((f) => document.fonts.load(f, 'أ0Aa')));
      await document.fonts.ready;
    } catch { /* نكمل بالخط الاحتياطي */ }
  }

  const canvases = [];
  let cv;
  let ctx;
  const newPage = () => {
    cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.direction = rtl ? 'rtl' : 'ltr';
    canvases.push(cv);
  };
  const font = (size, weight = 400) => { ctx.font = `${weight} ${size}px ${family}`; };
  // يرسم نصاً مع تصغير الخط تلقائياً ليتسع في maxW. side: 'start' | 'end' | 'center'
  const text = (s, x, y, { size = 26, weight = 400, color = INK, side = 'start', maxW = 1e9, dirOverride } = {}) => {
    let sz = size;
    font(sz, weight);
    while (ctx.measureText(s).width > maxW && sz > 12) { sz -= 1; font(sz, weight); }
    ctx.direction = dirOverride || (rtl ? 'rtl' : 'ltr');
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    // نحوّل start/end إلى left/right بحسب اتجاه الصفحة
    const align = side === 'center' ? 'center' : (side === 'start') === rtl ? 'right' : 'left';
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  };
  const xStart = (inset = 0) => (rtl ? W - M - inset : M + inset);
  const xEnd = (inset = 0) => (rtl ? M + inset : W - M - inset);
  const round = (x, y, w, h, r, fill, stroke) => {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  };

  const cur = settings.currency;
  const inP = (c) => (!period.start || c.date >= period.start) && (!period.end || c.date <= period.end);
  const list = sortChrono(charges.filter(inP));
  const stat = periodStats(charges, readings, period);
  const range = (() => {
    if (period.start) return { start: period.start, end: period.end };
    return list.length ? { start: list[0].date, end: list[list.length - 1].date } : null;
  })();

  // ---------- الصفحة الأولى: الترويسة والملخص ----------
  newPage();
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, '#22d3ee');
  g.addColorStop(1, '#34d399');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 210);
  text(t('rep_title'), xStart(), 98, { size: 64, weight: 800, color: '#06312f', maxW: 760 });
  text(`${settings.userName ? `${settings.userName} · ` : ''}${settings.carName} ${settings.carModel}`.trim(), xStart(), 148, { size: 30, weight: 700, color: '#06312f', maxW: 760 });
  text(`${num(settings.capacity, 2)} kWh`, xEnd(), 98, { size: 34, weight: 800, color: '#06312f', side: 'end', dirOverride: 'ltr' });
  if (range) {
    text(`${t('period_from')} ${formatDate(range.start)} ${t('period_to')} ${formatDate(range.end)}`, xStart(), 190, { size: 28, weight: 700, color: '#06312f', maxW: 900 });
  }

  let y = 250;
  const boxes = [
    [t('kpi_energy'), `${fix(stat.energy, 1)} kWh`],
    [t('kpi_cost'), `${fix(stat.cost, 2)} ${cur}`],
    [t('kpi_count'), String(stat.count)],
    [t('kpi_distance'), stat.distance != null ? `${stat.estimated ? '≈ ' : ''}${num(stat.distance, 0)} ${t('km')}` : '—'],
    [t('kpi_eff'), stat.efficiency != null ? `${stat.estimated ? '≈ ' : ''}${fix(stat.efficiency, 1)} kWh/100km` : '—'],
    [t('kpi_costkm'), stat.costPerKm != null ? `${stat.estimated ? '≈ ' : ''}${fix(stat.costPerKm, 3)} ${cur}` : '—'],
  ];
  const bw = (W - M * 2 - 40) / 3;
  boxes.forEach(([label, val], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = rtl ? W - M - bw - col * (bw + 20) : M + col * (bw + 20);
    const by = y + row * 150;
    round(bx, by, bw, 130, 22, SOFT, LINE);
    text(label, rtl ? bx + bw - 24 : bx + 24, by + 44, { size: 24, weight: 700, color: MUTED, maxW: bw - 48 });
    text(val, rtl ? bx + bw - 24 : bx + 24, by + 98, { size: 40, weight: 800, color: INK, maxW: bw - 48, dirOverride: 'ltr' });
  });
  y += 2 * 150 + 10;
  if (stat.distance != null && stat.estimated) {
    text(t('rep_odo_note'), xStart(), y + 10, { size: 22, color: MUTED, maxW: W - M * 2 });
    y += 36;
  }

  // أثر السيارة على الفاتورة عند اختيار دورة فاتورة
  const bill = period.mode === 'bill' ? bills.find((b) => b.id === period.billId) : null;
  if (bill) {
    const r = billResult(bill, charges, settings.tariff, parseFloat(settings.bill.loss) || 0);
    y += 20;
    text(t('rep_bill'), xStart(), y + 30, { size: 34, weight: 800, color: TEAL });
    y += 52;
    const items = [
      [t('bill_total'), `${fix(bill.kwh, 0)} kWh`],
      [t('bill_with'), `${fix(r.res.billWith, 2)} ${cur}`],
      [t('bill_impact'), `${fix(r.res.impact, 2)} ${cur}`],
    ];
    items.forEach(([label, val], i) => {
      const bx = rtl ? W - M - bw - i * (bw + 20) : M + i * (bw + 20);
      round(bx, y, bw, 130, 22, i === 2 ? '#fff4e0' : SOFT, LINE);
      text(label, rtl ? bx + bw - 24 : bx + 24, y + 44, { size: 22, weight: 700, color: MUTED, maxW: bw - 48 });
      text(val, rtl ? bx + bw - 24 : bx + 24, y + 98, { size: 40, weight: 800, color: i === 2 ? AMBER : INK, maxW: bw - 48, dirOverride: 'ltr' });
    });
    y += 150;
  }

  // ---------- جدول الشحنات ----------
  y += 30;
  text(t('rep_charges'), xStart(), y + 30, { size: 34, weight: 800, color: TEAL });
  y += 56;
  const cols = [
    { k: 'date', label: t('date'), w: 190 },
    { k: 'time', label: t('rep_time'), w: 120 },
    { k: 'type', label: t('rep_type'), w: 150 },
    { k: 'soc', label: t('rep_soc'), w: 200 },
    { k: 'energy', label: 'kWh', w: 130 },
    { k: 'price', label: `${cur}/kWh`, w: 140 },
    { k: 'cost', label: cur, w: 170 },
  ];
  const scale = (W - M * 2) / cols.reduce((s, c) => s + c.w, 0);
  const colX = (() => {
    let acc = 0;
    return cols.map((c) => {
      const w = c.w * scale;
      const x0 = rtl ? W - M - acc - w : M + acc;
      acc += w;
      return { ...c, x0, w };
    });
  })();
  const cell = (c, s, yy, opts = {}) => text(s, c.x0 + c.w / 2, yy, { side: 'center', size: 25, maxW: c.w - 14, dirOverride: 'ltr', ...opts });
  const header = (yy) => {
    round(M, yy, W - M * 2, 52, 14, '#e4f3f7');
    colX.forEach((c) => cell(c, c.label, yy + 35, { weight: 800, size: 23, color: TEAL, dirOverride: undefined }));
  };
  header(y);
  y += 52;

  if (!list.length) {
    text(t('rep_none'), W / 2, y + 70, { size: 28, color: MUTED, side: 'center' });
  }
  list.forEach((c, idx) => {
    if (y + ROW > FOOT - 70) {
      newPage();
      y = 90;
      header(y);
      y += 52;
    }
    if (idx % 2 === 1) { ctx.fillStyle = '#f8fbfc'; ctx.fillRect(M, y, W - M * 2, ROW); }
    const fast = c.type === 'fast';
    const vals = {
      date: formatDate(c.date), time: c.time, type: fast ? t('type_fast_s') : t('type_home_s'),
      soc: `${num(c.socBefore, 0)} → ${num(c.socAfter, 0)}`, energy: fix(c.energyKwh, 1), price: fix(c.pricePerKwh, 3), cost: fix(c.totalCost, 2),
    };
    colX.forEach((col) => cell(col, vals[col.k], y + 36, { color: col.k === 'type' ? (fast ? AMBER : TEAL) : INK, weight: col.k === 'cost' ? 800 : 500, dirOverride: col.k === 'type' ? undefined : 'ltr' }));
    ctx.fillStyle = LINE;
    ctx.fillRect(M, y + ROW - 1, W - M * 2, 1);
    y += ROW;
  });
  if (list.length) {
    if (y + ROW > FOOT - 70) { newPage(); y = 90; }
    round(M, y + 8, W - M * 2, 56, 14, '#e4f3f7');
    colX.forEach((col) => {
      if (col.k === 'date') cell(col, `Σ ${list.length}`, y + 46, { weight: 800, color: TEAL });
      if (col.k === 'energy') cell(col, fix(stat.energy, 1), y + 46, { weight: 800, color: TEAL });
      if (col.k === 'cost') cell(col, fix(stat.cost, 2), y + 46, { weight: 800, color: TEAL });
    });
  }

  // ---------- تذييل كل صفحة ----------
  canvases.forEach((c, i) => {
    cv = c;
    ctx = c.getContext('2d');
    ctx.fillStyle = LINE;
    ctx.fillRect(M, FOOT, W - M * 2, 2);
    text(t('rep_page', { p: i + 1, n: canvases.length }), xStart(), FOOT + 46, { size: 22, color: MUTED, dirOverride: 'ltr' });
    text(`${t('rep_generated', { d: formatDate(todayStr()) })} · ${t('dev_by')}`, xEnd(), FOOT + 46, { size: 22, color: MUTED, side: 'end', dirOverride: 'ltr', maxW: 800 });
  });

  const pages = canvases.map((c) => ({ w: W, h: H, bytes: bytesFromDataUrl(c.toDataURL('image/jpeg', 0.92)) }));
  return makePdf(pages);
}
