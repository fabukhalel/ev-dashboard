import { describe, it, expect } from 'vitest';
import baseline from './fixtures/baseline.json';
import { baselineFromDemo } from './baseline-calc.js';

describe('baseline (demo data, fixed date)', () => {
  it('matches the recorded numbers from v1.0.0', () => {
    expect(baselineFromDemo()).toEqual(baseline);
  });
});
