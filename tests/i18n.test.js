import { describe, it, expect } from 'vitest';
import { DICT, makeT } from '../src/lib/i18n.jsx';

describe('i18n', () => {
  it('ar and en have exactly the same keys', () => {
    const ar = Object.keys(DICT.ar).sort();
    const en = Object.keys(DICT.en).sort();
    expect(ar.filter((k) => !en.includes(k))).toEqual([]);
    expect(en.filter((k) => !ar.includes(k))).toEqual([]);
  });
  it('no empty strings', () => {
    for (const lang of ['ar', 'en']) for (const [k, v] of Object.entries(DICT[lang])) expect(v, `${lang}.${k}`).not.toBe('');
  });
  it('uses the _one form when n === 1', () => {
    const t = makeT('en');
    expect(t('charges_n', { n: 1 })).toBe('1 charge');
    expect(t('charges_n', { n: 3 })).toBe('3 charges');
  });
});
