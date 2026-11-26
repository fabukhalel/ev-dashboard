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
