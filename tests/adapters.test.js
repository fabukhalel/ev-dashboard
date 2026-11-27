import { describe, it, expect } from 'vitest';
import { preferencesBackend, localStorageBackend } from '../src/lib/persist.js';
import { capacitorFs } from '../src/lib/autoBackup.js';

// محوّلات التخزين تُختبر بنسخ وهمية من إضافات Capacitor
describe('storage adapters', () => {
  it('preferencesBackend maps get/set/remove onto Preferences', async () => {
    const map = new Map();
    const Preferences = {
      get: async ({ key }) => ({ value: map.has(key) ? map.get(key) : null }),
      set: async ({ key, value }) => { map.set(key, value); },
      remove: async ({ key }) => { map.delete(key); },
    };
    const be = preferencesBackend(Preferences);
    expect(await be.get('a')).toBeNull();
    await be.set('a', '1');
    expect(await be.get('a')).toBe('1');
    await be.remove('a');
    expect(await be.get('a')).toBeNull();
  });

  it('localStorageBackend uses the given storage', async () => {
    const m = new Map();
    const ls = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
    const be = localStorageBackend(ls);
    await be.set('k', 'v');
    expect(await be.get('k')).toBe('v');
    await be.remove('k');
    expect(await be.get('k')).toBeNull();
  });

  it('capacitorFs reads and writes inside Directory.Data and lists safely', async () => {
    const files = new Map();
    const calls = [];
    const Filesystem = {
      readdir: async ({ path, directory }) => {
        calls.push(directory);
        if (path === 'missing') throw new Error('no dir');
        return { files: [...files.keys()].map((n, i) => (i % 2 ? n : { name: n })) };
      },
      writeFile: async ({ path, data, directory }) => { calls.push(directory); files.set(path, data); },
      readFile: async ({ path }) => ({ data: files.get(path) }),
      deleteFile: async ({ path }) => { files.delete(path); },
      getUri: async ({ path }) => ({ uri: `file:///data/${path}` }),
    };
    const fs = capacitorFs(Filesystem, { Data: 'DATA' }, { UTF8: 'utf8' });
    await fs.write('a.json', '{}');
    await fs.write('b.json', '[]');
    expect(await fs.list('backups')).toEqual(['a.json', 'b.json']);
    expect(await fs.list('missing')).toEqual([]);
    expect(await fs.read('a.json')).toBe('{}');
    expect(await fs.uri('a.json')).toBe('file:///data/a.json');
    await fs.remove('a.json');
    expect(await fs.list('backups')).toEqual(['b.json']);
    expect(calls.every((d) => d === 'DATA')).toBe(true);
  });
});
