import { describe, it, expect } from 'vitest';
import { reducer } from '../src/state/reducer.js';
import { defaultSettings } from '../src/lib/storage.js';

const base = () => ({ settings: defaultSettings(), charges: [], bills: [], odos: [], demo: false });
const ch = (id, extra = {}) => ({ id, date: '2026-11-01', type: 'home', before: 20, after: 80, ...extra });

describe('reducer', () => {
  it('adds, updates and deletes a charge', () => {
    let s = reducer(base(), { type: 'charge/save', charge: ch('a') });
    expect(s.charges).toHaveLength(1);
    s = reducer(s, { type: 'charge/save', charge: ch('a', { after: 90 }) });
    expect(s.charges).toEqual([ch('a', { after: 90 })]);
    s = reducer(s, { type: 'charge/delete', id: 'a' });
    expect(s.charges).toEqual([]);
  });

  it('first real charge replaces demo data', () => {
    const s = reducer({ ...base(), demo: true, charges: [ch('d1'), ch('d2')] }, { type: 'charge/save', charge: ch('new') });
    expect(s.demo).toBe(false);
    expect(s.charges.map((c) => c.id)).toEqual(['new']);
  });

  it('editing a demo charge keeps demo mode', () => {
    const s = reducer({ ...base(), demo: true, charges: [ch('d1'), ch('d2')] }, { type: 'charge/save', charge: ch('d1', { after: 70 }) });
    expect(s.demo).toBe(true);
    expect(s.charges).toHaveLength(2);
  });

  it('bills and odometer readings', () => {
    let s = reducer(base(), { type: 'bill/save', bill: { id: 'b', kwh: 300 } });
    s = reducer(s, { type: 'bill/save', bill: { id: 'b', kwh: 350 } });
    expect(s.bills).toEqual([{ id: 'b', kwh: 350 }]);
    s = reducer(s, { type: 'bill/delete', id: 'b' });
    expect(s.bills).toEqual([]);
    s = reducer(s, { type: 'odo/add', odo: { date: '2026-11-02', km: 1000 }, id: 'o1' });
    expect(s.odos).toEqual([{ id: 'o1', date: '2026-11-02', km: 1000 }]);
    s = reducer(s, { type: 'odo/add', odo: { date: '2026-11-03', km: 1100 } });
    expect(s.odos[1].id).toMatch(/\w+-\w+/);
    s = reducer(s, { type: 'odo/delete', id: 'o1' });
    expect(s.odos).toHaveLength(1);
  });

  it('switching language swaps the default currency only', () => {
    let s = reducer(base(), { type: 'settings/change', patch: { lang: 'en' } });
    expect(s.settings.currency).toBe('JOD');
    s = reducer(s, { type: 'settings/change', patch: { currency: 'USD' } });
    s = reducer(s, { type: 'settings/change', patch: { lang: 'ar' } });
    expect(s.settings.currency).toBe('USD');
  });

  it('reset keeps appearance and language', () => {
    let s = reducer(base(), { type: 'settings/change', patch: { lang: 'en', theme: 'light', capacity: 99 } });
    s = reducer(s, { type: 'settings/reset' });
    expect(s.settings.lang).toBe('en');
    expect(s.settings.theme).toBe('light');
    expect(s.settings.currency).toBe('JOD');
    expect(s.settings.capacity).toBe(defaultSettings().capacity);
  });

  it('replace, demo, clear', () => {
    let s = reducer(base(), { type: 'data/replace', data: { ...base(), charges: [ch('x')], demo: true } });
    expect(s.demo).toBe(false);
    expect(s.charges).toHaveLength(1);
    s = reducer(s, { type: 'charges/demo' });
    expect(s.demo).toBe(true);
    expect(s.charges.length).toBeGreaterThan(5);
    s = reducer(s, { type: 'charges/clear' });
    expect(s).toMatchObject({ demo: false, charges: [] });
    expect(reducer(s, { type: 'unknown' })).toBe(s);
  });
});
