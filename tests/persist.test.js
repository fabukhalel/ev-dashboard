import { describe, it, expect, vi } from 'vitest';
import { migrate, loadPersisted, writeState, createSaver, localStorageBackend, KEY_V1, KEY_DATA, KEY_PHOTO, SCHEMA_VERSION } from '../src/lib/persist.js';
import { defaultSettings } from '../src/lib/storage.js';

function memory(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    map: m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async set(k, v) { m.set(k, String(v)); },
    async remove(k) { m.delete(k); },
  };
}

const charge = { id: 'c1', date: '2026-11-01', time: '21:00', socBefore: 20, socAfter: 80, energyKwh: 36.3, pricePerKwh: 0.1, totalCost: 3.63, type: 'home', createdAt: 1 };
const photo = 'data:image/jpeg;base64,AAAA';
const v1 = { settings: { ...defaultSettings(), userName: 'Fadi', carPhoto: photo }, charges: [charge, { junk: 1 }], bills: [], odos: [{ id: 'o', date: '2026-11-02', km: 18100 }], demo: false };

describe('migrate', () => {
  it('v1 (no schemaVersion) becomes v2 and is sanitized', () => {
    const m = migrate(v1);
    expect(m.schemaVersion).toBe(SCHEMA_VERSION);
    expect(m.charges).toHaveLength(1);
    expect(m.odos).toHaveLength(1);
    expect(m.settings.userName).toBe('Fadi');
  });
  it('rejects garbage and newer schemas', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate('x')).toBeNull();
    expect(migrate({ ...v1, schemaVersion: 99 })).toBeNull();
  });
});

describe('loadPersisted', () => {
  it('fresh install', async () => {
    const r = await loadPersisted(memory(), memory());
    expect(r).toEqual({ state: null, source: 'fresh' });
  });

  it('migrates v1 from localStorage once and keeps the original', async () => {
    const be = memory();
    const legacy = memory({ [KEY_V1]: JSON.stringify(v1) });
    const r = await loadPersisted(be, legacy);
    expect(r.source).toBe('v1');
    expect(r.state.charges).toHaveLength(1);
    // نُقلت البيانات، والصورة في مفتاح مستقل وليست داخل البيانات
    const saved = JSON.parse(be.map.get(KEY_DATA));
    expect(saved.schemaVersion).toBe(2);
    expect(saved.settings.carPhoto).toBeUndefined();
    expect(be.map.get(KEY_PHOTO)).toBe(photo);
    expect(legacy.map.get(KEY_V1)).toBe(JSON.stringify(v1));
    // التشغيل الثاني يقرأ المفتاح الجديد ويعيد الصورة إلى الإعدادات
    const again = await loadPersisted(be, legacy);
    expect(again.source).toBe('data');
    expect(again.state.settings.carPhoto).toBe(photo);
  });

  it('corrupt data is preserved under a separate key, not overwritten', async () => {
    const be = memory({ [KEY_DATA]: '{broken' });
    const r = await loadPersisted(be, memory());
    expect(r.source).toBe('corrupt');
    const copies = [...be.map.keys()].filter((k) => k.startsWith(`${KEY_DATA}:corrupt-`));
    expect(copies).toHaveLength(1);
    expect(be.map.get(copies[0])).toBe('{broken');
  });

  it('unreadable new data is never replaced by the old v1 copy', async () => {
    const newer = JSON.stringify({ ...v1, schemaVersion: 99 });
    const be = memory({ [KEY_DATA]: newer });
    const r = await loadPersisted(be, memory({ [KEY_V1]: JSON.stringify(v1) }));
    expect(r.source).toBe('corrupt');
    expect(be.map.get(KEY_DATA)).toBe(newer);
    const copies = [...be.map.keys()].filter((k) => k.startsWith(`${KEY_DATA}:corrupt-`));
    expect(be.map.get(copies[0])).toBe(newer);
  });

  it('works with the localStorage backend', async () => {
    const m = new Map();
    const ls = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
    const be = localStorageBackend(ls);
    await writeState(be, migrate(v1), null);
    const r = await loadPersisted(be, be);
    expect(r.source).toBe('data');
  });
});

describe('writeState', () => {
  it('writes the photo only when it changes, and removes it when cleared', async () => {
    const be = memory();
    const spy = vi.spyOn(be, 'set');
    const s = migrate(v1);
    let last = await writeState(be, s, null);
    expect(spy.mock.calls.filter(([k]) => k === KEY_PHOTO)).toHaveLength(1);
    last = await writeState(be, s, last);
    expect(spy.mock.calls.filter(([k]) => k === KEY_PHOTO)).toHaveLength(1);
    await writeState(be, { ...s, settings: { ...s.settings, carPhoto: '' } }, last);
    expect(be.map.has(KEY_PHOTO)).toBe(false);
  });
});

describe('createSaver', () => {
  it('debounces, flushes immediately, and reports failures', async () => {
    vi.useFakeTimers();
    const be = memory();
    const results = [];
    const saver = createSaver(be, { delay: 300, onResult: (ok) => results.push(ok) });
    const s = migrate(v1);
    saver.schedule({ ...s, charges: [] });
    saver.schedule(s);
    expect(be.map.has(KEY_DATA)).toBe(false);
    await vi.advanceTimersByTimeAsync(300);
    expect(JSON.parse(be.map.get(KEY_DATA)).charges).toHaveLength(1);
    expect(results).toEqual([true]);

    // إغلاق التطبيق مباشرة بعد إضافة شحنة: flush يحفظ فوراً دون انتظار المؤقت
    saver.schedule({ ...s, charges: [charge, { ...charge, id: 'c2' }] });
    await saver.flush();
    expect(JSON.parse(be.map.get(KEY_DATA)).charges).toHaveLength(2);
    expect(saver.hasPending()).toBe(false);

    be.set = async () => { throw new Error('disk full'); };
    saver.schedule(s);
    await saver.flush();
    expect(results.at(-1)).toBe(false);
    vi.useRealTimers();
  });
});
