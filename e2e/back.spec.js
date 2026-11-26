import { test, expect } from '@playwright/test';

// Escape في المتصفح يستخدم نفس مكدس زر الرجوع في أندرويد
test('back closes the top sheet and asks before discarding a filled form', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'إضافة شحنة' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // نموذج فارغ: الرجوع يغلقه مباشرة
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  // نموذج فيه تعديل: الرجوع يسأل أولاً
  await page.getByRole('button', { name: 'إضافة شحنة' }).first().click();
  await dialog.locator('#f-before').fill('25');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('discard-ask')).toBeVisible();
  await page.getByRole('button', { name: 'متابعة' }).click();
  await expect(dialog.locator('#f-before')).toHaveValue('25');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'تجاهل', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
