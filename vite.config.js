import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => يعمل على GitHub Pages (مسار فرعي) وداخل Capacitor (ملفات محلية)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
});
