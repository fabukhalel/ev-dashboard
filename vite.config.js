import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// نسخة Google Play (VITE_DISTRIBUTION=play): بدون «التحقق من التحديثات» من GitHub، لأن سياسة Play
// تمنع توجيه المستخدم لتحديث التطبيق من خارج المتجر. فلا يتصل التطبيق بالإنترنت إطلاقاً.
const PLAY = process.env.VITE_DISTRIBUTION === 'play';

// سياسة أمان المحتوى (CSP): التطبيق يحمّل ملفاته فقط، والاتصال الخارجي الوحيد (خارج نسخة Play) هو التحقق من التحديثات على GitHub.
// تُضاف في البناء فقط، لأن خادم التطوير يحقن سكربتاً داخلياً لإعادة التحميل السريع.
export const cspFor = (play) => [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'" + (play ? '' : ' https://api.github.com'),
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');
export const CSP = cspFor(PLAY);

const cspPlugin = {
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
};

// base './' => يعمل على GitHub Pages (مسار فرعي) وداخل Capacitor (ملفات محلية)
export default defineConfig({
  base: './',
  plugins: [react(), cspPlugin],
  // رقم الإصدار والبناء وتاريخه لصفحة «حول التطبيق» (رقم البناء من GitHub Actions)
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_NUMBER__: JSON.stringify(process.env.VITE_BUILD_NUMBER || ''),
    __PLAY__: JSON.stringify(PLAY),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  build: { chunkSizeWarningLimit: 900 },
  test: {
    include: ['tests/**/*.test.js'],
    coverage: {
      include: ['src/lib/**', 'src/state/reducer.js'],
      // رسم PDF على canvas والصور والثيم تعتمد على DOM، يغطيها اختبار Playwright؛ i18n قاموس نصوص
      exclude: ['src/lib/report.js', 'src/lib/theme.js', 'src/lib/i18n.jsx'],
      reporter: ['text-summary', 'text'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
});
