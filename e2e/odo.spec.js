import { test, expect } from '@playwright/test';

const data = {
  schemaVersion: 2,
  settings: { lang: 'ar', capacity: 60.48, palette: 'amman' },
  charges: [{ id: 'c1', date: '2026-11-03', time: '21:00', socBefore: 20, socAfter: 70, energyKwh: 30.24, pricePerKwh: 0.1, totalCost: 3.024, type: 'home', odometer: 18000, createdAt: 1 }],
  bills: [], odos: [{ id: 'o1', date: '2026-11-10', km: 18400 }], demo: false,
};

// كل قراءة عداد (يدوية أو قديمة محفوظة مع شحنة) تُعدّل وتُحذف من صفحة التحليل
test('odometer readings can be edited and deleted', async ({ page }) => {
  await page.addInitScript((d) => {
    if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('ev-dashboard:data', JSON.stringify(d)); sessionStorage.setItem('seeded', '1'); }
  }, data);
  await page.goto('/#analysis');
  // القراءة اليدوية ظاهرة، والقديمة المحفوظة مع الشحنة مخفية حتى تُفتح
  const manual = page.getByTestId('odo-list').getByTestId('odo-row');
  await expect(manual).toHaveCount(1);
  await expect(page.getByTestId('odo-old-list')).toHaveCount(0);

  // تعديل القراءة اليدوية
  await manual.first().click();
  await page.locator('#odo-km').fill('18450');
  await page.getByTestId('odo-save').click();
  await expect(manual.first()).toContainText('18,450');

  // حذف القراءة القديمة من نافذتها
  await page.getByTestId('odo-old-toggle').click();
  const old = page.getByTestId('odo-old-list').getByTestId('odo-row');
  await expect(old).toHaveCount(1);
  await old.first().click();
  await page.getByTestId('odo-delete').click();
  await page.getByRole('button', { name: 'حذف' }).last().click();
  await expect(page.getByTestId('odo-old-toggle')).toHaveCount(0);
  // الحفظ مؤجَّل قليلاً، ثم الشحنة نفسها تبقى بلا قراءة
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ev-dashboard:data')).charges[0].odometer ?? null)).toBeNull();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ev-dashboard:data')).charges.length)).toBe(1);
});

test('all old per-charge readings can be deleted at once, and charges can be sorted', async ({ page }) => {
  await page.addInitScript((d) => {
    if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('ev-dashboard:data', JSON.stringify(d)); sessionStorage.setItem('seeded', '1'); }
  }, { ...data, charges: [...data.charges, { ...data.charges[0], id: 'c2', date: '2026-11-05', odometer: 18100 }] });
  await page.goto('/#analysis');
  await page.getByTestId('odo-old-toggle').click();
  await expect(page.getByTestId('odo-old-list').getByTestId('odo-row')).toHaveCount(2);
  await page.getByTestId('odo-old-clear').click();
  await page.getByRole('button', { name: 'حذف' }).last().click();
  await expect(page.getByTestId('odo-old-toggle')).toHaveCount(0);
  await expect(page.getByTestId('odo-list').getByTestId('odo-row')).toHaveCount(1);

  // ترتيب الشحنات: الأحدث أولاً ثم الأقدم أولاً
  await page.getByRole('navigation').getByRole('button', { name: 'الشحنات' }).click();
  const days = page.getByTestId('charge-row');
  await expect(days.first()).toContainText('5');
  await page.getByTestId('sort-toggle').click();
  await expect(page.getByTestId('sort-toggle')).toContainText('الأقدم أولاً');
  await expect(days.first()).toContainText('3');
});
