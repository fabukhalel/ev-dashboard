import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// base './' => يعمل على GitHub Pages (مسار فرعي) وداخل Capacitor (ملفات محلية)
export default defineConfig({
  base: './',
  plugins: [react()],
  // رقم الإصدار والبناء وتاريخه لصفحة «حول التطبيق» (رقم البناء من GitHub Actions)
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_NUMBER__: JSON.stringify(process.env.VITE_BUILD_NUMBER || ''),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  build: { chunkSizeWarningLimit: 900 },
  test: {
    include: ['tests/**/*.test.js'],
    coverage: {
      include: ['src/lib/**', 'src/state/reducer.js'],
      // رسم PDF على canvas والصور والثيم تعتمد على DOM، يغطيها اختبار Playwright؛ i18n قاموس نصوص
      exclude: ['src/lib/report.js', 'src/lib/image.js', 'src/lib/theme.js', 'src/lib/i18n.jsx'],
      reporter: ['text-summary', 'text'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
});
