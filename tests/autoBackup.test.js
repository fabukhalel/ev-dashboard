import { describe, it, expect } from 'vitest';
import { isDue, sortBackups, maybeAutoBackup, listBackups, backupDate, KEY_LAST, BACKUP_DIR } from '../src/lib/autoBackup.js';
import { parseBackup, defaultSettings } from '../src/lib/storage.js';

function memFs() {
  const files = new Map();
  return {
    files,
    async list(dir) { return [...files.keys()].filter((p) => p.startsWith(`${dir}/`)).map((p) => p.slice(dir.length + 1)); },
    async write(p, d) { files.set(p, d); },
    async read(p) { return files.get(p); },
    async remove(p) { files.delete(p); },
    async uri(p) { return `file:///${p}`; },
  };
}
function memStore() {
  const m = new Map();
  return { m, async get(k) { return m.get(k) ?? null; }, async set(k, v) { m.set(k, v); } };
}

const state = {
  settings: defaultSettings(),
  charges: [{ id: 'c1', date: '2026-11-01', time: '21:00', socBefore: 20, socAfter: 80, energyKwh: 36.3, pricePerKwh: 0.1, totalCost: 3.63, type: 'home', createdAt: 1 }],
  bills: [], odos: [], demo: false,
};
const day = (s) => new Date(`${s}T10:00:00`);

describe('autoBackup', () => {
  it('isDue', () => {
    expect(isDue(null)).toBe(true);
    expect(isDue(NaN)).toBe(true);
    const t = day('2026-11-01').getTime();
    expect(isDue(t, t + 6 * 86400000)).toBe(false);
    expect(isDue(t, t + 7 * 86400000)).toBe(true);
  });

  it('writes a weekly backup that restores to the same data', async () => {
    const fs = memFs();
    const store = memStore();
    const r = await maybeAutoBackup(state, { fs, store, now: day('2026-11-27') });
    expect(r.written).toBe('ev-auto-2026-11-27.json');
    expect(parseBackup(fs.files.get(`${BACKUP_DIR}/ev-auto-2026-11-27.json`)).charges[0]).toMatchObject(state.charges[0]);
    // بعد 3 أيام: لا نسخة جديدة
    expect((await maybeAutoBackup(state, { fs, store, now: day('2026-11-30') })).written).toBeNull();
    // تغيير تاريخ آخر نسخة يدوياً (كما في خطة التحقق) ينتج نسخة جديدة
    store.m.set(KEY_LAST, String(day('2026-11-01').getTime()));
    expect((await maybeAutoBackup(state, { fs, store, now: day('2026-11-30') })).written).toBe('ev-auto-2026-11-30.json');
  });

  it('keeps only the last 5 and avoids name clashes', async () => {
    const fs = memFs();
    const store = memStore();
    for (let i = 1; i <= 7; i++) await maybeAutoBackup(state, { fs, store, now: day(`2026-10-0${i}`), force: true });
    await maybeAutoBackup(state, { fs, store, now: day('2026-10-07'), force: true });
    const names = await listBackups(fs);
    expect(names).toHaveLength(5);
    expect(names[0]).toBe('ev-auto-2026-10-07.json');
    expect(names).toContain('ev-auto-2026-10-07-2.json');
    expect(backupDate(names[1])).toBe('2026-10-07');
  });

  it('skips demo data and empty logs', async () => {
    const fs = memFs();
    expect((await maybeAutoBackup({ ...state, demo: true }, { fs, store: memStore() })).written).toBeNull();
    expect((await maybeAutoBackup({ ...state, charges: [] }, { fs, store: memStore() })).written).toBeNull();
  });

  it('sortBackups ignores foreign files', () => {
    expect(sortBackups(['x.json', 'ev-auto-2026-01-01.json', 'ev-auto-2026-02-01.json'])).toEqual(['ev-auto-2026-02-01.json', 'ev-auto-2026-01-01.json']);
  });
});
