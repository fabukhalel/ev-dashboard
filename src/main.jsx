import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// تسجيل Service Worker للعمل كـ PWA (لا حاجة له داخل تطبيق أندرويد Capacitor)
if ('serviceWorker' in navigator && !Capacitor.isNativePlatform() && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
