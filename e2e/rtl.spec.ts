import { expect, test } from '@playwright/test';

test('Arabic is right to left', async ({ page }) => {
  await page.goto('/ar/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('the mobile menu opens from the start side in Arabic and English', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [locale, side] of [['ar', 'right'], ['en', 'left']] as const) {
    await page.goto(`/${locale}/`);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const box = (await page.getByTestId('mobile-menu').boundingBox())!;
    if (side === 'right') expect(Math.round(box.x + box.width)).toBe(390);
    else expect(Math.round(box.x)).toBe(0);
  }
});

test('Escape closes the mobile menu and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByTestId('mobile-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('mobile-menu')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
});
