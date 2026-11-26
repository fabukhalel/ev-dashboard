import { test, expect } from '@playwright/test';

const data = {
  schemaVersion: 2,
  settings: { lang: 'ar', capacity: 60.48, palette: 'lime' },
  charges: [{ id: 'c1', date: '2026-11-03', time: '21:00', socBefore: 20, socAfter: 70, energyKwh: 30.24, pricePerKwh: 0.1, totalCost: 3.024, type: 'home', odometer: 18000, createdAt: 1 }],
  bills: [], odos: [{ id: 'o1', date: '2026-11-10', km: 18400 }], demo: false,
};

// كل قراءة عداد (يدوية أو قديمة محفوظة مع شحنة) تُعدّل وتُحذف من صفحة التحليل
test('odometer readings can be edited and deleted', async ({ page }) => {
  await page.addInitScript((d) => {
    if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('ev-dashboard:data', JSON.stringify(d)); sessionStorage.setItem('seeded', '1'); }
  }, data);
  await page.goto('/#analysis');
  const rows = page.getByTestId('odo-row');
  await expect(rows).toHaveCount(2);

  // تعديل القراءة اليدوية
  await rows.first().click();
  await page.locator('#odo-km').fill('18450');
  await page.getByTestId('odo-save').click();
  await expect(rows.first()).toContainText('18,450');

  // حذف القراءة القديمة المحفوظة مع الشحنة
  await rows.last().click();
  await page.getByTestId('odo-delete').click();
  await page.getByRole('button', { name: 'حذف' }).last().click();
  await expect(rows).toHaveCount(1);
  // الحفظ مؤجَّل قليلاً، ثم الشحنة نفسها تبقى بلا قراءة
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ev-dashboard:data')).charges[0].odometer ?? null)).toBeNull();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ev-dashboard:data')).charges.length)).toBe(1);
});
