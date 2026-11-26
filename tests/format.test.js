import { describe, it, expect } from 'vitest';
import { num, fix, parseNum, formatDate, parseDMY, maskDMY, daysInclusive, weekdayOf, monthLabel, monthShort, shortDM, monthRangeOf } from '../src/lib/format.js';

describe('format', () => {
  it('num / fix', () => {
    expect(num(1234.567, 1)).toBe('1,234.6');
    expect(num(2, 1)).toBe('2');
    expect(fix(2, 2)).toBe('2.00');
    expect(num(NaN)).toBe('—');
    expect(fix(null)).toBe('—');
  });

  it('parseNum accepts Arabic and Persian digits and comma', () => {
    expect(parseNum('٣٥٫٥')).toBe(35.5);
    expect(parseNum('۱۲')).toBe(12);
    expect(parseNum('0,25')).toBe(0.25);
    expect(parseNum(' 42 ')).toBe(42);
    expect(parseNum('')).toBeNull();
    expect(parseNum('abc')).toBeNull();
    expect(parseNum(null)).toBeNull();
  });

  it('dates', () => {
    expect(formatDate('2026-11-06')).toBe('06/11/2026');
    expect(formatDate('bad')).toBe('');
    expect(parseDMY('6/11/2026')).toBe('2026-11-06');
    expect(parseDMY('31/02/2026')).toBeNull();
    expect(parseDMY('29/02/2024')).toBe('2024-02-29');
    expect(maskDMY('٠٦١١2026')).toBe('06/11/2026');
    expect(maskDMY('061')).toBe('06/1');
    expect(daysInclusive('2026-10-06', '2026-11-05')).toBe(31);
    expect(daysInclusive('2026-03-28', '2026-03-30')).toBe(3);
    expect(weekdayOf('2026-11-26', 'ar')).toBe('الخميس');
    expect(weekdayOf('2026-11-26', 'en')).toBe('Thursday');
    expect(monthLabel('2026-11')).toBe('November 2026');
    expect(monthShort('2026-11')).toBe('Nov 26');
    expect(monthShort('2026-11', 'en', false)).toBe('Nov');
    expect(shortDM('2026-11-06')).toBe('06/11');
    expect(monthRangeOf('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });
});
