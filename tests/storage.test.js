import { describe, it, expect } from 'vitest';
import {
  defaultSettings, sanitizeCharge, sanitizeBill, sanitizeOdo, sanitizeLayout, sanitizeTariff, sanitizeSettings,
  makeBackup, parseBackup,
} from '../src/lib/storage.js';

const good = { id: 'x', date: '2026-11-01', time: '21:30', socBefore: '20', socAfter: 80, energyKwh: 36.3, pricePerKwh: 0.1, totalCost: 3.63, type: 'home', odometer: '18000', note: 'n', createdAt: 5 };

describe('sanitize', () => {
  it('sanitizeCharge keeps valid fields and coerces numbers', () => {
    const c = sanitizeCharge(good);
    expect(c).toMatchObject({ id: 'x', socBefore: 20, odometer: 18000, type: 'home', time: '21:30' });
  });

  it('sanitizeCharge rejects bad records and defaults the rest', () => {
    expect(sanitizeCharge(null)).toBeNull();
    expect(sanitizeCharge({ ...good, date: '01/11/2026' })).toBeNull();
    expect(sanitizeCharge({ ...good, energyKwh: 'abc' })).toBeNull();
    const c = sanitizeCharge({ ...good, type: 'weird', time: 'x', note: 'a'.repeat(500), odometer: '' });
    expect(c.type).toBe('home');
    expect(c.time).toBe('00:00');
    expect(c.note).toHaveLength(200);
    expect(c.odometer).toBeNull();
  });

  it('sanitizeBill / sanitizeOdo', () => {
    expect(sanitizeBill({ start: '2026-10-06', end: '2026-11-05', kwh: 700, amount: 60 })).toMatchObject({ kwh: 700, amount: 60 });
    expect(sanitizeBill({ start: '2026-11-06', end: '2026-11-05', kwh: 700 })).toBeNull();
    expect(sanitizeBill({ start: '2026-10-06', end: '2026-11-05', kwh: 0 })).toBeNull();
    expect(sanitizeBill({ start: '2026-10-06', end: '2026-11-05', kwh: 5, amount: -1 }).amount).toBeNull();
    expect(sanitizeOdo({ date: '2026-11-01', km: '120' }).km).toBe(120);
    expect(sanitizeOdo({ date: '2026-11-01', km: -1 })).toBeNull();
  });

  it('sanitizeLayout drops unknown/duplicate sections and adds missing ones', () => {
    expect(sanitizeLayout([{ id: 'recent', visible: false }, { id: 'recent' }, { id: 'hack' }])).toEqual([
      { id: 'hero', visible: true },
      { id: 'stats', visible: true },
      { id: 'bill', visible: true },
      { id: 'recent', visible: false },
    ]);
    // الشكل القديم (summary/charges) يُرحَّل للأقسام الجديدة مع الترتيب والإخفاء
    expect(sanitizeLayout([{ id: 'charges', visible: true }, { id: 'summary', visible: false }]).map((x) => `${x.id}:${x.visible}`))
      .toEqual(['recent:true', 'hero:false', 'stats:false', 'bill:true']);
    expect(sanitizeLayout(null)).toEqual(defaultSettings().homeLayout);
  });

  it('sanitizeTariff', () => {
    expect(sanitizeTariff(null).plan).toBe('subsidized');
    const custom = sanitizeTariff({ plan: 'custom', tiers: [{ upTo: 200, rate: 0.04 }, { upTo: null, rate: 0.3 }], extraFils: 5 });
    expect(custom.tiers).toEqual([{ upTo: 200, rate: 0.04 }, { upTo: null, rate: 0.3 }]);
    expect(custom.extraFils).toBe(5);
    // شرائح غير متصاعدة: مخصص يعود للمدعوم
    const bad = sanitizeTariff({ plan: 'custom', tiers: [{ upTo: 500, rate: 0.1 }, { upTo: 100, rate: 0.2 }, { rate: 0.3 }] });
    expect(bad.plan).toBe('subsidized');
    expect(sanitizeTariff({ plan: 'unsubsidized', tiers: 'x' }).tiers[0].rate).toBe(0.12);
    expect(sanitizeTariff({ extraFils: 9999 }).extraFils).toBe(0);
  });

  it('sanitizeSettings clamps and validates', () => {
    const s = sanitizeSettings({ capacity: 9999, lang: 'fr', theme: 'dark', fontSize: 'lg', palette: 'teal', carPhoto: 'javascript:alert(1)', userName: 'x'.repeat(100), cycleStartDay: 31, tierDays: { low: 12, high: -1 }, recentCount: 7 });
    expect(s.capacity).toBe(60.48);
    expect(s.lang).toBe('ar');
    expect(s.theme).toBe('dark');
    expect(s.fontPx).toBe(16);
    expect(s.palette).toBe('teal');
    expect(s.cycleStartDay).toBe(6);
    expect(s.tierDays).toEqual({ low: 12, high: 7 });
    expect(s.recentCount).toBe(5);
    expect(s.carPhoto).toBe('');
    expect(s.userName).toHaveLength(40);
    expect(sanitizeSettings('nope')).toEqual(defaultSettings());
  });

  it('migrates settings from before the new design', () => {
    const s = sanitizeSettings({ fontPx: 13, periodMode: 'bill', fontFamily: 'cairo', colors: { accent: '#ffffff' }, homePrice: 0.1 });
    expect(s.palette).toBe('lime');
    expect(s.fontPx).toBe(15);
    expect(s.periodMode).toBe('cycle');
    expect(s).not.toHaveProperty('fontFamily');
    expect(s).not.toHaveProperty('colors');
    expect(s).not.toHaveProperty('homePrice');
    expect(sanitizeSettings({ periodMode: 'all' })).toMatchObject({ periodMode: 'custom', periodPreset: 'all' });
    expect(sanitizeSettings({ periodMode: 'prev' }).periodMode).toBe('month');
    // من اختار حجماً أكبر يبقى عليه
    expect(sanitizeSettings({ fontPx: 17 }).fontPx).toBe(17);
    expect(sanitizeSettings({ palette: 'lime', fontPx: 12 }).fontPx).toBe(12);
    expect(sanitizeSettings({ palette: 'lime', fontPx: 11 }).fontPx).toBe(15);
  });

  it('keeps the tier fields of a home charge only', () => {
    expect(sanitizeCharge({ ...good, tier: 2, tierSource: 'manual' })).toMatchObject({ tier: 2, tierSource: 'manual' });
    expect(sanitizeCharge({ ...good, type: 'fast', tier: 1, tierSource: 'auto' }).tierSource).toBeNull();
    expect(sanitizeCharge({ ...good, tier: 9, tierSource: 'x' })).toMatchObject({ tier: null, tierSource: null });
  });
});

describe('load / save / backup', () => {
  it('backup round-trip keeps charges, bills and odometer readings', () => {
    const state = { settings: defaultSettings(), charges: [good], bills: [{ id: 'b', start: '2026-10-06', end: '2026-11-05', kwh: 700, amount: null }], odos: [{ id: 'o', date: '2026-11-02', km: 18100 }] };
    const text = makeBackup(state);
    expect(JSON.parse(text).app).toBe('ev-dashboard');
    const back = parseBackup(text);
    expect(back.charges).toHaveLength(1);
    expect(back.bills).toHaveLength(1);
    expect(back.odos).toHaveLength(1);
  });

  it('parseBackup rejects foreign files', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', charges: [] }))).toThrow('invalid_backup');
    expect(() => parseBackup('[]')).toThrow('invalid_backup');
  });
});
