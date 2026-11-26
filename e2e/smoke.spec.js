import { test, expect } from '@playwright/test';

// اختبار دخان: إضافة شحنة، تعديلها، حذفها، التنقل بين التبويبات الخمسة، وتبديل اللغة
test('add, edit, delete a charge; tabs; language', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('/');
  await expect(page.getByTestId('greeting')).toBeVisible();

  // إضافة
  await page.getByRole('button', { name: 'إضافة شحنة' }).first().click();
  const form = page.getByRole('dialog');
  await form.locator('#f-before').fill('20');
  await form.locator('#f-after').fill('80');
  await form.locator('#f-odo').fill('18000');
  await form.getByRole('button', { name: 'حفظ الشحنة' }).click();
  await expect(page.getByText('تم حفظ الشحنة ✓')).toBeVisible();
  // 60% × 60.48 = 36.3 kWh
  await expect(page.getByTestId('total-energy')).toHaveText('36.3');

  // تعديل
  await page.getByTestId('charge-row').first().click();
  await page.getByRole('dialog').locator('#f-after').fill('90');
  await page.getByRole('dialog').getByRole('button', { name: 'حفظ الشحنة' }).click();
  await expect(page.getByTestId('total-energy')).toHaveText('42.3');

  // حذف (يحتاج نقرتين للتأكيد)
  await page.getByTestId('charge-row').first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'حذف' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /حذف|تأكيد الحذف/ }).last().click();
  await expect(page.getByTestId('charge-row')).toHaveCount(0);

  // التبويبات الخمسة
  const nav = page.getByRole('navigation', { name: 'التنقل الرئيسي' });
  for (const name of ['الشحنات', 'التحليل', 'الفاتورة', 'الإعدادات', 'الرئيسية']) {
    await nav.getByRole('button', { name }).click();
    await expect(nav.getByRole('button', { name })).toHaveAttribute('aria-current', 'page');
  }

  // تبديل اللغة
  await nav.getByRole('button', { name: 'الإعدادات' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Home' })).toBeVisible();

  expect(errors).toEqual([]);
});
