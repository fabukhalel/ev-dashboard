// يرسم أيقونة التطبيق (ثيم «ليل عمّان»: كحلي + برق كهرماني + حلقة سماوية) بكل المقاسات:
// أيقونات أندرويد (mipmap)، شاشة البداية، أيقونات PWA، وأيقونة المتجر 512 والصورة الترويجية 1024×500.
// التشغيل: node scripts/store/render-icons.mjs   (يحتاج Playwright المثبّت مع المشروع)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const NAVY = '#0d1520', NAVY2 = '#16202d', AMBER = '#f2b33d', AMBER2 = '#ffd27a', SKY = '#6fd0e8', LIGHT = '#eef2f6';

// الرمز نفسه (حلقة + برق) على شبكة 100×100، يوضع داخل أي إطار
const mark = (ring = SKY) => `
  <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${AMBER2}"/><stop offset="1" stop-color="${AMBER}"/></linearGradient></defs>
  <circle cx="50" cy="50" r="33" fill="none" stroke="${ring}" stroke-opacity=".55" stroke-width="4.5"/>
  <path d="M56.5 13 28.5 56h18.5l-4.5 31 29-44H52.5z" fill="url(#b)"/>`;

const svg = ({ bg = 'none', radius = 0, scale = 1, ring } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  ${bg === 'none' ? '' : `<defs><radialGradient id="g" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="${NAVY}"/></radialGradient></defs>
  ${radius === 'circle' ? '<circle cx="50" cy="50" r="50" fill="url(#g)"/>' : `<rect width="100" height="100" rx="${radius}" fill="${bg === 'grad' ? 'url(#g)' : bg}"/>`}`}
  <g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${mark(ring)}</g>
</svg>`;

const bgOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs><radialGradient id="g" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="${NAVY}"/></radialGradient></defs>
  <rect width="100" height="100" fill="url(#g)"/></svg>`;

const splash = (bg, ring) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect width="100" height="100" fill="${bg}"/><g transform="translate(50 50) scale(.16) translate(-50 -50)">${mark(ring)}</g></svg>`;

const feature = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="100%" height="100%">
  <defs><radialGradient id="g" cx=".25" cy=".4" r=".9"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="${NAVY}"/></radialGradient></defs>
  <rect width="1024" height="500" fill="url(#g)"/>
  <g transform="translate(230 250) scale(3.4) translate(-50 -50)">${mark()}</g>
  <g font-family="Readex Pro, system-ui, sans-serif" text-anchor="start" direction="rtl">
    <text x="950" y="205" font-size="60" font-weight="700" fill="#f3efe6">لوحة الشحن الذكية</text>
    <text x="950" y="275" font-size="34" fill="${AMBER}">كم شحنت، وكم بتدفع على الفاتورة</text>
    <text x="950" y="335" font-size="26" fill="${SKY}">منزلي وسريع · شرائح الكهرباء في الأردن</text>
  </g>
</svg>`;

const RES = 'android/app/src/main/res';
const DENS = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const jobs = [];
for (const [d, px] of Object.entries(DENS)) {
  jobs.push([`${RES}/mipmap-${d}/ic_launcher.png`, svg({ bg: 'grad', radius: 22, scale: 0.92 }), px, px]);
  jobs.push([`${RES}/mipmap-${d}/ic_launcher_round.png`, svg({ bg: 'grad', radius: 'circle', scale: 0.92 }), px, px]);
  // الأيقونة التكيفية: الخلفية والمقدّمة طبقتان، والنظام يقصّها بشكل دائرة/مربع حسب الهاتف
  jobs.push([`${RES}/mipmap-${d}/ic_launcher_foreground.png`, svg({ scale: 0.86 }), px, px]);
  jobs.push([`${RES}/mipmap-${d}/ic_launcher_background.png`, bgOnly, px, px]);
}
const SPL = { ldpi: [240, 320], mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [d, [w, h]] of Object.entries(SPL)) {
  for (const night of [false, true]) {
    const s = night ? splash(NAVY, SKY) : splash(LIGHT, '#0e82a8');
    const n = night ? '-night' : '';
    jobs.push([`${RES}/drawable-port${n}-${d}/splash.png`, s, w, h]);
    jobs.push([`${RES}/drawable-land${n}-${d}/splash.png`, s, d === 'xxxhdpi' ? 1920 : h, d === 'xxxhdpi' ? 1280 : w]);
  }
}
jobs.push([`${RES}/drawable/splash.png`, splash(LIGHT, '#0e82a8'), 320, 480]);
jobs.push([`${RES}/drawable-night/splash.png`, splash(NAVY, SKY), 320, 240]);
// مصادر @capacitor/assets (للتوافق إن أعيد توليد الأيقونات بها)
jobs.push(['assets/icon-only.png', svg({ bg: 'grad', scale: 0.8 }), 1024, 1024]);
jobs.push(['assets/icon-foreground.png', svg({ scale: 0.86 }), 1024, 1024]);
jobs.push(['assets/icon-background.png', bgOnly, 1024, 1024]);
jobs.push(['assets/splash.png', splash(LIGHT, '#0e82a8'), 2732, 2732]);
jobs.push(['assets/splash-dark.png', splash(NAVY, SKY), 2732, 2732]);
// PWA
jobs.push(['public/icon-192.png', svg({ bg: 'grad', radius: 22, scale: 0.9 }), 192, 192]);
jobs.push(['public/icon-512.png', svg({ bg: 'grad', radius: 22, scale: 0.9 }), 512, 512]);
jobs.push(['public/icon-maskable-512.png', svg({ bg: 'grad', scale: 0.7 }), 512, 512]);
// Google Play: أيقونة 512×512 (Play يقصّ الزوايا بنفسه، فالخلفية مربعة كاملة) + صورة ترويجية 1024×500
jobs.push(['store/play-icon-512.png', svg({ bg: 'grad', scale: 0.8 }), 512, 512]);
jobs.push(['store/feature-graphic-1024x500.png', feature, 1024, 500]);

// خط Readex Pro العربي من الحزمة المثبّتة (لنص الصورة الترويجية)
const FONT_DIR = 'node_modules/@fontsource/readex-pro/files';
const face = (w) => `@font-face{font-family:'Readex Pro';font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(`${FONT_DIR}/readex-pro-arabic-${w}-normal.woff2`).toString('base64')}) format('woff2')}`;
const FONTS = `<style>${face(400)}${face(700)}</style>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [out, s, w, h] of jobs) {
  await page.setViewportSize({ width: w, height: h });
  // الخلفية شفافة حتى تبقى طبقة المقدّمة شفافة
  await page.setContent(`<html><head>${FONTS}</head><body style="margin:0;background:transparent">${s.replace('width="100%" height="100%"', `width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"`)}</body></html>`);
  await page.evaluate(() => globalThis.document.fonts.ready);
  await page.waitForTimeout(30);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } }));
}
writeFileSync('public/icon.svg', svg({ bg: 'grad', radius: 22, scale: 0.9 }).replace('width="100%" height="100%"', '').trim() + '\n');
await browser.close();
console.log(`rendered ${jobs.length} images`);
