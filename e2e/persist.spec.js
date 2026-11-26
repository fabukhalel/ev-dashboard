import { test, expect } from '@playwright/test';

const v1 = {
  settings: { lang: 'ar', capacity: 60.48, userName: 'Fadi' },
  charges: [{ id: 'old1', date: '2026-11-03', time: '21:00', socBefore: 20, socAfter: 70, energyKwh: 30.24, pricePerKwh: 0.1, totalCost: 3.024, type: 'home', createdAt: 1 }],
  bills: [], odos: [], demo: false,
};

test('old v1 data is migrated, and a new charge survives a reload', async ({ page }) => {
  await page.addInitScript((data) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear();
      localStorage.setItem('ev-dashboard:v1', JSON.stringify(data));
      sessionStorage.setItem('seeded', '1');
    }
  }, v1);
  await page.goto('/');
  await expect(page.getByTestId('greeting')).toContainText('Fadi');

  // الشحنة القديمة ظاهرة في قائمة الشحنات
  const nav = page.getByRole('navigation', { name: 'التنقل الرئيسي' });
  await nav.getByRole('button', { name: 'الشحنات' }).click();
  await expect(page.getByTestId('charge-item')).toHaveCount(1);

  // إضافة شحنة ثم إعادة تحميل الصفحة فوراً
  await page.getByRole('button', { name: 'إضافة شحنة' }).first().click();
  await page.getByRole('dialog').locator('#f-before').fill('30');
  await page.getByRole('dialog').locator('#f-after').fill('90');
  await page.getByRole('dialog').getByRole('button', { name: 'حفظ الشحنة' }).click();
  await page.reload();
  await nav.getByRole('button', { name: 'الشحنات' }).click();
  await expect(page.getByTestId('charge-item')).toHaveCount(2);

  // البيانات الجديدة بالشكل v2، والأصل v1 باقٍ كشبكة أمان
  const stored = await page.evaluate(() => ({ data: JSON.parse(localStorage.getItem('ev-dashboard:data')), v1: localStorage.getItem('ev-dashboard:v1') }));
  expect(stored.data.schemaVersion).toBe(2);
  expect(stored.data.charges).toHaveLength(2);
  expect(stored.v1).not.toBeNull();
});
