import { describe, it, expect } from 'vitest';
import { chargesToCsv } from '../src/lib/csv.js';
import { detectBodyStyle, resolveStyle } from '../src/lib/carCatalog.js';
import { DICT, makeT } from '../src/lib/i18n.jsx';

describe('csv', () => {
  it('has BOM, sorted rows and escapes quotes/commas', () => {
    const t = (k) => k;
    const csv = chargesToCsv([
      { date: '2026-11-02', type: 'fast', socBefore: 30, socAfter: 80, energyKwh: 30.2444, pricePerKwh: 0.25, totalCost: 7.561, odometer: null, note: 'a, "b"' },
      { date: '2026-11-01', type: 'home', socBefore: 20, socAfter: 90, energyKwh: 42.336, pricePerKwh: 0.1, totalCost: 4.2336, odometer: 18000, note: '' },
    ], t);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[1].startsWith('01/11/2026,type_home_ac,20,90,42.34,0.1,4.234,18000,')).toBe(true);
    expect(lines[2].endsWith('"a, ""b"""')).toBe(true);
  });
});

describe('carCatalog', () => {
  it('detects body styles, longest match first', () => {
    expect(detectBodyStyle('BYD', 'Yuan Plus')).toBe('yuan');
    expect(detectBodyStyle('BYD', 'Seal U')).toBe('suv');
    expect(detectBodyStyle('BYD', 'Seal')).toBe('sedan');
    expect(detectBodyStyle('Tesla', 'Cybertruck')).toBe('pickup');
    expect(detectBodyStyle('Nissan', 'Leaf')).toBe('hatch');
    expect(detectBodyStyle('Unknown', 'Car')).toBe('sedan');
    expect(resolveStyle({ carStyle: 'suv', carName: 'Nissan', carModel: 'Leaf' })).toBe('suv');
    expect(resolveStyle({ carStyle: 'auto', carName: 'Nissan', carModel: 'Leaf' })).toBe('hatch');
  });
});

describe('i18n', () => {
  it('ar and en have the same keys', () => {
    const ar = Object.keys(DICT.ar).sort();
    const en = Object.keys(DICT.en).sort();
    expect(ar.filter((k) => !en.includes(k))).toEqual([]);
    expect(en.filter((k) => !ar.includes(k))).toEqual([]);
  });

  it('makeT falls back to the key', () => {
    expect(makeT('ar')('__missing__')).toBe('__missing__');
  });
});

// أمان: تصدير CSV لا يكتب معادلات قابلة للتنفيذ، والتحديث لا يفتح إلا صفحات المستودع، والنسخة الضخمة تُرفض
describe('security fixes', () => {
  it('CSV cells that start like a formula are prefixed with a quote; numbers stay numbers', async () => {
    const { esc } = await import('../src/lib/csv.js');
    expect(esc('=HYPERLINK("http://x","y")')).toBe(`"'=HYPERLINK(""http://x"",""y"")"`);
    expect(esc('+1')).toBe("'+1");
    expect(esc('-2+3')).toBe("'-2+3");
    expect(esc('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(esc('محطة المدينة')).toBe('محطة المدينة');
    expect(esc(-5)).toBe('-5');
    expect(esc(3.2)).toBe('3.2');
  });

  it('update link only accepts this repository release pages', async () => {
    const { safeReleaseUrl, RELEASES_URL } = await import('../src/pages/About.jsx');
    expect(safeReleaseUrl('https://github.com/fabukhalel/ev-dashboard/releases/tag/v2.1.0')).toBe('https://github.com/fabukhalel/ev-dashboard/releases/tag/v2.1.0');
    expect(safeReleaseUrl('javascript:alert(1)')).toBe(RELEASES_URL);
    expect(safeReleaseUrl('https://evil.example/releases/')).toBe(RELEASES_URL);
    expect(safeReleaseUrl('https://github.com/fabukhalel/ev-dashboard.evil.example/releases/x')).toBe(RELEASES_URL);
    expect(safeReleaseUrl(undefined)).toBe(RELEASES_URL);
  });

  it('a backup bigger than the limit is rejected before parsing', async () => {
    const { parseBackup, MAX_BACKUP_BYTES } = await import('../src/lib/storage.js');
    expect(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1))).toThrow('too_big');
    expect(parseBackup(JSON.stringify({ app: 'ev-dashboard', charges: [] })).charges).toEqual([]);
  });
});
