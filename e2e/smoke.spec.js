import { test, expect } from '@playwright/test';

// اختبار دخان: إضافة شحنة، تعديلها، حذفها، التنقل بين التبويبات الخمسة، وتبديل اللغة
test('add, edit, delete a charge; tabs; language', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  // أي مخالفة لسياسة أمان المحتوى (CSP) تُسجَّل وتُفشل الاختبار
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await page.goto('/');
  await expect(page.getByTestId('greeting')).toBeVisible();
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', /script-src 'self'/);

  // إضافة
  await page.getByRole('button', { name: 'إضافة شحنة' }).first().click();
  const form = page.getByRole('dialog');
  await form.locator('#f-before').fill('20');
  await form.locator('#f-after').fill('80');
  await form.getByRole('button', { name: 'حفظ الشحنة' }).click();
  await expect(page.getByText('تم حفظ الشحنة ✓')).toBeVisible();
  // 60% × 60.48 = 36.3 kWh
  await expect(page.getByTestId('total-energy')).toHaveText('36.3');

  // تعديل: الضغط على الشحنة يفتح التفاصيل، ثم «تعديل» يفتح النموذج
  await page.getByTestId('charge-row').first().click();
  await page.getByTestId('detail-edit').click();
  await page.getByRole('dialog').locator('#f-after').fill('90');
  await page.getByRole('dialog').getByRole('button', { name: 'حفظ الشحنة' }).click();
  await expect(page.getByTestId('total-energy')).toHaveText('42.3');

  // حذف من نافذة التفاصيل، ثم تراجع، ثم حذف نهائي
  await page.getByTestId('charge-row').first().click();
  await page.getByTestId('detail-delete').click();
  await expect(page.getByTestId('charge-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'تراجع' }).click();
  await expect(page.getByTestId('charge-row')).toHaveCount(1);
  await page.getByTestId('charge-row').first().click();
  await page.getByTestId('detail-delete').click();
  await expect(page.getByTestId('charge-row')).toHaveCount(0);

  // التبويبات الخمسة
  const nav = page.getByRole('navigation', { name: 'التنقل الرئيسي' });
  for (const name of ['الشحنات', 'التحليل', 'الفاتورة', 'الإعدادات', 'الرئيسية']) {
    await nav.getByRole('button', { name }).click();
    await expect(nav.getByRole('button', { name })).toHaveAttribute('aria-current', 'page');
  }

  // تبديل اللغة
  await nav.getByRole('button', { name: 'الإعدادات' }).click();
  await page.getByTestId('set-look').click();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Home' })).toBeVisible();

  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
});

// السياسة تمنع سكربتاً داخلياً محقوناً (مثال على ما تحمي منه)
test('CSP blocks an injected inline script', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('greeting')).toBeVisible();
  const ran = await page.evaluate(async () => {
    window.__ran = false;
    const s = document.createElement('script');
    s.textContent = 'window.__ran = true';
    document.body.appendChild(s);
    await new Promise((r) => setTimeout(r, 50));
    return window.__ran;
  });
  expect(ran).toBe(false);
});
