import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => يعمل على GitHub Pages (مسار فرعي) وداخل Capacitor (ملفات محلية)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
  test: {
    include: ['tests/**/*.test.js'],
    coverage: {
      include: ['src/lib/**'],
      // رسم PDF على canvas والصور والثيم تعتمد على DOM، يغطيها اختبار Playwright؛ i18n قاموس نصوص
      exclude: ['src/lib/report.js', 'src/lib/image.js', 'src/lib/theme.js', 'src/lib/i18n.jsx'],
      reporter: ['text-summary', 'text'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
});
