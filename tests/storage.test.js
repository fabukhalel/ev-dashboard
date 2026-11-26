import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  defaultSettings, sanitizeCharge, sanitizeBill, sanitizeOdo, sanitizeLayout, sanitizeTariff, sanitizeSettings,
  loadState, saveState, makeBackup, parseBackup,
} from '../src/lib/storage.js';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
}

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
    expect(sanitizeLayout([{ id: 'charges', visible: false }, { id: 'charges' }, { id: 'hack' }])).toEqual([
      { id: 'summary', visible: true },
      { id: 'charges', visible: false },
    ]);
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
    const s = sanitizeSettings({ capacity: 9999, lang: 'fr', theme: 'dark', fontSize: 'lg', colors: { accent: '#ABCDEF', home: 'red' }, carPhoto: 'javascript:alert(1)', userName: 'x'.repeat(100) });
    expect(s.capacity).toBe(60.48);
    expect(s.lang).toBe('ar');
    expect(s.theme).toBe('dark');
    expect(s.fontPx).toBe(16);
    expect(s.colors).toEqual({ accent: '#abcdef', home: '', fast: '' });
    expect(s.carPhoto).toBe('');
    expect(s.userName).toHaveLength(40);
    expect(sanitizeSettings('nope')).toEqual(defaultSettings());
  });
});

describe('load / save / backup', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });

  it('loadState on empty storage is fresh', () => {
    const s = loadState();
    expect(s.fresh).toBe(true);
    expect(s.charges).toEqual([]);
  });

  it('save then load round-trips and sanitizes', () => {
    saveState({ settings: { ...defaultSettings(), userName: 'Fadi' }, charges: [good, { bad: true }], bills: [], odos: [], demo: false });
    const s = loadState();
    expect(s.fresh).toBe(false);
    expect(s.settings.userName).toBe('Fadi');
    expect(s.charges).toHaveLength(1);
  });

  it('corrupted storage falls back to fresh state', () => {
    localStorage.setItem('ev-dashboard:v1', '{not json');
    expect(loadState().fresh).toBe(true);
  });

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
