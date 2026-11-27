// صور شاشة المتجر (Google Play) من نسخة البناء ببيانات تجريبية:
// 1) لقطات خام 1080×1920 (9:16)  2) نفس اللقطات بإطار وعنوان عربي، جاهزة للرفع.
// التشغيل: npm run build && npx vite preview --port 4173 &  ثم  node scripts/store/screenshots.mjs [ar|en]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const LANG = process.argv[2] === 'en' ? 'en' : 'ar';
const BASE = 'http://localhost:4173/';
const OUT = `store/screenshots/${LANG}`;
mkdirSync(`${OUT}/raw`, { recursive: true });

// الترتيب = ترتيب الرفع في Play. أول لقطتين أهم شيء (تظهر في نتائج البحث).
const SHOTS = [
  { id: '1-home', tab: 'home', ar: ['كم شحنت هالدورة؟', 'الكيلوواط والتكلفة وشريحة الكهرباء بنظرة وحدة'], en: ['Your cycle at a glance', 'kWh, cost and your electricity tier'] },
  { id: '2-charges', tab: 'list', ar: ['كل شحنة مسجّلة', 'منزلي أو سريع، مرقّمة ومع يوم الأسبوع'], en: ['Every charge, logged', 'Home or fast, numbered with the weekday'] },
  { id: '3-add', tab: 'list', fab: true, ar: ['سجّل شحنة بثواني', 'الكمية والسعر، والتطبيق يحسب الباقي'], en: ['Log a charge in seconds', 'Enter kWh and price, the rest is automatic'] },
  { id: '4-analysis', tab: 'analysis', ar: ['حلّل استهلاكك', 'الكفاءة والتكلفة لكل كيلومتر'], en: ['Understand your usage', 'Efficiency and cost per km'] },
  { id: '5-bill', tab: 'bill', ar: ['قدّر فاتورة الكهرباء', 'حسب شرائح التعرفة في الأردن'], en: ['Estimate your bill', 'Based on Jordan tariff tiers'] },
  { id: '6-settings', tab: 'settings', ar: ['بياناتك على هاتفك', 'بدون حساب ولا إنترنت، مع نسخ احتياطي'], en: ['Your data stays with you', 'No account, no internet, with backups'] },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, colorScheme: 'dark', locale: LANG === 'ar' ? 'ar-JO' : 'en-US' });

for (const s of SHOTS) {
  // صفحة جديدة لكل لقطة: التبويب يُقرأ من الرابط عند التحميل فقط
  const page = await ctx.newPage();
  await page.goto(BASE + '#' + s.tab);
  if (LANG === 'en') {
    await page.waitForTimeout(1000); // ننتظر حفظ البيانات التجريبية أولاً
    await page.evaluate(() => { for (const k of Object.keys(localStorage)) { const v = localStorage.getItem(k); if (v && v.includes('"lang"')) localStorage.setItem(k, v.replace(/"lang":"ar"/, '"lang":"en"')); } });
    await page.reload();
  }
  await page.waitForSelector('main');
  // نخفي شريط «بيانات تجريبية» حتى تبدو اللقطة كاستخدام حقيقي
  await page.addStyleTag({ content: 'main > div:first-child:has(> button.btn-ghost){display:none!important}' });
  if (s.fab) { await page.click('[data-testid="fab"]'); }
  await page.waitForTimeout(700);
  writeFileSync(`${OUT}/raw/${s.id}.png`, await page.screenshot());
  await page.close();
}

// الإطار: خلفية كحلية، عنوان كهرماني، واللقطة بزوايا مدوّرة
const FONT = (w) => `@font-face{font-family:R;font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(`node_modules/@fontsource/readex-pro/files/readex-pro-arabic-${w}-normal.woff2`).toString('base64')})}`;
const frame = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const s of SHOTS) {
  const [title, sub] = s[LANG];
  const img = readFileSync(`${OUT}/raw/${s.id}.png`).toString('base64');
  await frame.setContent(`<html dir="${LANG === 'ar' ? 'rtl' : 'ltr'}"><head><style>${FONT(400)}${FONT(700)}
    body{margin:0;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(circle at 50% 20%,#16202d,#0d1520 70%);font-family:R,system-ui;text-align:center}
    h1{margin:110px 40px 0;font-size:${LANG === 'en' ? 68 : 82}px;color:#f2b33d;font-weight:700} p{margin:22px 60px 0;font-size:44px;color:#c4cad2}
    img{position:absolute;left:50%;top:430px;transform:translateX(-50%);width:820px;border-radius:56px;border:10px solid #22303f;box-shadow:0 40px 120px -30px #000}
  </style></head><body><h1>${title}</h1><p>${sub}</p><img src="data:image/png;base64,${img}"></body></html>`);
  await frame.evaluate(() => globalThis.document.fonts.ready);
  writeFileSync(`${OUT}/${s.id}.png`, await frame.screenshot());
}
await browser.close();
console.log(`${SHOTS.length} screenshots in ${OUT}`);
