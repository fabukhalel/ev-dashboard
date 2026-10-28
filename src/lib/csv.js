import { Capacitor } from '@capacitor/core';
import { sortChrono } from './calc.js';
import { formatDate } from './format.js';

const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** t: دالة الترجمة، فتُكتب رؤوس الأعمدة بلغة الواجهة الحالية */
export function chargesToCsv(charges, t) {
  const headers = [
    t('csv_date'), t('csv_type'), t('csv_before'), t('csv_after'), t('csv_energy'),
    t('csv_price'), t('csv_total'), t('csv_odo'), t('csv_note'),
  ];
  const rows = sortChrono(charges).map((c) => [
    formatDate(c.date),
    c.type === 'fast' ? t('type_fast_dc') : t('type_home_ac'),
    c.socBefore,
    c.socAfter,
    Number(c.energyKwh.toFixed(2)),
    Number((c.pricePerKwh ?? 0).toFixed(4)),
    Number((c.totalCost ?? 0).toFixed(3)),
    c.odometer ?? '',
    c.note ?? '',
  ]);
  // BOM ضروري ليفتح Excel الملف بترميز UTF-8 ويعرض العربية صحيحة
  return `﻿${[headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')}`;
}

/** حفظ ملف: تنزيل في المتصفح، أو مشاركة/حفظ عبر Capacitor داخل تطبيق أندرويد */
export async function saveFile(filename, text, mime = 'text/csv;charset=utf-8') {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, url: res.uri, dialogTitle: filename });
    return;
  }
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const toBase64 = (bytes) => {
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(bin);
};

/** حفظ ملف ثنائي (PDF مثلاً): تنزيل في المتصفح أو مشاركة داخل تطبيق أندرويد */
export async function saveBinary(filename, bytes, mime = 'application/octet-stream') {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({ path: filename, data: toBase64(bytes), directory: Directory.Cache });
    await Share.share({ title: filename, url: res.uri, dialogTitle: filename });
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
