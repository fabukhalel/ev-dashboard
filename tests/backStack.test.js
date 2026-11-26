import { describe, it, expect } from 'vitest';
import { pushBack, handleBack, backDepth } from '../src/lib/backStack.js';

describe('backStack', () => {
  it('closes the top window first, then nothing', () => {
    const closed = [];
    const popA = pushBack(() => closed.push('a'));
    const popB = pushBack(() => closed.push('b'));
    expect(backDepth()).toBe(2);
    expect(handleBack()).toBe(true);
    expect(closed).toEqual(['b']);
    popB();
    expect(handleBack()).toBe(true);
    expect(closed).toEqual(['b', 'a']);
    popA();
    expect(handleBack()).toBe(false);
    popA(); // إلغاء مكرر لا يكسر شيئاً
    expect(backDepth()).toBe(0);
  });
});
