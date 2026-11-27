import { describe, it, expect } from 'vitest';
import { cspFor } from '../vite.config.js';

// نسخة Google Play يجب ألا تتصل بأي خادم (سياسة Play: التحديث من المتجر فقط، وإجابات Data safety = لا بيانات)
describe('Play build CSP', () => {
  const directive = (csp, name) => csp.split('; ').find((d) => d.startsWith(name + ' '));

  it('Play build allows no external connections', () => {
    expect(directive(cspFor(true), 'connect-src')).toBe("connect-src 'self'");
    expect(cspFor(true)).not.toContain('api.github.com');
  });

  it('GitHub (APK) build keeps the update check endpoint only', () => {
    expect(directive(cspFor(false), 'connect-src')).toBe("connect-src 'self' https://api.github.com");
  });

  it('both builds keep the other protections', () => {
    for (const play of [true, false]) {
      const csp = cspFor(play);
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("form-action 'none'");
    }
  });
});
