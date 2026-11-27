# ملفات متجر Google Play

| الملف | الاستخدام في Play Console | المواصفات المطلوبة |
|---|---|---|
| `play-icon-512.png` | Store listing ▸ App icon | 512×512 PNG، أقل من 1 MB (Play يدوّر الزوايا بنفسه) |
| `feature-graphic-1024x500.png` | Store listing ▸ Feature graphic | 1024×500 PNG/JPEG بدون شفافية |
| `screenshots/ar/*.png` | Phone screenshots (العربية، الأساسية) | 2 إلى 8 صور، 1080×1920 (9:16)، بدون شفافية |
| `screenshots/en/*.png` | Phone screenshots (English) | نفس المواصفات |

إعادة التوليد:

```bash
node scripts/store/render-icons.mjs                     # الأيقونات بكل المقاسات + أيقونة المتجر + الصورة الترويجية
VITE_DISTRIBUTION=play npm run build && npx vite preview --port 4173 &
node scripts/store/screenshots.mjs ar && node scripts/store/screenshots.mjs en
```

سياسة الخصوصية: `docs/privacy.html` تُنشر عبر GitHub Pages على
https://fabukhalel.github.io/ev-dashboard/privacy.html
